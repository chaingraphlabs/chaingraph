# Editable Edges Design Document

## Overview

This document describes the design for implementing editable edges in the ChainGraph visual flow editor. Users will be able to select edges and manipulate their paths by dragging control points (anchors) to create custom curved paths.

## Feature Requirements

### User Experience
1. **Edge Selection**: Click on an edge to select it
2. **Visual Feedback**: Selected edges show control point anchors
3. **Ghost Anchors**: Midpoint anchors appear as semi-transparent "ghost" controls between existing anchors
4. **Drag Control Points**: Dragging an anchor creates/moves it and the curve smoothly passes through all anchors
5. **Dynamic Anchor Creation**: When a ghost anchor is dragged, it becomes a real anchor and two new ghost anchors appear
6. **Anchor Deletion**: Double-click or right-click on an anchor to delete it
7. **Smooth Curves**: Edge path always forms a smooth curve through all anchor points

### Visual Design
```
[Source Node]
      o (source handle)
      |
      o------- ghost anchor (50% opacity, appears on selection)
      |
      ● (real anchor - dragged by user)
      |
      o------- ghost anchor (50% opacity)
      |
      o (target handle)
[Target Node]
```

## Architecture

### 1. Data Model Changes

#### 1.1 Edge Metadata Extension (`packages/chaingraph-types/src/edge/types.ts`)

```typescript
/**
 * Position of a control point anchor
 */
export interface EdgeAnchor {
  /** Unique ID for the anchor */
  id: string
  /** X coordinate relative to flow canvas */
  x: number
  /** Y coordinate relative to flow canvas */
  y: number
  /** Order index in the path (0 = closest to source) */
  index: number
}

/**
 * Extended edge metadata with control points
 */
export interface EdgeMetadata {
  label?: string
  /** Control point anchors defining the edge path */
  anchors?: EdgeAnchor[]
  /** Version number for optimistic updates */
  version?: number
  /** Custom metadata */
  [key: string]: unknown
}
```

#### 1.2 Zod Schema Extension (`packages/chaingraph-types/src/edge/types.zod.ts`)

```typescript
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
```

### 2. Flow Events Extension

#### 2.1 New Event Types (`packages/chaingraph-types/src/flow/events.ts`)

```typescript
export enum FlowEventType {
  // ... existing events ...

  // Edge metadata events
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

#### 2.2 Flow Class Extension (`packages/chaingraph-types/src/flow/flow.ts`)

```typescript
/**
 * Update edge metadata and emit event
 */
async updateEdgeMetadata(edgeId: string, metadata: Partial<EdgeMetadata>): Promise<void> {
  const edge = this.edges.get(edgeId)
  if (!edge) {
    throw new Error(`Edge with ID ${edgeId} does not exist in the flow.`)
  }

  // Update metadata
  edge.updateMetadata(metadata)

  // Emit event
  return this.emitEvent(newEvent(
    this.getNextEventIndex(),
    this.id,
    FlowEventType.EdgeMetadataUpdated,
    {
      edgeId,
      metadata: edge.metadata,
      version: edge.metadata.version ?? 0,
    },
  ))
}
```

### 3. Backend tRPC Procedures

#### 3.1 New Edge Procedures File (`packages/chaingraph-trpc/server/procedures/flow/edge-metadata.ts`)

```typescript
import type { Flow } from '@badaitech/chaingraph-types'
import { z } from 'zod'
import { flowContextProcedure } from '../../trpc'

const EdgeAnchorSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  index: z.number(),
})

/**
 * Update edge anchors (control points)
 */
