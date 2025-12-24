# Editable Edges Design Document v2

## Overview

Add editable control point anchors to existing edge types in ChainGraph's visual flow editor. Users can select edges and drag anchor points to customize edge paths with smooth Catmull-Rom curves.

## Key Design Decisions

| Decision | Choice | Rationale |
| -------- | ------ | --------- |
| Edge types | Extend existing `FlowEdge` and `AnimatedEdge` | No separate "editable" type needed; backwards compatible |
| tRPC structure | Sub-router `client.edge.*` | Clean namespace separation |
| Anchor coordinates | Absolute canvas position | Simpler implementation |
| Node movement | Anchors stay fixed | User can manually re-adjust |
| Anchor selection | Frontend-only state | No backend sync needed for UI state |
| Curve algorithm | Catmull-Rom splines | Smooth curves through all control points |

## User Experience

### Interaction Flow

1. **Select edge**: Click on edge → edge becomes selected (highlighted)
2. **View anchors**: Selected edge shows anchor handles:
   - Real anchors: Solid green circles
   - Ghost anchors: Semi-transparent circles at midpoints
3. **Create anchor**: Drag a ghost anchor → becomes real anchor
4. **Move anchor**: Drag real anchor to new position
5. **Delete anchor**: Double-click anchor OR select anchor + Delete/Backspace key
6. **Deselect**: Click on canvas background or another element

### Visual Design

```
[Source Node]
      o──────────────── source handle
      │
      ○ ─────────────── ghost anchor (50% opacity)
      │
      ● ─────────────── real anchor (solid, draggable)
      │
      ○ ─────────────── ghost anchor (50% opacity)
      │
      o──────────────── target handle
[Target Node]
```

---

## Architecture

### 1. Type System Changes

#### 1.1 Edge Anchor Interface

**File:** `packages/chaingraph-types/src/edge/types.ts`

```typescript
/**
 * Control point anchor for edge path customization
 */
export interface EdgeAnchor {
  /** Unique identifier */
  id: string
  /** Absolute X coordinate on canvas */
  x: number
  /** Absolute Y coordinate on canvas */
  y: number
  /** Order index in path (0 = closest to source) */
  index: number
}

/**
 * Extended edge metadata
 */
export interface EdgeMetadata {
  label?: string
  /** Control point anchors for custom path */
  anchors?: EdgeAnchor[]
  /** Version for optimistic update conflict resolution */
  version?: number
  /** Custom metadata */
  [key: string]: unknown
}
```

#### 1.2 Zod Schema

**File:** `packages/chaingraph-types/src/edge/types.zod.ts`

```typescript
import { z } from 'zod'
import { EdgeStatus } from './types'

export const EdgeAnchorSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  index: z.number(),
})

export const EdgeMetadataSchema = z.object({
  label: z.string().optional(),
  anchors: z.array(EdgeAnchorSchema).optional(),
  version: z.number().optional(),
}).passthrough()

export const SerializedEdgeSchema = z.object({
  id: z.string(),
  metadata: EdgeMetadataSchema.optional(),
  status: z.nativeEnum(EdgeStatus),
  sourceNodeId: z.string(),
  sourcePortId: z.string(),
  targetNodeId: z.string(),
  targetPortId: z.string(),
})

export type SerializedEdge = z.infer<typeof SerializedEdgeSchema>
```

### 2. Flow Events

#### 2.1 New Event Type

**File:** `packages/chaingraph-types/src/flow/events.ts`

```typescript
export enum FlowEventType {
  // ... existing events ...

  /** Edge metadata (anchors, version) updated */
  EdgeMetadataUpdated = 'flow:edge:metadata-updated',
}

/** Data for EdgeMetadataUpdated event */
export interface EdgeMetadataUpdatedEventData {
  edgeId: string
  metadata: EdgeMetadata
  version: number
}

// Add to EventDataMap
export interface EventDataMap {
  // ... existing mappings ...
  [FlowEventType.EdgeMetadataUpdated]: EdgeMetadataUpdatedEventData
}
```

#### 2.2 Flow Class Method

**File:** `packages/chaingraph-types/src/flow/flow.ts`

```typescript
/**
 * Update edge metadata and emit event
 */
async updateEdgeMetadata(edgeId: string, metadata: Partial<EdgeMetadata>): Promise<void> {
  const edge = this.edges.get(edgeId)
  if (!edge) {
    throw new Error(`Edge with ID ${edgeId} does not exist in the flow.`)
  }

  // Merge metadata
  const newVersion = (edge.metadata.version ?? 0) + 1
  edge.updateMetadata({
    ...metadata,
    version: newVersion,
  })

  // Emit event
  return this.emitEvent(newEvent(
    this.getNextEventIndex(),
    this.id,
    FlowEventType.EdgeMetadataUpdated,
    {
      edgeId,
      metadata: edge.metadata,
      version: newVersion,
    },
  ))
}
```