export const updateEdgeAnchors = flowContextProcedure
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
      if (!flow) {
        throw new Error(`Flow ${flowId} not found`)
      }

      const edge = flow.edges.get(edgeId)
      if (!edge) {
        throw new Error(`Edge ${edgeId} not found in flow ${flowId}`)
      }

      // Version check for optimistic updates
      const currentVersion = edge.metadata.version ?? 0
      if (currentVersion > version) {
        return {
          edgeId,
          anchors: edge.metadata.anchors ?? [],
          version: currentVersion,
          stale: true,
        }
      }

      // Update metadata
      const newVersion = currentVersion + 1
      await flow.updateEdgeMetadata(edgeId, {
        anchors,
        version: newVersion,
      })

      await ctx.flowStore.updateFlow(flow as Flow)

      return {
        edgeId,
        anchors,
        version: newVersion,
        stale: false,
      }
    } finally {
      await ctx.flowStore.unlockFlow(flowId)
    }
  })

/**
 * Add a single anchor at a specific index
 */
export const addEdgeAnchor = flowContextProcedure
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

      // Insert anchor at correct position based on index
      const anchors = [...(edge.metadata.anchors ?? [])]
      anchors.push(anchor)
      anchors.sort((a, b) => a.index - b.index)

      // Reindex all anchors
      anchors.forEach((a, i) => { a.index = i })

      const newVersion = currentVersion + 1
      await flow.updateEdgeMetadata(edgeId, { anchors, version: newVersion })
      await ctx.flowStore.updateFlow(flow as Flow)

      return { edgeId, anchors, version: newVersion, stale: false }
    } finally {
      await ctx.flowStore.unlockFlow(flowId)
    }
  })

/**
 * Remove an anchor by ID
 */
export const removeEdgeAnchor = flowContextProcedure
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

      // Remove and reindex
      const anchors = (edge.metadata.anchors ?? [])
        .filter(a => a.id !== anchorId)
      anchors.forEach((a, i) => { a.index = i })

      const newVersion = currentVersion + 1
      await flow.updateEdgeMetadata(edgeId, { anchors, version: newVersion })
      await ctx.flowStore.updateFlow(flow as Flow)

      return { edgeId, anchors, version: newVersion, stale: false }
    } finally {
      await ctx.flowStore.unlockFlow(flowId)
    }
  })

/**
 * Move a single anchor
 */
export const moveEdgeAnchor = flowContextProcedure
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

      const newVersion = currentVersion + 1
      await flow.updateEdgeMetadata(edgeId, { anchors, version: newVersion })
      await ctx.flowStore.updateFlow(flow as Flow)

      return { edgeId, anchors, version: newVersion, stale: false }
    } finally {
      await ctx.flowStore.unlockFlow(flowId)
    }
  })

/**
 * Clear all anchors (reset to default bezier)
 */
export const clearEdgeAnchors = flowContextProcedure
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

      const newVersion = (edge.metadata.version ?? 0) + 1
      await flow.updateEdgeMetadata(edgeId, { anchors: [], version: newVersion })
      await ctx.flowStore.updateFlow(flow as Flow)

      return { edgeId, anchors: [], version: newVersion, stale: false }
    } finally {
      await ctx.flowStore.unlockFlow(flowId)
    }
  })
```

#### 3.2 Router Registration (`packages/chaingraph-trpc/server/procedures/flow/index.ts`)

```typescript
import {
  updateEdgeAnchors,
  addEdgeAnchor,
  removeEdgeAnchor,
  moveEdgeAnchor,
  clearEdgeAnchors,
} from './edge-metadata'

export const flowProcedures = router({
  // ... existing procedures ...

  // Edge metadata
  updateEdgeAnchors,
  addEdgeAnchor,
  removeEdgeAnchor,
  moveEdgeAnchor,
  clearEdgeAnchors,
})
```

### 4. Frontend Stores

#### 4.1 Edge Selection Store (`apps/chaingraph-frontend/src/store/edges/selection.ts`)

```typescript
import { createEvent, createStore } from 'effector'
import { edgesDomain } from '@/store/domains'
import { globalReset } from '../common'

// Events
export const selectEdge = edgesDomain.createEvent<string | null>()
export const deselectEdge = edgesDomain.createEvent()
export const toggleEdgeSelection = edgesDomain.createEvent<string>()

// Store
export const $selectedEdgeId = edgesDomain.createStore<string | null>(null)
  .on(selectEdge, (_, edgeId) => edgeId)
  .on(deselectEdge, () => null)
  .on(toggleEdgeSelection, (current, edgeId) =>
    current === edgeId ? null : edgeId
  )
  .reset(globalReset)

// Derived: Is any edge selected?
export const $hasEdgeSelected = $selectedEdgeId.map(id => id !== null)
```

#### 4.2 Edge Anchors Store (`apps/chaingraph-frontend/src/store/edges/anchors.ts`)

```typescript
import type { EdgeAnchor } from '@badaitech/chaingraph-types'
import { attach, createEvent, createStore, sample } from 'effector'
import { edgesDomain } from '@/store/domains'
import { globalReset } from '../common'
import { $trpcClient } from '../trpc/store'
import { $activeFlowId } from '../flow'
import { accumulateAndSample } from '../nodes/operators/accumulate-and-sample'

// Constants
const ANCHOR_SYNC_DEBOUNCE_MS = 100 // Batch updates every 100ms

// Types
interface AnchorUpdate {
  edgeId: string
  anchors: EdgeAnchor[]
  version: number
}

interface LocalAnchorState {
  anchors: EdgeAnchor[]
  localVersion: number  // Tracks local optimistic updates
  serverVersion: number // Last known server version
  isDirty: boolean      // Has unsync'd changes
}

// Events
export const setEdgeAnchors = edgesDomain.createEvent<AnchorUpdate>()
export const setEdgeAnchorsLocal = edgesDomain.createEvent<AnchorUpdate>() // Optimistic
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
export const markEdgeDirty = edgesDomain.createEvent<string>()
export const markEdgeClean = edgesDomain.createEvent<string>()