### 3. Backend tRPC Procedures

#### 3.1 Edge Sub-Router Structure

**New folder:** `packages/chaingraph-trpc/server/procedures/edge/`

**File:** `packages/chaingraph-trpc/server/procedures/edge/index.ts`

```typescript
import { router } from '../../trpc'
import { updateAnchors } from './update-anchors'
import { addAnchor } from './add-anchor'
import { moveAnchor } from './move-anchor'
import { removeAnchor } from './remove-anchor'
import { clearAnchors } from './clear-anchors'

export const edgeProcedures = router({
  updateAnchors,
  addAnchor,
  moveAnchor,
  removeAnchor,
  clearAnchors,
})
```

**File:** `packages/chaingraph-trpc/server/router.ts`

```typescript
import { edgeProcedures } from './procedures/edge'

export const appRouter = router({
  flow: flowProcedures,
  edge: edgeProcedures,  // NEW: client.edge.*
  nodeRegistry: nodeRegistryProcedures,
  secrets: secretProcedures,
  mcp: mcpProcedures,
  users: userProcedures,
})
```

#### 3.2 Procedure Implementations

**File:** `packages/chaingraph-trpc/server/procedures/edge/update-anchors.ts`

```typescript
import type { Flow } from '@badaitech/chaingraph-types'
import { z } from 'zod'
import { flowContextProcedure } from '../../trpc'
import { EdgeAnchorSchema } from '@badaitech/chaingraph-types'

export const updateAnchors = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    edgeId: z.string(),
    anchors: z.array(EdgeAnchorSchema),
    version: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { flowId, edgeId, anchors, version } = input

    await ctx.flowStore.lockFlow(flowId)

    try {
      const flow = await ctx.flowStore.getFlow(flowId)
      if (!flow) throw new Error(`Flow ${flowId} not found`)

      const edge = flow.edges.get(edgeId)
      if (!edge) throw new Error(`Edge ${edgeId} not found`)

      // Version check - reject if server has newer version
      const currentVersion = edge.metadata.version ?? 0
      if (currentVersion > version) {
        return {
          edgeId,
          anchors: edge.metadata.anchors ?? [],
          version: currentVersion,
          stale: true,
        }
      }

      // Update metadata (emits EdgeMetadataUpdated event)
      await flow.updateEdgeMetadata(edgeId, { anchors })
      await ctx.flowStore.updateFlow(flow as Flow)

      return {
        edgeId,
        anchors,
        version: currentVersion + 1,
        stale: false,
      }
    } finally {
      await ctx.flowStore.unlockFlow(flowId)
    }
  })
```

**File:** `packages/chaingraph-trpc/server/procedures/edge/add-anchor.ts`

```typescript
export const addAnchor = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    edgeId: z.string(),
    anchor: EdgeAnchorSchema,
    version: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { flowId, edgeId, anchor, version } = input

    await ctx.flowStore.lockFlow(flowId)

    try {
      const flow = await ctx.flowStore.getFlow(flowId)
      if (!flow) throw new Error(`Flow ${flowId} not found`)

      const edge = flow.edges.get(edgeId)
      if (!edge) throw new Error(`Edge ${edgeId} not found`)

      const currentVersion = edge.metadata.version ?? 0
      if (currentVersion > version) {
        return {
          edgeId,
          anchors: edge.metadata.anchors ?? [],
          version: currentVersion,
          stale: true,
        }
      }

      // Insert and re-index anchors
      const anchors = [...(edge.metadata.anchors ?? []), anchor]
        .sort((a, b) => a.index - b.index)
      anchors.forEach((a, i) => { a.index = i })

      await flow.updateEdgeMetadata(edgeId, { anchors })
      await ctx.flowStore.updateFlow(flow as Flow)

      return {
        edgeId,
        anchors,
        version: currentVersion + 1,
        stale: false,
      }
    } finally {
      await ctx.flowStore.unlockFlow(flowId)
    }
  })
```

**File:** `packages/chaingraph-trpc/server/procedures/edge/move-anchor.ts`