// Store: Edge anchors map (edgeId -> anchor state)
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
  // Local optimistic updates
  .on(setEdgeAnchorsLocal, (state, { edgeId, anchors, version }) => {
    const newState = new Map(state)
    const current = newState.get(edgeId) ?? {
      anchors: [],
      localVersion: 0,
      serverVersion: 0,
      isDirty: false,
    }

    newState.set(edgeId, {
      anchors,
      localVersion: version,
      serverVersion: current.serverVersion,
      isDirty: true,
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

    const anchors = current.anchors
      .filter(a => a.id !== anchorId)
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

// Derived: Get dirty edges for sync
export const $dirtyEdgeIds = $edgeAnchors.map(anchorsMap => {
  const dirtyIds: string[] = []
  anchorsMap.forEach((state, edgeId) => {
    if (state.isDirty) dirtyIds.push(edgeId)
  })
  return dirtyIds
})

// Effects
const syncEdgeAnchorsFx = attach({
  source: { client: $trpcClient, flowId: $activeFlowId, anchorsMap: $edgeAnchors },
  effect: async ({ client, flowId, anchorsMap }, edgeId: string) => {
    if (!client || !flowId) return

    const state = anchorsMap.get(edgeId)
    if (!state || !state.isDirty) return

    const result = await client.flow.updateEdgeAnchors.mutate({
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

// Wire: Dirty edge -> trigger sync
sample({
  clock: [addAnchorLocal, moveAnchorLocal, removeAnchorLocal, clearAnchorsLocal],
  fn: (payload) => 'edgeId' in payload ? payload.edgeId : payload,
  target: markEdgeDirty,
})

// Wire: Throttled sync
sample({
  clock: throttledSyncTrigger,
  target: syncEdgeAnchorsFx,
})

// Hook for components
export function useEdgeAnchors(edgeId: string) {
  const anchorsMap = useUnit($edgeAnchors)
  return anchorsMap.get(edgeId)?.anchors ?? []
}
```

### 5. Curve Algorithm: Catmull-Rom Spline

For smooth curves passing through control points, we'll use a Catmull-Rom spline converted to cubic Bezier segments.

#### 5.1 Path Utilities (`apps/chaingraph-frontend/src/components/flow/edges/utils/catmull-rom.ts`)

```typescript
import type { EdgeAnchor } from '@badaitech/chaingraph-types'

interface Point {
  x: number
  y: number
}

/**
 * Convert Catmull-Rom control points to cubic Bezier path
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
  // Build complete point sequence
  const points: Point[] = [source, ...anchors, target]

  if (points.length === 2) {
    // No anchors: simple straight line
    return `M ${source.x} ${source.y} L ${target.x} ${target.y}`
  }

  if (points.length === 3) {
    // Single anchor: quadratic bezier through point
    const mid = points[1]
    return `M ${source.x} ${source.y} Q ${mid.x} ${mid.y} ${target.x} ${target.y}`
  }

  // Multiple anchors: Catmull-Rom spline
  let path = `M ${points[0].x} ${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    // Calculate Bezier control points from Catmull-Rom
    const cp1 = {
      x: p1.x + (p2.x - p0.x) / (6 * tension),
      y: p1.y + (p2.y - p0.y) / (6 * tension),
    }
    const cp2 = {
      x: p2.x - (p3.x - p1.x) / (6 * tension),
      y: p2.y - (p3.y - p1.y) / (6 * tension),
    }

    path += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`
  }

  return path
}

/**
 * Calculate ghost anchor positions (midpoints between existing points)
 */
export function calculateGhostAnchors(
  source: Point,
  target: Point,
  anchors: EdgeAnchor[],
): Point[] {
  const points: Point[] = [source, ...anchors, target]
  const ghosts: Point[] = []

  for (let i = 0; i < points.length - 1; i++) {
    ghosts.push({
      x: (points[i].x + points[i + 1].x) / 2,
      y: (points[i].y + points[i + 1].y) / 2,
    })
  }

  return ghosts
}

/**
 * Get point on path at parameter t (0-1)
 * Used for positioning ghost anchors on curve
 */
export function getPointOnPath(
  source: Point,
  target: Point,
  anchors: EdgeAnchor[],
  t: number,
): Point {
  const points: Point[] = [source, ...anchors, target]

  if (points.length === 2) {
    // Linear interpolation
    return {
      x: source.x + (target.x - source.x) * t,
      y: source.y + (target.y - source.y) * t,
    }
  }

  // Find segment and local t
  const totalSegments = points.length - 1
  const segmentIndex = Math.min(Math.floor(t * totalSegments), totalSegments - 1)
  const localT = (t * totalSegments) - segmentIndex

  const p0 = points[Math.max(0, segmentIndex - 1)]
  const p1 = points[segmentIndex]
  const p2 = points[segmentIndex + 1]
  const p3 = points[Math.min(points.length - 1, segmentIndex + 2)]

  // Catmull-Rom interpolation
  const t2 = localT * localT
  const t3 = t2 * localT

  return {
    x: 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * localT +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    ),
    y: 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * localT +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    ),
  }
}
```

### 6. Editable Edge Component

#### 6.1 Main Component (`apps/chaingraph-frontend/src/components/flow/edges/EditableEdge.tsx`)

```typescript
import type { EdgeAnchor } from '@badaitech/chaingraph-types'
import type { EdgeProps } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { memo, useCallback, useMemo, useState } from 'react'
import { nanoid } from 'nanoid'
import { useTheme } from '@/components/theme/hooks/useTheme'
import { $selectedEdgeId, selectEdge, deselectEdge } from '@/store/edges/selection'
import {
  $edgeAnchors,
  addAnchorLocal,
  moveAnchorLocal,
  removeAnchorLocal,
} from '@/store/edges/anchors'
import {
  catmullRomToBezierPath,
  calculateGhostAnchors,
} from './utils/catmull-rom'

interface EditableEdgeProps extends EdgeProps {
  data?: {
    animated?: boolean
    edgeData?: {
      edgeId: string
      metadata?: {
        anchors?: EdgeAnchor[]
      }
    }
  }
}

/**
 * Draggable anchor control point
 */
const AnchorHandle = memo(({
  anchor,
  isGhost,
  onDrag,
  onDragEnd,
  onClick,
  onDoubleClick,
}: {
  anchor: { id: string; x: number; y: number; index: number }
  isGhost: boolean
  onDrag: (id: string, x: number, y: number) => void
  onDragEnd: (id: string) => void
  onClick?: (id: string) => void
  onDoubleClick?: (id: string) => void
}) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDragging(true)

    const startX = e.clientX
    const startY = e.clientY
    const anchorX = anchor.x
    const anchorY = anchor.y

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      onDrag(anchor.id, anchorX + dx, anchorY + dy)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      onDragEnd(anchor.id)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [anchor, onDrag, onDragEnd])

  return (
    <circle
      cx={anchor.x}
      cy={anchor.y}
      r={isGhost ? 4 : 6}
      fill={isDragging ? '#10b981' : (isGhost ? 'white' : '#10b981')}
      stroke={isGhost ? '#10b981' : 'white'}
      strokeWidth={2}
      opacity={isGhost ? 0.5 : 1}
      style={{ cursor: 'grab' }}
      onMouseDown={handleMouseDown}
      onClick={() => onClick?.(anchor.id)}
      onDoubleClick={() => onDoubleClick?.(anchor.id)}
    />
  )
})

AnchorHandle.displayName = 'AnchorHandle'

/**
 * Editable edge with draggable control points
 */
export const EditableEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  data,
}: EditableEdgeProps) => {
  const { theme } = useTheme()
  const selectedEdgeId = useUnit($selectedEdgeId)
  const anchorsMap = useUnit($edgeAnchors)

  const isSelected = selectedEdgeId === id
  const edgeId = data?.edgeData?.edgeId ?? id

  // Get anchors from store (local optimistic) or props (server)
  const localState = anchorsMap.get(edgeId)
  const anchors = localState?.anchors ?? data?.edgeData?.metadata?.anchors ?? []

  const source = useMemo(() => ({ x: sourceX, y: sourceY }), [sourceX, sourceY])
  const target = useMemo(() => ({ x: targetX, y: targetY }), [targetX, targetY])

  // Calculate path
  const path = useMemo(
    () => catmullRomToBezierPath(source, target, anchors),
    [source, target, anchors]
  )

  // Calculate ghost anchors (midpoints)
  const ghostAnchors = useMemo(() => {
    if (!isSelected) return []
    const ghosts = calculateGhostAnchors(source, target, anchors)
    return ghosts.map((g, i) => ({
      id: `ghost-${i}`,
      x: g.x,
      y: g.y,
      index: i,
      isGhost: true,
    }))
  }, [isSelected, source, target, anchors])

  // Handlers
  const handleEdgeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    selectEdge(id)
  }, [id])

  const handleAnchorDrag = useCallback((anchorId: string, x: number, y: number) => {
    if (anchorId.startsWith('ghost-')) {
      // Ghost anchor being dragged -> create real anchor
      const ghostIndex = parseInt(anchorId.split('-')[1], 10)
      const newAnchor: EdgeAnchor = {
        id: nanoid(8),
        x,
        y,
        index: ghostIndex,
      }
      addAnchorLocal({ edgeId, anchor: newAnchor })
    } else {
      moveAnchorLocal({ edgeId, anchorId, x, y })
    }
  }, [edgeId])

  const handleAnchorDragEnd = useCallback((anchorId: string) => {
    // Sync will happen via throttled effect
  }, [])

  const handleAnchorDoubleClick = useCallback((anchorId: string) => {
    if (!anchorId.startsWith('ghost-')) {
      removeAnchorLocal({ edgeId, anchorId })
    }
  }, [edgeId])

  const {
    stroke = 'currentColor',
    strokeWidth = 2,
    strokeOpacity = 1,
  } = style as { stroke: string; strokeWidth: number; strokeOpacity: number }

  return (
    <g>
      {/* Clickable hit area (wider than visible path) */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: 'pointer' }}
        onClick={handleEdgeClick}
      />

      {/* Visible path */}
      <path
        d={path}
        fill="none"
        stroke={isSelected ? '#10b981' : stroke}
        strokeWidth={isSelected ? strokeWidth * 1.5 : strokeWidth}
        strokeOpacity={strokeOpacity}
        strokeLinecap="round"
      />

      {/* Selection glow */}
      {isSelected && (
        <path
          d={path}
          fill="none"
          stroke="#10b981"
          strokeWidth={strokeWidth * 3}
          strokeOpacity={0.2}
          strokeLinecap="round"
        />
      )}

      {/* Control points (only when selected) */}
      {isSelected && (
        <>
          {/* Real anchors */}
          {anchors.map(anchor => (
            <AnchorHandle
              key={anchor.id}
              anchor={anchor}
              isGhost={false}
              onDrag={handleAnchorDrag}
              onDragEnd={handleAnchorDragEnd}
              onDoubleClick={handleAnchorDoubleClick}
            />
          ))}

          {/* Ghost anchors */}
          {ghostAnchors.map(ghost => (
            <AnchorHandle
              key={ghost.id}
              anchor={ghost}
              isGhost={true}
              onDrag={handleAnchorDrag}
              onDragEnd={handleAnchorDragEnd}
            />
          ))}
        </>
      )}
    </g>
  )
})

EditableEdge.displayName = 'EditableEdge'
```

### 7. Integration

#### 7.1 Edge Types Registration

```typescript
// apps/chaingraph-frontend/src/components/flow/edges/index.ts
import type { EdgeTypes } from '@xyflow/react'
import { AnimatedEdge } from './AnimatedEdge'
import { EditableEdge } from './EditableEdge'
import { FlowEdge } from './FlowEdge'

export const edgeTypes = {
  animated: AnimatedEdge,
  flow: FlowEdge,
  editable: EditableEdge,
  default: EditableEdge, // Make editable the default
} satisfies EdgeTypes
```

#### 7.2 Edge Render Data Extension

```typescript
// apps/chaingraph-frontend/src/store/edges/types.ts
export interface EdgeRenderData {
  // ... existing fields ...

  /** Control point anchors */
  anchors: EdgeAnchor[]
  /** Metadata version for sync */
  metadataVersion: number
}
```

#### 7.3 Event Handler for Edge Metadata Updates

```typescript
// apps/chaingraph-frontend/src/store/flow/stores.ts
// Add to createEventHandlers:

[FlowEventType.EdgeMetadataUpdated]: (data) => {
  setEdgeAnchors({
    edgeId: data.edgeId,
    anchors: data.metadata.anchors ?? [],
    version: data.version,
  })
},
```

#### 7.4 Click-Away Deselection

```typescript
// apps/chaingraph-frontend/src/components/flow/Flow.tsx
// Add handler for clicking on canvas background:

const handlePaneClick = useCallback(() => {
  deselectEdge()
}, [])

// In ReactFlow component:
<ReactFlow
  // ... existing props ...
  onPaneClick={handlePaneClick}
/>
```

### 8. Optimistic Update Flow

```
User drags anchor
       │
       ▼
addAnchorLocal / moveAnchorLocal / removeAnchorLocal
       │
       ├──────────────────────────────────┐
       ▼                                  ▼
$edgeAnchors updates immediately    markEdgeDirty(edgeId)
(optimistic local state)                  │
       │                                  ▼
       ▼                           accumulateAndSample
UI re-renders with                 (100ms throttle)
new anchor positions                      │
                                          ▼
                                   syncEdgeAnchorsFx
                                          │
                                          ▼
                               tRPC: updateEdgeAnchors
                                          │
                                          ▼
                               Server validates & updates
                                          │
                                          ▼
                               WebSocket: EdgeMetadataUpdated
                                          │
                                          ▼
                               setEdgeAnchors (server confirmed)
                                          │
                                          ▼
                               $edgeAnchors.serverVersion = newVersion
                               isDirty = false
```

### 9. Implementation Order

1. **Phase 1: Types & Backend**
   - Extend EdgeMetadata types with anchors and version
   - Add Zod schemas
   - Create tRPC procedures for edge metadata
   - Add EdgeMetadataUpdated flow event
   - Update Flow class with updateEdgeMetadata method

2. **Phase 2: Frontend Stores**
   - Create edge selection store
   - Create edge anchors store with optimistic updates
   - Wire up throttled sync effect
   - Add event handler for EdgeMetadataUpdated

3. **Phase 3: Curve Algorithm**
   - Implement Catmull-Rom to Bezier conversion
   - Implement ghost anchor calculation
   - Add unit tests for path generation

4. **Phase 4: Edge Component**
   - Create EditableEdge component
   - Implement AnchorHandle with drag handling
   - Register as default edge type
   - Add click-away deselection

5. **Phase 5: Polish & Testing**
   - Add keyboard shortcuts (Delete to remove selected anchor)
   - Add animation for anchor creation/deletion
   - Performance optimization (memoization, debouncing)
   - E2E tests for edge editing flow

### 10. File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `packages/chaingraph-types/src/edge/types.ts` | Modify | Add EdgeAnchor interface, extend EdgeMetadata |
| `packages/chaingraph-types/src/edge/types.zod.ts` | Modify | Add EdgeAnchorSchema, EdgeMetadataSchema |
| `packages/chaingraph-types/src/flow/events.ts` | Modify | Add EdgeMetadataUpdated event type |
| `packages/chaingraph-types/src/flow/flow.ts` | Modify | Add updateEdgeMetadata method |
| `packages/chaingraph-trpc/server/procedures/flow/edge-metadata.ts` | Create | New tRPC procedures for edge anchors |
| `packages/chaingraph-trpc/server/procedures/flow/index.ts` | Modify | Register new edge procedures |
| `apps/chaingraph-frontend/src/store/edges/selection.ts` | Create | Edge selection store |
| `apps/chaingraph-frontend/src/store/edges/anchors.ts` | Create | Edge anchors store with optimistic updates |
| `apps/chaingraph-frontend/src/store/edges/index.ts` | Modify | Export new stores |
| `apps/chaingraph-frontend/src/store/flow/stores.ts` | Modify | Add EdgeMetadataUpdated handler |
| `apps/chaingraph-frontend/src/components/flow/edges/utils/catmull-rom.ts` | Create | Path calculation utilities |
| `apps/chaingraph-frontend/src/components/flow/edges/EditableEdge.tsx` | Create | Editable edge component |
| `apps/chaingraph-frontend/src/components/flow/edges/index.ts` | Modify | Register EditableEdge type |
| `apps/chaingraph-frontend/src/components/flow/Flow.tsx` | Modify | Add pane click handler |

### 11. Performance Considerations

1. **Memoization**: Heavy use of `useMemo` for path calculations
2. **Throttled Sync**: 100ms debounce for server updates during drag
3. **Structural Sharing**: Immutable updates with minimal object creation
4. **Selective Rendering**: Only render anchor handles when edge is selected
5. **SVG Hit Area**: Separate invisible hit area for click detection

### 12. Edge Cases

1. **Concurrent Edits**: Version-based conflict resolution (server wins)
2. **Network Failure**: Local state preserved, retry on reconnect
3. **Node Movement**: Anchors remain in absolute coordinates; consider relative positioning
4. **Edge Deletion**: Clean up anchor state when edge is removed
5. **Undo/Redo**: Future enhancement - store anchor history

---

## Open Questions

1. Should anchors be stored in absolute or relative coordinates?
   - **Absolute**: Simpler implementation, but anchors don't move with nodes
   - **Relative**: More complex, but anchors maintain relative position when nodes move

2. Should we support different curve types (Bezier, straight lines, step)?
   - Current design uses Catmull-Rom for smooth curves through points
   - Could add edge type selector in the future

3. Maximum number of anchors per edge?
   - No limit in current design
   - Consider adding limit (e.g., 10) for performance

4. Keyboard shortcuts?
   - Delete/Backspace: Remove selected anchor
   - Escape: Deselect edge
   - Consider adding these in Phase 5