```typescript
export const moveAnchor = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    edgeId: z.string(),
    anchorId: z.string(),
    x: z.number(),
    y: z.number(),
    version: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { flowId, edgeId, anchorId, x, y, version } = input

    await ctx.flowStore.lockFlow(flowId)

    try {
      const flow = await ctx.flowStore.getFlow(flowId)
      if (!flow) throw new Error(`Flow ${flowId} not found`)

      const edge = flow.edges.get(edgeId)
      if (!edge) throw new Error(`Edge ${edgeId} not found`)

      const currentVersion = edge.metadata.version ?? 0
      if (currentVersion > version) {
        return {
          edgeId,
          anchors: edge.metadata.anchors ?? [],
          version: currentVersion,
          stale: true,
        }
      }

      const anchors = (edge.metadata.anchors ?? []).map(a =>
        a.id === anchorId ? { ...a, x, y } : a
      )

      await flow.updateEdgeMetadata(edgeId, { anchors })
      await ctx.flowStore.updateFlow(flow as Flow)

      return {
        edgeId,
        anchors,
        version: currentVersion + 1,
        stale: false,
      }
    } finally {
      await ctx.flowStore.unlockFlow(flowId)
    }
  })
```

**File:** `packages/chaingraph-trpc/server/procedures/edge/remove-anchor.ts`

```typescript
export const removeAnchor = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    edgeId: z.string(),
    anchorId: z.string(),
    version: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { flowId, edgeId, anchorId, version } = input

    await ctx.flowStore.lockFlow(flowId)

    try {
      const flow = await ctx.flowStore.getFlow(flowId)
      if (!flow) throw new Error(`Flow ${flowId} not found`)

      const edge = flow.edges.get(edgeId)
      if (!edge) throw new Error(`Edge ${edgeId} not found`)

      const currentVersion = edge.metadata.version ?? 0
      if (currentVersion > version) {
        return {
          edgeId,
          anchors: edge.metadata.anchors ?? [],
          version: currentVersion,
          stale: true,
        }
      }

      // Remove and re-index
      const anchors = (edge.metadata.anchors ?? [])
        .filter(a => a.id !== anchorId)
      anchors.forEach((a, i) => { a.index = i })

      await flow.updateEdgeMetadata(edgeId, { anchors })
      await ctx.flowStore.updateFlow(flow as Flow)

      return {
        edgeId,
        anchors,
        version: currentVersion + 1,
        stale: false,
      }
    } finally {
      await ctx.flowStore.unlockFlow(flowId)
    }
  })
```

**File:** `packages/chaingraph-trpc/server/procedures/edge/clear-anchors.ts`

```typescript
export const clearAnchors = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    edgeId: z.string(),
    version: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { flowId, edgeId, version } = input

    await ctx.flowStore.lockFlow(flowId)

    try {
      const flow = await ctx.flowStore.getFlow(flowId)
      if (!flow) throw new Error(`Flow ${flowId} not found`)

      const edge = flow.edges.get(edgeId)
      if (!edge) throw new Error(`Edge ${edgeId} not found`)

      await flow.updateEdgeMetadata(edgeId, { anchors: [] })
      await ctx.flowStore.updateFlow(flow as Flow)

      return {
        edgeId,
        anchors: [],
        version: (edge.metadata.version ?? 0) + 1,
        stale: false,
      }
    } finally {
      await ctx.flowStore.unlockFlow(flowId)
    }
  })
```

### 4. Frontend Stores

#### 4.1 Edge Selection Store

**File:** `apps/chaingraph-frontend/src/store/edges/selection.ts`

```typescript
import { createEvent, createStore } from 'effector'
import { edgesDomain } from '@/store/domains'
import { globalReset } from '../common'

// Events
export const selectEdge = edgesDomain.createEvent<string | null>()
export const deselectEdge = edgesDomain.createEvent()

// Store
export const $selectedEdgeId = edgesDomain.createStore<string | null>(null)
  .on(selectEdge, (_, edgeId) => edgeId)
  .on(deselectEdge, () => null)
  .reset(globalReset)

// Derived
export const $hasEdgeSelected = $selectedEdgeId.map(id => id !== null)
```

#### 4.2 Anchor Selection Store (Frontend-Only)

**File:** `apps/chaingraph-frontend/src/store/edges/anchor-selection.ts`

```typescript
import { createEvent, createStore } from 'effector'
import { edgesDomain } from '@/store/domains'
import { globalReset } from '../common'
import { deselectEdge } from './selection'

// Events
export const selectAnchor = edgesDomain.createEvent<string | null>()
export const deselectAnchor = edgesDomain.createEvent()

// Store - NOT synced to backend, purely UI state
export const $selectedAnchorId = edgesDomain.createStore<string | null>(null)
  .on(selectAnchor, (_, anchorId) => anchorId)
  .on(deselectAnchor, () => null)
  .reset(deselectEdge) // Deselect anchor when edge deselected
  .reset(globalReset)
```

#### 4.3 Edge Anchors Store with Optimistic Updates

**File:** `apps/chaingraph-frontend/src/store/edges/anchors.ts`

```typescript
import type { EdgeAnchor } from '@badaitech/chaingraph-types'
import { attach, createEvent, createStore, sample } from 'effector'
import { edgesDomain } from '@/store/domains'
import { globalReset } from '../common'
import { $trpcClient } from '../trpc/store'
import { $activeFlowId } from '../flow'
import { accumulateAndSample } from '../nodes/operators/accumulate-and-sample'

const ANCHOR_SYNC_DEBOUNCE_MS = 100

interface LocalAnchorState {
  anchors: EdgeAnchor[]
  localVersion: number
  serverVersion: number
  isDirty: boolean
}

// Events - Server updates
export const setEdgeAnchors = edgesDomain.createEvent<{
  edgeId: string
  anchors: EdgeAnchor[]
  version: number
}>()

// Events - Local optimistic updates
export const addAnchorLocal = edgesDomain.createEvent<{
  edgeId: string
  anchor: EdgeAnchor
}>()
export const moveAnchorLocal = edgesDomain.createEvent<{
  edgeId: string
  anchorId: string
  x: number
  y: number
}>()
export const removeAnchorLocal = edgesDomain.createEvent<{
  edgeId: string
  anchorId: string
}>()
export const clearAnchorsLocal = edgesDomain.createEvent<string>()

// Internal events
const markEdgeDirty = edgesDomain.createEvent<string>()
const markEdgeClean = edgesDomain.createEvent<string>()

// Store
export const $edgeAnchors = edgesDomain.createStore<Map<string, LocalAnchorState>>(new Map())
  // Server updates
  .on(setEdgeAnchors, (state, { edgeId, anchors, version }) => {
    const newState = new Map(state)
    const current = newState.get(edgeId)

    // Only update if server version is newer
    if (current && current.serverVersion >= version) {
      return state
    }

    newState.set(edgeId, {
      anchors,
      localVersion: version,
      serverVersion: version,
      isDirty: false,
    })
    return newState
  })
  // Add anchor locally
  .on(addAnchorLocal, (state, { edgeId, anchor }) => {
    const newState = new Map(state)
    const current = newState.get(edgeId) ?? {
      anchors: [],
      localVersion: 0,
      serverVersion: 0,
      isDirty: false,
    }

    const anchors = [...current.anchors, anchor]
      .sort((a, b) => a.index - b.index)
    anchors.forEach((a, i) => { a.index = i })

    newState.set(edgeId, {
      anchors,
      localVersion: current.localVersion + 1,
      serverVersion: current.serverVersion,
      isDirty: true,
    })
    return newState
  })
  // Move anchor locally
  .on(moveAnchorLocal, (state, { edgeId, anchorId, x, y }) => {
    const newState = new Map(state)
    const current = newState.get(edgeId)
    if (!current) return state

    const anchors = current.anchors.map(a =>
      a.id === anchorId ? { ...a, x, y } : a
    )

    newState.set(edgeId, {
      anchors,
      localVersion: current.localVersion + 1,
      serverVersion: current.serverVersion,
      isDirty: true,
    })
    return newState
  })
  // Remove anchor locally
  .on(removeAnchorLocal, (state, { edgeId, anchorId }) => {
    const newState = new Map(state)
    const current = newState.get(edgeId)
    if (!current) return state

    const anchors = current.anchors.filter(a => a.id !== anchorId)
    anchors.forEach((a, i) => { a.index = i })

    newState.set(edgeId, {
      anchors,
      localVersion: current.localVersion + 1,
      serverVersion: current.serverVersion,
      isDirty: true,
    })
    return newState
  })
  // Clear anchors locally
  .on(clearAnchorsLocal, (state, edgeId) => {
    const newState = new Map(state)
    const current = newState.get(edgeId)
    if (!current) return state

    newState.set(edgeId, {
      anchors: [],
      localVersion: current.localVersion + 1,
      serverVersion: current.serverVersion,
      isDirty: true,
    })
    return newState
  })
  .on(markEdgeClean, (state, edgeId) => {
    const newState = new Map(state)
    const current = newState.get(edgeId)
    if (!current) return state

    newState.set(edgeId, { ...current, isDirty: false })
    return newState
  })
  .reset(globalReset)

// Sync effect
const syncEdgeAnchorsFx = attach({
  source: { client: $trpcClient, flowId: $activeFlowId, anchorsMap: $edgeAnchors },
  effect: async ({ client, flowId, anchorsMap }, edgeId: string) => {
    if (!client || !flowId) return

    const state = anchorsMap.get(edgeId)
    if (!state || !state.isDirty) return

    const result = await client.edge.updateAnchors.mutate({
      flowId,
      edgeId,
      anchors: state.anchors,
      version: state.serverVersion,
    })

    if (!result.stale) {
      markEdgeClean(edgeId)
    }

    return result
  },
})

// Throttled sync trigger
const throttledSyncTrigger = accumulateAndSample({
  source: [markEdgeDirty],
  timeout: ANCHOR_SYNC_DEBOUNCE_MS,
  getKey: edgeId => edgeId,
})

// Wire: Local changes -> mark dirty
sample({
  clock: [addAnchorLocal, moveAnchorLocal, removeAnchorLocal],
  fn: (payload) => payload.edgeId,
  target: markEdgeDirty,
})

sample({
  clock: clearAnchorsLocal,
  target: markEdgeDirty,
})

// Wire: Throttled sync
sample({
  clock: throttledSyncTrigger,
  target: syncEdgeAnchorsFx,
})
```

#### 4.4 Event Handler for EdgeMetadataUpdated

**File:** `apps/chaingraph-frontend/src/store/flow/stores.ts`

Add to `createEventHandlers()` function:

```typescript
[FlowEventType.EdgeMetadataUpdated]: (data) => {
  setEdgeAnchors({
    edgeId: data.edgeId,
    anchors: data.metadata.anchors ?? [],
    version: data.version,
  })
},
```

### 5. Curve Algorithm

#### 5.1 Catmull-Rom to Bezier Conversion

**File:** `apps/chaingraph-frontend/src/components/flow/edges/utils/catmull-rom.ts`

```typescript
import type { EdgeAnchor } from '@badaitech/chaingraph-types'

interface Point {
  x: number
  y: number
}

/**
 * Convert Catmull-Rom spline to SVG cubic Bezier path
 *
 * Catmull-Rom splines pass through all control points with smooth tangents.
 * We convert each segment to cubic Bezier for SVG path compatibility.
 */
export function catmullRomToBezierPath(
  source: Point,
  target: Point,
  anchors: EdgeAnchor[],
  tension: number = 0.5,
): string {
  const points: Point[] = [source, ...anchors, target]

  // No anchors: use default quadratic bezier
  if (points.length === 2) {
    const midX = (source.x + target.x) / 2
    const midY = (source.y + target.y) / 2
    return `M ${source.x} ${source.y} Q ${midX} ${midY} ${target.x} ${target.y}`
  }

  // Single anchor: quadratic bezier through point
  if (points.length === 3) {
    const mid = points[1]
    // Use control points that make curve pass through the anchor
    const cp1x = 2 * mid.x - (source.x + target.x) / 2
    const cp1y = 2 * mid.y - (source.y + target.y) / 2
    return `M ${source.x} ${source.y} Q ${cp1x} ${cp1y} ${target.x} ${target.y}`
  }

  // Multiple points: Catmull-Rom spline
  let path = `M ${points[0].x} ${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    // Calculate Bezier control points from Catmull-Rom
    const t = tension
    const cp1 = {
      x: p1.x + (p2.x - p0.x) / (6 * t),
      y: p1.y + (p2.y - p0.y) / (6 * t),
    }
    const cp2 = {
      x: p2.x - (p3.x - p1.x) / (6 * t),
      y: p2.y - (p3.y - p1.y) / (6 * t),
    }

    path += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`
  }

  return path
}

/**
 * Calculate ghost anchor positions (midpoints on curve)
 */
export function calculateGhostAnchors(
  source: Point,
  target: Point,
  anchors: EdgeAnchor[],
): Array<{ x: number; y: number; insertIndex: number }> {
  const points: Point[] = [source, ...anchors, target]
  const ghosts: Array<{ x: number; y: number; insertIndex: number }> = []

  for (let i = 0; i < points.length - 1; i++) {
    ghosts.push({
      x: (points[i].x + points[i + 1].x) / 2,
      y: (points[i].y + points[i + 1].y) / 2,
      insertIndex: i, // Index where new anchor should be inserted
    })
  }

  return ghosts
}
```

### 6. Edge Component Updates

#### 6.1 AnchorHandle Component

**File:** `apps/chaingraph-frontend/src/components/flow/edges/components/AnchorHandle.tsx`

```typescript
import { memo, useCallback, useState } from 'react'
import { useUnit } from 'effector-react'
import { $selectedAnchorId, selectAnchor } from '@/store/edges/anchor-selection'

interface AnchorHandleProps {
  id: string
  x: number
  y: number
  isGhost: boolean
  edgeColor: string
  onDrag: (id: string, x: number, y: number) => void
  onDragEnd: (id: string) => void
  onDelete: (id: string) => void
}

export const AnchorHandle = memo(({
  id,
  x,
  y,
  isGhost,
  edgeColor,
  onDrag,
  onDragEnd,
  onDelete,
}: AnchorHandleProps) => {
  const selectedAnchorId = useUnit($selectedAnchorId)
  const isSelected = selectedAnchorId === id
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDragging(true)

    // Select this anchor (frontend-only)
    if (!isGhost) {
      selectAnchor(id)
    }

    const startX = e.clientX
    const startY = e.clientY
    const anchorX = x
    const anchorY = y

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      onDrag(id, anchorX + dx, anchorY + dy)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      onDragEnd(id)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [id, x, y, isGhost, onDrag, onDragEnd])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isGhost) {
      onDelete(id)
    }
  }, [id, isGhost, onDelete])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isGhost) {
      selectAnchor(id)
    }
  }, [id, isGhost])

  return (
    <circle
      cx={x}
      cy={y}
      r={isGhost ? 4 : 6}
      fill={isDragging || isSelected ? edgeColor : (isGhost ? 'white' : edgeColor)}
      stroke={isGhost ? edgeColor : 'white'}
      strokeWidth={2}
      opacity={isGhost ? 0.5 : 1}
      style={{ cursor: 'grab' }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    />
  )
})

AnchorHandle.displayName = 'AnchorHandle'
```

#### 6.2 FlowEdge Modifications

**File:** `apps/chaingraph-frontend/src/components/flow/edges/FlowEdge.tsx`

Key changes to existing FlowEdge component:

```typescript
import { useUnit } from 'effector-react'
import { nanoid } from 'nanoid'
import { $selectedEdgeId } from '@/store/edges/selection'
import { $edgeAnchors, addAnchorLocal, moveAnchorLocal, removeAnchorLocal } from '@/store/edges/anchors'
import { catmullRomToBezierPath, calculateGhostAnchors } from './utils/catmull-rom'
import { AnchorHandle } from './components/AnchorHandle'

export const FlowEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  data,
  // ... other props
}: EdgeProps) => {
  const selectedEdgeId = useUnit($selectedEdgeId)
  const anchorsMap = useUnit($edgeAnchors)

  const isSelected = selectedEdgeId === id
  const edgeId = data?.edgeData?.edgeId ?? id

  // Get anchors from local store or edge data
  const localState = anchorsMap.get(edgeId)
  const anchors = localState?.anchors ?? data?.edgeData?.metadata?.anchors ?? []

  // Preserve existing edge color!
  const { stroke = 'currentColor', strokeWidth = 2, strokeOpacity = 1 } = style as {
    stroke: string
    strokeWidth: number
    strokeOpacity: number
  }

  const source = useMemo(() => ({ x: sourceX, y: sourceY }), [sourceX, sourceY])
  const target = useMemo(() => ({ x: targetX, y: targetY }), [targetX, targetY])

  // Calculate path - use custom path if anchors exist, else default
  const pathData = useMemo(() => {
    if (anchors.length > 0) {
      return {
        edgePath: catmullRomToBezierPath(source, target, anchors),
        parallelPath: catmullRomToBezierPath(source, target, anchors),
      }
    }
    // Default bezier path (existing behavior)
    const [edgePath] = getBezierPath({
      sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
    })
    return { edgePath, parallelPath: edgePath }
  }, [source, target, anchors, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition])

  // Ghost anchors (only when selected)
  const ghostAnchors = useMemo(() => {
    if (!isSelected) return []
    return calculateGhostAnchors(source, target, anchors)
  }, [isSelected, source, target, anchors])

  // Handlers
  const handleAnchorDrag = useCallback((anchorId: string, x: number, y: number) => {
    if (anchorId.startsWith('ghost-')) {
      // Ghost anchor dragged -> create real anchor
      const insertIndex = parseInt(anchorId.split('-')[1], 10)
      const newAnchor = {
        id: nanoid(8),
        x,
        y,
        index: insertIndex,
      }
      addAnchorLocal({ edgeId, anchor: newAnchor })
    } else {
      moveAnchorLocal({ edgeId, anchorId, x, y })
    }
  }, [edgeId])

  const handleAnchorDragEnd = useCallback(() => {
    // Sync handled by throttled effect
  }, [])

  const handleAnchorDelete = useCallback((anchorId: string) => {
    removeAnchorLocal({ edgeId, anchorId })
  }, [edgeId])

  return (
    <g>
      {/* Existing path rendering... */}
      <path
        d={pathData.edgePath}
        fill="none"
        stroke={isSelected ? stroke : stroke}
        strokeWidth={isSelected ? strokeWidth * 1.5 : strokeWidth}
        strokeOpacity={strokeOpacity}
        // ...
      />

      {/* Selection highlight */}
      {isSelected && (
        <path
          d={pathData.edgePath}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth * 3}
          strokeOpacity={0.2}
        />
      )}

      {/* Anchor handles (only when selected) */}
      {isSelected && (
        <>
          {/* Real anchors */}
          {anchors.map(anchor => (
            <AnchorHandle
              key={anchor.id}
              id={anchor.id}
              x={anchor.x}
              y={anchor.y}
              isGhost={false}
              edgeColor={stroke}
              onDrag={handleAnchorDrag}
              onDragEnd={handleAnchorDragEnd}
              onDelete={handleAnchorDelete}
            />
          ))}

          {/* Ghost anchors */}
          {ghostAnchors.map((ghost, i) => (
            <AnchorHandle
              key={`ghost-${ghost.insertIndex}`}
              id={`ghost-${ghost.insertIndex}`}
              x={ghost.x}
              y={ghost.y}
              isGhost={true}
              edgeColor={stroke}
              onDrag={handleAnchorDrag}
              onDragEnd={handleAnchorDragEnd}
              onDelete={() => {}}
            />
          ))}
        </>
      )}
    </g>
  )
})
```

### 7. XYFlow Integration

#### 7.1 Flow Component Updates

**File:** `apps/chaingraph-frontend/src/components/flow/Flow.tsx`

```typescript
import { selectEdge, deselectEdge } from '@/store/edges/selection'
import { deselectAnchor } from '@/store/edges/anchor-selection'

// Add edge click handler
const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
  event.stopPropagation()
  selectEdge(edge.id)
}, [])

// Add pane click handler for deselection
const handlePaneClick = useCallback(() => {
  deselectEdge()
  deselectAnchor()
}, [])

// In ReactFlow component:
<ReactFlow
  // ... existing props ...
  onEdgeClick={handleEdgeClick}
  onPaneClick={handlePaneClick}
  deleteKeyCode={['Delete', 'Backspace']}
/>
```

#### 7.2 Edge Selection in useEdgeChanges

**File:** `apps/chaingraph-frontend/src/components/flow/hooks/useEdgeChanges.ts`

```typescript
import { selectEdge, deselectEdge } from '@/store/edges/selection'

// Update the selection case:
case 'select':
  if (change.selected) {
    selectEdge(change.id)
  } else {
    deselectEdge()
  }
  break
```

#### 7.3 Keyboard Handler for Anchor Deletion

**File:** `apps/chaingraph-frontend/src/components/flow/hooks/useEdgeAnchorKeyboard.ts`

```typescript
import { useEffect } from 'react'
import { useUnit } from 'effector-react'
import { $selectedEdgeId } from '@/store/edges/selection'
import { $selectedAnchorId, deselectAnchor } from '@/store/edges/anchor-selection'
import { removeAnchorLocal } from '@/store/edges/anchors'

export function useEdgeAnchorKeyboard() {
  const selectedEdgeId = useUnit($selectedEdgeId)
  const selectedAnchorId = useUnit($selectedAnchorId)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if anchor is selected
      if (!selectedAnchorId || !selectedEdgeId) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Prevent default behavior (ReactFlow might try to delete edge)
        e.preventDefault()
        e.stopPropagation()

        // Remove the selected anchor
        removeAnchorLocal({
          edgeId: selectedEdgeId,
          anchorId: selectedAnchorId,
        })
        deselectAnchor()
      }

      if (e.key === 'Escape') {
        deselectAnchor()
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [selectedAnchorId, selectedEdgeId])
}
```

---

## File Summary

| File | Action | Description |
| ---- | ------ | ----------- |
| `packages/chaingraph-types/src/edge/types.ts` | Modify | Add EdgeAnchor interface, extend EdgeMetadata |
| `packages/chaingraph-types/src/edge/types.zod.ts` | Modify | Add EdgeAnchorSchema |
| `packages/chaingraph-types/src/flow/events.ts` | Modify | Add EdgeMetadataUpdated event |
| `packages/chaingraph-types/src/flow/flow.ts` | Modify | Add updateEdgeMetadata method |
| `packages/chaingraph-trpc/server/procedures/edge/index.ts` | Create | Edge sub-router |
| `packages/chaingraph-trpc/server/procedures/edge/update-anchors.ts` | Create | Batch update procedure |
| `packages/chaingraph-trpc/server/procedures/edge/add-anchor.ts` | Create | Add anchor procedure |
| `packages/chaingraph-trpc/server/procedures/edge/move-anchor.ts` | Create | Move anchor procedure |
| `packages/chaingraph-trpc/server/procedures/edge/remove-anchor.ts` | Create | Remove anchor procedure |
| `packages/chaingraph-trpc/server/procedures/edge/clear-anchors.ts` | Create | Clear anchors procedure |
| `packages/chaingraph-trpc/server/router.ts` | Modify | Add edge sub-router |
| `apps/chaingraph-frontend/src/store/edges/selection.ts` | Create | Edge selection store |
| `apps/chaingraph-frontend/src/store/edges/anchor-selection.ts` | Create | Anchor selection store (frontend-only) |
| `apps/chaingraph-frontend/src/store/edges/anchors.ts` | Create | Edge anchors with optimistic updates |
| `apps/chaingraph-frontend/src/store/edges/index.ts` | Modify | Export new stores |
| `apps/chaingraph-frontend/src/store/flow/stores.ts` | Modify | Add EdgeMetadataUpdated handler |
| `apps/chaingraph-frontend/src/components/flow/edges/utils/catmull-rom.ts` | Create | Curve calculation utilities |
| `apps/chaingraph-frontend/src/components/flow/edges/components/AnchorHandle.tsx` | Create | Draggable anchor component |
| `apps/chaingraph-frontend/src/components/flow/edges/FlowEdge.tsx` | Modify | Add anchor support |
| `apps/chaingraph-frontend/src/components/flow/edges/AnimatedEdge.tsx` | Modify | Add anchor support |
| `apps/chaingraph-frontend/src/components/flow/hooks/useEdgeChanges.ts` | Modify | Handle edge selection |
| `apps/chaingraph-frontend/src/components/flow/hooks/useEdgeAnchorKeyboard.ts` | Create | Keyboard handler |
| `apps/chaingraph-frontend/src/components/flow/Flow.tsx` | Modify | Add XYFlow callbacks |

---

## Backwards Compatibility

1. **Edges without anchors**: Render using default bezier path (existing behavior preserved)
2. **Old serialized flows**: `metadata.anchors` will be `undefined` → treated as empty array
3. **Edge colors**: Preserved via existing `style.stroke` prop from `EdgeRenderData`
4. **Animation**: FlowEdge particle animation continues to work
5. **No data migration**: Anchors are optional metadata, no schema migration needed

---

## Optimistic Update Flow

```
User drags anchor
       │
       ▼
moveAnchorLocal (immediate UI update)
       │
       ├──────────────────────────────────┐
       ▼                                  ▼
$edgeAnchors updates              markEdgeDirty(edgeId)
       │                                  │
       ▼                                  ▼
UI re-renders with              accumulateAndSample
new anchor position              (100ms throttle)
                                          │
                                          ▼
                               syncEdgeAnchorsFx
                                          │
                                          ▼
                               client.edge.updateAnchors
                                          │
                                          ▼
                               Server validates & updates
                               Emits EdgeMetadataUpdated
                                          │
                                          ▼
                               WebSocket subscription
                                          │
                                          ▼
                               setEdgeAnchors (confirm)
                               serverVersion = newVersion
                               isDirty = false
```

---

## Implementation Order

### Phase 1: Types & Backend
1. Extend EdgeMetadata types
2. Add Zod schemas
3. Add EdgeMetadataUpdated flow event
4. Add Flow.updateEdgeMetadata method
5. Create edge tRPC sub-router and procedures
6. Register in main router

### Phase 2: Frontend Stores
1. Create edge selection store
2. Create anchor selection store (frontend-only)
3. Create edge anchors store with optimistic updates
4. Wire EdgeMetadataUpdated event handler
5. Export from index

### Phase 3: Curve Algorithm
1. Implement catmull-rom.ts utilities
2. Add unit tests for path generation

### Phase 4: Edge Components
1. Create AnchorHandle component
2. Modify FlowEdge to support anchors
3. Modify AnimatedEdge similarly
4. Test rendering with and without anchors

### Phase 5: XYFlow Integration
1. Add onEdgeClick handler
2. Add onPaneClick handler
3. Update useEdgeChanges for selection
4. Create useEdgeAnchorKeyboard hook
5. Integrate keyboard handler in Flow.tsx
