# Edge Anchor Enhancements Design Document

**Date**: 2025-01-XX
**Author**: Claude
**Status**: Ready for Implementation

## Table of Contents

1. [Overview](#overview)
2. [Requirements](#requirements)
3. [Architecture](#architecture)
4. [Feature 1: Multi-Node Drag](#feature-1-multi-node-drag-with-anchor-movement)
5. [Feature 2: Anchor Parenting](#feature-2-anchor-parenting-to-groups)
6. [Coordinate System](#coordinate-system)
7. [Implementation Plan](#implementation-plan)
8. [Testing Strategy](#testing-strategy)
9. [Migration & Rollback](#migration--rollback)

---

## Overview

This document describes the implementation of two major enhancements to the edge anchor system:

1. **Multi-Node Drag with Anchor Movement**: When users select and drag multiple nodes, anchors on edges connecting ONLY the dragged nodes will move proportionally with the nodes
2. **Anchor Parenting to Groups**: Anchors can be dropped into group nodes, becoming children with relative positioning (similar to node parenting)

### Business Value

- **Improved UX**: Users expect anchors to maintain their relative positions when moving connected nodes together
- **Complex Layouts**: Anchor parenting enables organizing complex flows where edges route through specific groups
- **Consistency**: Anchors behave like nodes, reducing cognitive load

---

## Requirements

### Functional Requirements

#### FR1: Multi-Node Drag Behavior
- **FR1.1**: Anchors move ONLY when ALL connected nodes (source AND target) are in the dragged selection
- **FR1.2**: If only one endpoint is dragged, anchors remain fixed (current behavior)
- **FR1.3**: Position delta is calculated in absolute coordinate space to handle nested groups
- **FR1.4**: Grid snapping (5x5 pixels) applies after delta application
- **FR1.5**: Final positions sync to server on drag end

#### FR2: Anchor Parenting Behavior
- **FR2.1**: Anchors can be dropped into any group node (no proximity restrictions)
- **FR2.2**: Anchors store relative coordinates when parented to a group
- **FR2.3**: When parent group moves, anchors follow (edge path updates)
- **FR2.4**: When parent group is deleted, anchors convert to absolute coordinates at their current visual position
- **FR2.5**: Anchors can be dragged out of groups, converting back to absolute coordinates
- **FR2.6**: Nested groups (up to 10 levels) are supported

#### FR3: Visual Feedback
- **FR3.1**: No special visual indicators for anchor parent relationships (minimal UI)
- **FR3.2**: Standard drag-drop hover feedback on groups when anchor is being dragged

### Non-Functional Requirements

- **NFR1**: Performance: <16ms per frame during multi-node drag (60fps)
- **NFR2**: Backward compatible: Existing anchors without `parentNodeId` continue working
- **NFR3**: No data migration required
- **NFR4**: Server validates parent relationships on sync

---

## Architecture

### Current System

```
EdgeAnchor (Current):
┌─────────────────────┐
│ id: string          │
│ x: number           │  ← Absolute coordinates only
│ y: number           │
│ index: number       │
└─────────────────────┘

Anchor Storage:
$edgeAnchors: Map<edgeId, LocalAnchorState>
  ├─ anchors: EdgeAnchor[]
  ├─ localVersion: number
  ├─ serverVersion: number
  └─ isDirty: boolean

Multi-Node Drag:
$draggedNodes: DraggedNode[]
  ├─ id, position (relative)
  └─ absolutePosition (flow coords)
```

### Enhanced System

```
EdgeAnchor (Enhanced):
┌─────────────────────┐
│ id: string          │
│ x: number           │  ← Absolute OR relative (depends on parentNodeId)
│ y: number           │
│ index: number       │
│ parentNodeId?: str  │  ← NEW: Group node reference
└─────────────────────┘

New Stores:
┌──────────────────────────────────────────────────────────┐
│ $edgesBetweenDraggedNodes                                │
│   Map<edgeId, { edgeId, sourceNodeId, targetNodeId }>   │
│   ↳ Tracks which edges to update during drag            │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ $initialNodeAbsolutePositions                            │
│   Map<nodeId, Position>                                  │
│   ↳ Starting positions for delta calculation             │
└──────────────────────────────────────────────────────────┘

Coordinate Utilities:
┌──────────────────────────────────────────────────────────┐
│ getAnchorAbsolutePosition(anchor, nodes)                 │
│   ↳ Converts relative → absolute (traverses parent chain)│
│ makeAnchorRelative(pos, parentId, nodes)                 │
│   ↳ Converts absolute → relative                         │
└──────────────────────────────────────────────────────────┘
```

### Event Flow

#### Multi-Node Drag Flow

```
User drags multiple nodes
  ↓
startMultiNodeDrag
  ├─ Store initial absolute positions
  └─ Find edges where BOTH nodes dragged → $edgesBetweenDraggedNodes

updateMultiNodeDragPosition (16ms intervals)
  ├─ Calculate delta: currentAbsolute - initialAbsolute
  ├─ For each edge between dragged nodes:
  │   └─ applyDeltaToAnchors(edgeId, dx, dy)
  │       ├─ Get anchor absolute position
  │       ├─ Add delta
  │       └─ Convert back to relative (if has parent)
  └─ Edge re-renders with new anchor positions

endMultiNodeDrag
  ├─ Trigger onAnchorDragEnd for affected edges
  └─ Sync final positions to server
```

#### Anchor Parenting Flow

```
User drags anchor
  ↓
onMouseDown (AnchorHandle)
  ├─ Calculate potential drop targets (all groups)
  └─ updatePotentialDropTargets([...groups])

onMouseMove
  ├─ Update mouse position in flow coordinates
  └─ Drag-drop store determines hoveredDropTarget

onMouseUp
  ├─ Check hoveredDropTarget
  ├─ If hovering group:
  │   ├─ Convert anchor position to relative
  │   └─ setAnchorParent({ parentNodeId: groupId, newPosition: relative })
  └─ If no hover but has parent:
      ├─ Convert anchor position to absolute
      └─ setAnchorParent({ parentNodeId: undefined, newPosition: absolute })

Parent group moves
  ↓
$nodes changes
  ↓
$edgesWithParentedAnchors detects affected edges
  ↓
Bump edge versions → Edge re-renders with recalculated anchor positions
```

---

## Feature 1: Multi-Node Drag with Anchor Movement

### Problem Statement

Currently, when multiple nodes are dragged together, edges between them stretch but anchors remain fixed at their absolute coordinates. This breaks the visual relationship and forces users to manually reposition anchors after moving node groups.

### Solution Design

**Core Principle**: Calculate position delta in ABSOLUTE coordinate space, then handle coordinate transformations for anchors that have parent groups.

### Implementation Steps

#### Step 1: Track Edges Between Dragged Nodes

**File**: `apps/chaingraph-frontend/src/store/edges/anchor-drag-sync.ts` (NEW)

```typescript
/*
 * Anchor Drag Synchronization
 * Tracks edges between dragged nodes and applies position deltas to their anchors
 */

import { sample } from 'effector'
import type { Position } from '@badaitech/chaingraph-types'
import {
  startMultiNodeDrag,
  updateMultiNodeDragPosition,
  endMultiNodeDrag,
  $draggedNodes,
  dragDropDomain,
} from '@/store/drag-drop'
import { $nodes } from '@/store/nodes'
import { $edgeRenderMap } from './stores'
import { $edgeAnchors, onAnchorDragEnd } from './anchors'
import { edgesDomain } from '@/store/domains'
import { getAnchorAbsolutePosition, makeAnchorRelative } from './anchor-coordinates'

interface EdgeBetweenDraggedNodes {
  edgeId: string
  sourceNodeId: string
  targetNodeId: string
}

// Store: Track which edges connect dragged nodes
export const $edgesBetweenDraggedNodes = edgesDomain
  .createStore<Map<string, EdgeBetweenDraggedNodes>>(new Map())
  .reset(endMultiNodeDrag)

// Store: Initial absolute positions for delta calculation
export const $initialNodeAbsolutePositions = dragDropDomain
  .createStore<Map<string, Position>>(new Map())
  .on(startMultiNodeDrag, (_, events) => {
    const positions = new Map()
    events.forEach(e => positions.set(e.nodeId, e.absolutePosition))
    return positions
  })
  .reset(endMultiNodeDrag)

// Wire: On drag start → find edges between dragged nodes
sample({
  clock: startMultiNodeDrag,
  source: { edgeMap: $edgeRenderMap, nodes: $nodes },
  fn: ({ edgeMap, nodes }, dragEvents) => {
    const draggedNodeIds = new Set(dragEvents.map(e => e.nodeId))
    const edgesBetween = new Map<string, EdgeBetweenDraggedNodes>()

    for (const [edgeId, edge] of edgeMap) {
      if (!edge.isReady) continue

      // Only track edges where BOTH source AND target are dragged
      if (draggedNodeIds.has(edge.source) && draggedNodeIds.has(edge.target)) {
        edgesBetween.set(edgeId, {
          edgeId,
          sourceNodeId: edge.source,
          targetNodeId: edge.target,
        })
      }
    }

    return edgesBetween
  },
  target: $edgesBetweenDraggedNodes,
})

// Wire: On drag position update → apply delta to anchors
sample({
  clock: updateMultiNodeDragPosition,
  source: {
    initialPositions: $initialNodeAbsolutePositions,
    edgesBetween: $edgesBetweenDraggedNodes,
    edgeAnchors: $edgeAnchors,
    nodes: $nodes,
  },
  fn: ({ initialPositions, edgesBetween, edgeAnchors, nodes }, dragEvents) => {
    if (dragEvents.length === 0) return []

    // Calculate delta from first dragged node (all move together)
    const firstEvent = Array.isArray(dragEvents) ? dragEvents[0] : dragEvents
    const initialPos = initialPositions.get(firstEvent.nodeId)
    if (!initialPos) return []

    const dx = firstEvent.absolutePosition.x - initialPos.x
    const dy = firstEvent.absolutePosition.y - initialPos.y

    // Skip if no movement
    if (dx === 0 && dy === 0) return []

    // Apply delta to edges between dragged nodes
    const updates: Array<{ edgeId: string, dx: number, dy: number }> = []
    for (const edge of edgesBetween.values()) {
      const anchorState = edgeAnchors.get(edge.edgeId)
      if (!anchorState || anchorState.anchors.length === 0) continue
      updates.push({ edgeId: edge.edgeId, dx, dy })
    }

    return updates
  },
  target: applyDeltaToAnchors.prepend(updates => updates),
})

// Wire: On drag end → sync affected edges
sample({
  clock: endMultiNodeDrag,
  source: $edgesBetweenDraggedNodes,
  fn: (edgesBetween) => {
    return Array.from(edgesBetween.keys())
  },
  filter: edgeIds => edgeIds.length > 0,
  target: onAnchorDragEnd.prepend(edgeIds => {
    edgeIds.forEach(id => onAnchorDragEnd(id))
  }),
})
```

#### Step 2: Apply Delta with Coordinate Handling

**File**: `apps/chaingraph-frontend/src/store/edges/anchors.ts` (MODIFY)

Add new event and store handler:

```typescript
import { getAnchorAbsolutePosition, makeAnchorRelative } from './anchor-coordinates'

// Event: Apply position delta to anchors
export const applyDeltaToAnchors = edgesDomain.createEvent<Array<{
  edgeId: string
  dx: number
  dy: number
}>>()

// Store handler
$edgeAnchors
  .on(applyDeltaToAnchors, (state, updates) => {
    if (updates.length === 0) return state

    const newState = new Map(state)
    const nodes = $nodes.getState()

    for (const { edgeId, dx, dy } of updates) {
      const current = newState.get(edgeId)
      if (!current) continue

      // Apply delta in absolute space, handle coordinate conversion
      const anchors = current.anchors.map(a => {
        // Step 1: Get current absolute position
        const absolutePos = a.parentNodeId
          ? getAnchorAbsolutePosition(a, nodes)
          : { x: a.x, y: a.y }

        // Step 2: Apply delta in absolute space
        const newAbsolutePos = {
          x: absolutePos.x + dx,
          y: absolutePos.y + dy,
        }

        // Step 3: Convert back to relative if has parent
        const newPos = a.parentNodeId
          ? makeAnchorRelative(newAbsolutePos, a.parentNodeId, nodes)
          : newAbsolutePos

        return {
          ...a,
          x: snapToGrid(newPos.x),
          y: snapToGrid(newPos.y),
        }
      })

      newState.set(edgeId, {
        anchors,
        localVersion: current.localVersion + 1,
        serverVersion: current.serverVersion,
        isDirty: true,
      })
    }

    return newState
  })
```

#### Step 3: Import Wiring

**File**: `apps/chaingraph-frontend/src/store/edges/index.ts` (MODIFY)

```typescript
// Import anchor-drag-sync for side effects (wiring)
import './anchor-drag-sync'
```

---

## Feature 2: Anchor Parenting to Groups

### Problem Statement

Anchors are currently always in absolute coordinates. Users cannot organize edges to route through specific groups or maintain anchor positions relative to group movements.

### Solution Design

**Core Principle**: Anchors behave like nodes - they can have a parent group and store relative coordinates.

### Implementation Steps

#### Step 1: Type System Changes

**File**: `packages/chaingraph-types/src/edge/types.ts` (MODIFY)

```typescript
export interface EdgeAnchor {
  /** Unique identifier */
  id: string

  /** X coordinate (absolute if no parent, relative if parentNodeId is set) */
  x: number

  /** Y coordinate (absolute if no parent, relative if parentNodeId is set) */
  y: number

  /** Order index in path (0 = closest to source) */
  index: number

  /** Parent group node ID (if anchor is child of a group) */
  parentNodeId?: string
}
```

**File**: `packages/chaingraph-types/src/edge/types.zod.ts` (MODIFY)

```typescript
export const EdgeAnchorSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  index: z.number(),
  parentNodeId: z.string().optional(),
})
```

#### Step 2: Coordinate Transformation Utilities

**File**: `apps/chaingraph-frontend/src/store/edges/anchor-coordinates.ts` (NEW)

```typescript
/*
 * Anchor Coordinate Transformation Utilities
 * Handles conversion between absolute and relative coordinates for anchors with parent groups
 */

import type { EdgeAnchor, INode, Position } from '@badaitech/chaingraph-types'
import { getNodePositionInFlow, getNodePositionInsideParent } from '@/components/flow/utils/node-position'

/**
 * Get absolute position of anchor (accounting for parent chain)
 *
 * CRITICAL: Handles nested groups by traversing up the parent chain
 *
 * @param anchor - Anchor to get absolute position for
 * @param nodes - Record of all nodes (for parent lookup)
 * @returns Absolute position in flow coordinate space
 */
export function getAnchorAbsolutePosition(
  anchor: EdgeAnchor,
  nodes: Record<string, INode>
): Position {
  // No parent → already absolute
  if (!anchor.parentNodeId) {
    return { x: anchor.x, y: anchor.y }
  }

  const parent = nodes[anchor.parentNodeId]
  if (!parent || !parent.metadata.ui?.position) {
    console.warn(`[anchor-coordinates] Parent node ${anchor.parentNodeId} not found for anchor ${anchor.id}`)
    return { x: anchor.x, y: anchor.y }
  }

  // Get parent's absolute position (handles nested groups recursively)
  const parentAbsolutePos = getAbsoluteNodePosition(anchor.parentNodeId, nodes)
  if (!parentAbsolutePos) {
    return { x: anchor.x, y: anchor.y }
  }

  // Convert relative to absolute: absolute = relative + parentAbsolute
  return {
    x: parentAbsolutePos.x + anchor.x,
    y: parentAbsolutePos.y + anchor.y,
  }
}

/**
 * Convert anchor from absolute to relative coordinates
 *
 * @param anchorAbsolutePos - Anchor's absolute position
 * @param parentNodeId - Parent group node ID
 * @param nodes - Record of all nodes
 * @returns Relative position inside parent
 */
export function makeAnchorRelative(
  anchorAbsolutePos: Position,
  parentNodeId: string,
  nodes: Record<string, INode>
): Position {
  const parent = nodes[parentNodeId]
  if (!parent) {
    console.warn(`[anchor-coordinates] Parent node ${parentNodeId} not found`)
    return anchorAbsolutePos
  }

  const parentAbsolutePos = getAbsoluteNodePosition(parentNodeId, nodes)
  if (!parentAbsolutePos) {
    return anchorAbsolutePos
  }

  // Convert absolute to relative: relative = absolute - parentAbsolute
  return getNodePositionInsideParent(anchorAbsolutePos, parentAbsolutePos)
}

/**
 * Get absolute position of node (handles nested groups)
 * Reused from node drag handling logic
 *
 * @param nodeId - Node ID
 * @param nodes - Record of all nodes
 * @returns Absolute position or null if not found
 */
function getAbsoluteNodePosition(
  nodeId: string,
  nodes: Record<string, INode>
): Position | null {
  const node = nodes[nodeId]
  if (!node || !node.metadata.ui?.position) {
    return null
  }

  let absolutePosition = { ...node.metadata.ui.position }
  let currentNode = node

  // Traverse up parent chain, accumulating positions
  while (currentNode.metadata.parentNodeId) {
    const parentNode = nodes[currentNode.metadata.parentNodeId]
    if (!parentNode || !parentNode.metadata.ui?.position) {
      break
    }

    absolutePosition = getNodePositionInFlow(
      absolutePosition,
      parentNode.metadata.ui.position
    )
    currentNode = parentNode
  }

  return absolutePosition
}
```

#### Step 3: Anchor Drag with Drop Detection

**File**: `apps/chaingraph-frontend/src/components/flow/edges/components/AnchorHandle.tsx` (MODIFY)

Add imports:
```typescript
import { useUnit } from 'effector-react'
import { $nodes } from '@/store/nodes'
import { $hoveredDropTarget, updatePotentialDropTargets, clearDropTargets } from '@/store/drag-drop'
import { setAnchorParent } from '@/store/edges/anchors'
import { getAnchorAbsolutePosition, makeAnchorRelative } from '@/store/edges/anchor-coordinates'
import { calculateNodeDepth, calculateDropPriority } from '@/components/flow/hooks/useFlowUtils'
```

Modify `handleMouseDown`:
```typescript
const handleMouseDown = useCallback((e: React.MouseEvent) => {
  e.stopPropagation()
  e.preventDefault()
  setIsDragging(true)
  startDraggingAnchor()

  // Existing drag setup...
  const startFlow = screenToFlowPosition({ x: e.clientX, y: e.clientY })
  const startRef = { x: e.clientX, y: e.clientY }

  // NEW: Calculate potential drop targets (all groups)
  const nodes = $nodes.getState()
  const groupNodes = Object.values(nodes).filter(n =>
    n.metadata.category === 'group' &&
    n.metadata.ui?.dimensions?.width &&
    n.metadata.ui?.dimensions?.height
  )

  // Create drop targets with absolute bounds
  const dropTargets = groupNodes.map(node => {
    const absolutePos = getAbsoluteNodePosition(node.id, nodes)
    if (!absolutePos) return null

    return {
      nodeId: node.id,
      type: 'group' as const,
      bounds: {
        x: absolutePos.x,
        y: absolutePos.y,
        width: node.metadata.ui!.dimensions!.width,
        height: node.metadata.ui!.dimensions!.height,
      },
      depth: calculateNodeDepth(node.id, nodes),
      priority: calculateDropPriority({
        type: 'group',
        depth: calculateNodeDepth(node.id, nodes)
      }),
    }
  }).filter(Boolean)

  updatePotentialDropTargets(dropTargets)

  // ... rest of existing drag logic ...
}, [id, edgeId, x, y, screenToFlowPosition, isGhost, onDrag])
```

Modify `handleMouseUp`:
```typescript
const handleMouseUp = useCallback((e: MouseEvent) => {
  // ... existing cleanup logic ...

  // NEW: Check if dropped on group
  const hoveredTarget = $hoveredDropTarget.getState()
  const nodes = $nodes.getState()
  const currentAnchor = $edgeAnchors.getState().get(edgeId)?.anchors.find(a => a.id === id)

  if (hoveredTarget && hoveredTarget.type === 'group') {
    // Dropped on group → make anchor a child
    const anchorAbsolutePos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    const relativePos = makeAnchorRelative(anchorAbsolutePos, hoveredTarget.nodeId, nodes)

    setAnchorParent({
      edgeId,
      anchorId: id,
      parentNodeId: hoveredTarget.nodeId,
      newPosition: relativePos,
    })
  } else if (currentAnchor?.parentNodeId && !hoveredTarget) {
    // Dragged out of group → convert to absolute
    const anchorAbsolutePos = getAnchorAbsolutePosition(currentAnchor, nodes)

    setAnchorParent({
      edgeId,
      anchorId: id,
      parentNodeId: undefined,
      newPosition: anchorAbsolutePos,
    })
  }

  clearDropTargets()
  stopDraggingAnchor()
  setIsDragging(false)
}, [id, edgeId, screenToFlowPosition, onDragEnd])
```

Helper function (add to file):
```typescript
function getAbsoluteNodePosition(nodeId: string, nodes: Record<string, INode>): Position | null {
  const node = nodes[nodeId]
  if (!node || !node.metadata.ui?.position) return null

  let absolutePosition = { ...node.metadata.ui.position }
  let currentNode = node

  while (currentNode.metadata.parentNodeId) {
    const parentNode = nodes[currentNode.metadata.parentNodeId]
    if (!parentNode || !parentNode.metadata.ui?.position) break

    absolutePosition = {
      x: absolutePosition.x + parentNode.metadata.ui.position.x,
      y: absolutePosition.y + parentNode.metadata.ui.position.y,
    }
    currentNode = parentNode
  }

  return absolutePosition
}
```

#### Step 4: Anchor Parent Assignment

**File**: `apps/chaingraph-frontend/src/store/edges/anchors.ts` (MODIFY)

Add new event and handler:

```typescript
// Event: Set or clear anchor parent
export const setAnchorParent = edgesDomain.createEvent<{
  edgeId: string
  anchorId: string
  parentNodeId: string | undefined
  newPosition: Position
}>()

// Store handler
$edgeAnchors
  .on(setAnchorParent, (state, { edgeId, anchorId, parentNodeId, newPosition }) => {
    const newState = new Map(state)
    const current = newState.get(edgeId)
    if (!current) return state

    const anchors = current.anchors.map(a =>
      a.id === anchorId
        ? {
            ...a,
            x: snapToGrid(newPosition.x),
            y: snapToGrid(newPosition.y),
            parentNodeId,
          }
        : a
    )

    newState.set(edgeId, {
      anchors,
      localVersion: current.localVersion + 1,
      serverVersion: current.serverVersion,
      isDirty: true,
    })
    return newState
  })
```

Add parent deletion handler:

```typescript
// Function: Clear anchor parents when group is deleted
export function clearAnchorParentsForDeletedNode(deletedNodeId: string) {
  const edgeAnchors = $edgeAnchors.getState()
  const nodes = $nodes.getState()

  for (const [edgeId, state] of edgeAnchors) {
    const affectedAnchors = state.anchors.filter(a => a.parentNodeId === deletedNodeId)

    if (affectedAnchors.length > 0) {
      affectedAnchors.forEach(anchor => {
        // Convert to absolute position before clearing parent
        const absolutePos = getAnchorAbsolutePosition(anchor, nodes)

        setAnchorParent({
          edgeId,
          anchorId: anchor.id,
          parentNodeId: undefined,
          newPosition: absolutePos,
        })
      })
    }
  }
}
```

#### Step 5: Edge Rendering with Parented Anchors

**File**: `apps/chaingraph-frontend/src/components/flow/edges/FlowEdge.tsx` (MODIFY)

Add imports and convert anchors before rendering:

```typescript
import { useUnit } from 'effector-react'
import { $nodes } from '@/store/nodes'
import { getAnchorAbsolutePosition } from '@/store/edges/anchor-coordinates'

// Inside FlowEdge component:
const nodes = useUnit($nodes)

// Convert anchors to absolute coordinates for rendering
const absoluteAnchors = useMemo(() => {
  return anchors.map(anchor => ({
    ...anchor,
    ...getAnchorAbsolutePosition(anchor, nodes),
  }))
}, [anchors, nodes])

// Use absoluteAnchors in path calculation
const pathData = useMemo(() => {
  const edgePath = catmullRomToBezierPath(
    source,
    target,
    absoluteAnchors,  // Changed from 'anchors'
    sourcePosition,
    targetPosition,
  )
  return { edgePath, parallelPath: edgePath }
}, [source, target, absoluteAnchors, sourcePosition, targetPosition, curveConfig])
```

**File**: `apps/chaingraph-frontend/src/components/flow/edges/AnimatedEdge.tsx` (MODIFY)

Apply the same changes as FlowEdge.tsx.

#### Step 6: Parent Position Change Tracking

**File**: `apps/chaingraph-frontend/src/store/edges/anchor-parent-sync.ts` (NEW)

```typescript
/*
 * Anchor Parent Synchronization
 * Tracks parent node position changes and triggers edge re-renders
 */

import { combine, sample } from 'effector'
import { $nodes } from '@/store/nodes'
import { $edgeAnchors } from './anchors'
import { edgeDataChanged } from './stores'

// Compute which edges have parented anchors
const $edgesWithParentedAnchors = combine(
  $edgeAnchors,
  (edgeAnchors) => {
    const edgeIds = new Set<string>()
    for (const [edgeId, state] of edgeAnchors) {
      if (state.anchors.some(a => a.parentNodeId)) {
        edgeIds.add(edgeId)
      }
    }
    return edgeIds
  }
)

// Wire: When nodes change, bump affected edges
sample({
  clock: $nodes,
  source: $edgesWithParentedAnchors,
  fn: (edgesWithParentedAnchors) => {
    if (edgesWithParentedAnchors.size === 0) return { changes: [] }

    const changes = Array.from(edgesWithParentedAnchors).map(edgeId => ({
      edgeId,
      changes: {},  // Just bump version to trigger re-render
    }))
    return { changes }
  },
  filter: ({ changes }) => changes.length > 0,
  target: edgeDataChanged,
})
```

#### Step 7: Parent Deletion Handling

**File**: `apps/chaingraph-frontend/src/store/nodes/stores.ts` (MODIFY)

Add handler in flow event processing:

```typescript
import { clearAnchorParentsForDeletedNode } from '@/store/edges/anchors'

// In flow event handler:
[FlowEventType.NodeRemoved]: (data) => {
  const removedNode = $nodes.getState()[data.nodeId]
  removeNode(data.nodeId)

  // NEW: If deleted node was a group, clear anchor parents
  if (removedNode?.metadata.category === 'group') {
    clearAnchorParentsForDeletedNode(data.nodeId)
  }
}
```

#### Step 8: Import Parent Sync Wiring

**File**: `apps/chaingraph-frontend/src/store/edges/index.ts` (MODIFY)

```typescript
// Import anchor-parent-sync for side effects (wiring)
import './anchor-parent-sync'
```

#### Step 9: Backend Validation

**File**: `packages/chaingraph-trpc/server/procedures/edge/update-anchors.ts` (MODIFY)

Add validation before saving:

```typescript
// Validate parent nodes exist and are groups
for (const anchor of input.anchors) {
  if (anchor.parentNodeId) {
    const parentNode = flow.nodes.get(anchor.parentNodeId)

    if (!parentNode) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Parent node ${anchor.parentNodeId} not found for anchor ${anchor.id}`,
      })
    }

    if (parentNode.metadata.category !== 'group') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Parent node ${anchor.parentNodeId} is not a group node`,
      })
    }
  }
}
```

---

## Coordinate System

### THE GOLDEN RULE

**All calculations happen in ABSOLUTE coordinate space.**

When nodes and anchors can both be inside groups (potentially different groups), working in absolute coordinates is the only way to ensure correct transformations.

### Coordinate Transformation Rules

#### Multi-Node Drag Delta Application

```
Input: Node moved from initialAbsolute to currentAbsolute
Output: Anchor new position

1. Get anchor absolute position:
   if anchor.parentNodeId:
     anchorAbsolute = anchor.relative + getAbsoluteNodePosition(anchor.parentNodeId)
   else:
     anchorAbsolute = anchor.position

2. Calculate delta:
   dx = currentAbsolute.x - initialAbsolute.x
   dy = currentAbsolute.y - initialAbsolute.y

3. Apply delta:
   newAnchorAbsolute = anchorAbsolute + delta

4. Convert back if has parent:
   if anchor.parentNodeId:
     parentAbsolute = getAbsoluteNodePosition(anchor.parentNodeId)
     newAnchorRelative = newAnchorAbsolute - parentAbsolute
     anchor.x = newAnchorRelative.x
     anchor.y = newAnchorRelative.y
   else:
     anchor.x = newAnchorAbsolute.x
     anchor.y = newAnchorAbsolute.y

5. Apply grid snapping:
   anchor.x = snapToGrid(anchor.x)
   anchor.y = snapToGrid(anchor.y)
```

#### Anchor Rendering

```
Input: Edge anchor (may have parentNodeId)
Output: Absolute position for path calculation

for each anchor in edge.anchors:
  if anchor.parentNodeId:
    parentAbsolute = getAbsoluteNodePosition(anchor.parentNodeId)
    absoluteAnchor = {
      x: anchor.x + parentAbsolute.x,
      y: anchor.y + parentAbsolute.y
    }
  else:
    absoluteAnchor = { x: anchor.x, y: anchor.y }

  absoluteAnchors.push(absoluteAnchor)

edgePath = catmullRomToBezierPath(source, target, absoluteAnchors, ...)
```

#### Anchor Drop on Group

```
Input: Anchor dropped at screenPos over groupId
Output: Anchor relative position

1. Convert screen to flow coordinates:
   anchorAbsolute = screenToFlowPosition(screenPos)

2. Get parent absolute position:
   parentAbsolute = getAbsoluteNodePosition(groupId)

3. Convert to relative:
   anchorRelative = {
     x: anchorAbsolute.x - parentAbsolute.x,
     y: anchorAbsolute.y - parentAbsolute.y
   }

4. Store:
   anchor.x = snapToGrid(anchorRelative.x)
   anchor.y = snapToGrid(anchorRelative.y)
   anchor.parentNodeId = groupId
```

#### Anchor Drag Out of Group

```
Input: Anchor with parentNodeId dragged outside all groups
Output: Anchor absolute position

1. Get current absolute position:
   anchorAbsolute = getAnchorAbsolutePosition(anchor, nodes)

2. Store:
   anchor.x = snapToGrid(anchorAbsolute.x)
   anchor.y = snapToGrid(anchorAbsolute.y)
   anchor.parentNodeId = undefined
```

### Example Scenarios

#### Scenario 1: Nested Groups

```
Flow (absolute coords)
├─ Group A at (100, 100)
│  └─ Group B at (50, 50) relative → (150, 150) absolute
│     └─ Node X at (30, 30) relative → (180, 180) absolute
│
└─ Anchor P has parentNodeId = Group B
   Anchor P at (20, 20) relative → (170, 170) absolute
```

When Group A moves to (200, 100):
- Group B absolute: (250, 150)
- Node X absolute: (280, 180)
- Anchor P relative: (20, 20) ← unchanged
- Anchor P absolute: (270, 170) ← recalculated

#### Scenario 2: Multi-Node Drag with Mixed Coordinates

```
Dragged nodes:
- Node A (root): (500, 500) absolute
- Node B (child of Group C): (100, 100) relative, (300, 300) absolute

Anchor on edge A→B:
- Has parentNodeId = Group D at (400, 400) absolute
- Anchor at (50, 50) relative → (450, 450) absolute

Delta calculation:
- Use Node A as reference (simpler, also in root)
- Initial: (500, 500), Current: (520, 520)
- Delta: (20, 20)

Anchor update:
1. Get absolute: (450, 450)
2. Apply delta: (470, 470)
3. Group D still at (400, 400)
4. Convert to relative: (70, 70)
5. Store: anchor.x = 70, anchor.y = 70
```

---

## Implementation Plan

### Phase 1: Type System (Day 1)

1. Add `parentNodeId?: string` to `EdgeAnchor` in `packages/chaingraph-types/src/edge/types.ts`
2. Update `EdgeAnchorSchema` in `packages/chaingraph-types/src/edge/types.zod.ts`
3. Add backend validation in `packages/chaingraph-trpc/server/procedures/edge/update-anchors.ts`
4. Test: Create anchor with parentNodeId, verify backend accepts it

### Phase 2: Coordinate Utilities (Day 2)

1. Create `apps/chaingraph-frontend/src/store/edges/anchor-coordinates.ts`
2. Implement `getAnchorAbsolutePosition()`
3. Implement `makeAnchorRelative()`
4. Unit tests for nested groups (3+ levels)
5. Test: Verify coordinate calculations with various nesting

### Phase 3: Feature 1 - Multi-Node Drag (Day 3-4)

1. Create `apps/chaingraph-frontend/src/store/edges/anchor-drag-sync.ts`
2. Implement `$edgesBetweenDraggedNodes` store
3. Implement `$initialNodeAbsolutePositions` store
4. Wire `startMultiNodeDrag` → find edges
5. Wire `updateMultiNodeDragPosition` → apply deltas
6. Add `applyDeltaToAnchors` event and handler in `anchors.ts`
7. Wire `endMultiNodeDrag` → sync to server
8. Import in `store/edges/index.ts`
9. Test: Drag 2 nodes, verify anchors move

### Phase 4: Feature 2 - Drop Detection (Day 5-6)

1. Modify `AnchorHandle.tsx` - add drop target calculation in `handleMouseDown`
2. Modify `AnchorHandle.tsx` - add parent assignment in `handleMouseUp`
3. Add `setAnchorParent` event and handler in `anchors.ts`
4. Add `clearAnchorParentsForDeletedNode` function in `anchors.ts`
5. Test: Drag anchor into group, verify parent assignment

### Phase 5: Feature 2 - Rendering (Day 7)

1. Modify `FlowEdge.tsx` - convert anchors to absolute before rendering
2. Modify `AnimatedEdge.tsx` - same change
3. Create `anchor-parent-sync.ts` - track parent movements
4. Import in `store/edges/index.ts`
5. Modify `nodes/stores.ts` - handle parent deletion
6. Test: Move parent group, verify edge updates

### Phase 6: Testing & Polish (Day 8-9)

1. Integration tests for all scenarios
2. Performance testing (10+ edges, nested groups)
3. Edge case testing (circular references, parent deletion)
4. Manual testing with complex flows
5. Bug fixes

### Phase 7: Documentation (Day 10)

1. Update README with new features
2. Add usage examples
3. Record demo videos
4. Update API documentation

---

## Testing Strategy

### Unit Tests

#### Coordinate Transformation Tests

```typescript
describe('anchor-coordinates', () => {
  test('getAnchorAbsolutePosition - no parent', () => {
    const anchor = { id: '1', x: 100, y: 200, index: 0 }
    const pos = getAnchorAbsolutePosition(anchor, {})
    expect(pos).toEqual({ x: 100, y: 200 })
  })

  test('getAnchorAbsolutePosition - with parent', () => {
    const nodes = {
      'group-1': {
        metadata: {
          ui: { position: { x: 50, y: 50 } }
        }
      }
    }
    const anchor = {
      id: '1', x: 30, y: 40, index: 0,
      parentNodeId: 'group-1'
    }
    const pos = getAnchorAbsolutePosition(anchor, nodes)
    expect(pos).toEqual({ x: 80, y: 90 })
  })

  test('getAnchorAbsolutePosition - nested groups', () => {
    const nodes = {
      'group-1': {
        metadata: {
          ui: { position: { x: 100, y: 100 } }
        }
      },
      'group-2': {
        metadata: {
          parentNodeId: 'group-1',
          ui: { position: { x: 50, y: 50 } }
        }
      }
    }
    const anchor = {
      id: '1', x: 20, y: 30, index: 0,
      parentNodeId: 'group-2'
    }
    const pos = getAnchorAbsolutePosition(anchor, nodes)
    expect(pos).toEqual({ x: 170, y: 180 })
  })
})
```

#### Multi-Node Drag Tests

```typescript
describe('anchor-drag-sync', () => {
  test('finds edges between dragged nodes', () => {
    // Setup: 3 nodes (A, B, C), 2 edges (A→B, B→C)
    // Drag: A and B
    // Expected: Only edge A→B tracked
  })

  test('applies delta to anchors', () => {
    // Setup: Edge with 2 anchors
    // Drag nodes by (10, 20)
    // Expected: Anchors move by (10, 20)
  })

  test('handles anchors with parent groups', () => {
    // Setup: Anchor has parentNodeId
    // Drag nodes by (10, 20)
    // Expected: Relative position updates correctly
  })
})
```

### Integration Tests

```typescript
describe('Multi-Node Drag E2E', () => {
  test('drag 2 connected nodes with anchor', async () => {
    // 1. Create 2 nodes and edge with anchor
    // 2. Select both nodes
    // 3. Drag by (100, 100)
    // 4. Verify anchor moved by (100, 100)
    // 5. Verify final position synced to server
  })

  test('drag only 1 node - anchor stays fixed', async () => {
    // 1. Create 2 nodes and edge with anchor
    // 2. Select only 1 node
    // 3. Drag by (100, 100)
    // 4. Verify anchor did NOT move
  })
})

describe('Anchor Parenting E2E', () => {
  test('drop anchor into group', async () => {
    // 1. Create edge with anchor
    // 2. Create group node
    // 3. Drag anchor over group
    // 4. Release
    // 5. Verify anchor.parentNodeId set
    // 6. Verify coordinates are relative
    // 7. Move group → verify anchor follows
  })

  test('delete parent group - anchor converts to absolute', async () => {
    // 1. Create anchor with parent
    // 2. Get current absolute position
    // 3. Delete parent group
    // 4. Verify anchor.parentNodeId cleared
    // 5. Verify anchor at same absolute position
  })
})
```

### Manual Testing Scenarios

#### Scenario 1: Complex Multi-Selection
1. Create 10 nodes in various positions
2. Connect them with edges (some with anchors)
3. Select 5 nodes
4. Drag selection
5. Verify: Only edges between selected nodes move anchors
6. Verify: Performance is smooth (<16ms per frame)

#### Scenario 2: Nested Groups with Anchors
1. Create Group A
2. Create Group B inside Group A
3. Create edge with anchor
4. Drop anchor into Group B
5. Move Group A → verify anchor follows
6. Move Group B → verify anchor follows
7. Drag anchor out → verify converts to absolute

#### Scenario 3: Mixed Coordinate Systems
1. Create Group A with Node X inside
2. Create Node Y at root level
3. Create edge X→Y with anchor
4. Drop anchor into Group A
5. Select both X and Y
6. Drag selection
7. Verify: Anchor maintains correct relative position to Group A

---

## Migration & Rollback

### Migration Strategy

**No data migration required!**

- `parentNodeId` is optional field
- Existing anchors without `parentNodeId` work as before (absolute coordinates)
- Backend accepts both formats
- Frontend handles both cases transparently

### Backward Compatibility

```typescript
// Old anchors (no parentNodeId)
const oldAnchor = { id: '1', x: 100, y: 200, index: 0 }

// getAnchorAbsolutePosition handles it
getAnchorAbsolutePosition(oldAnchor, nodes)
// → returns { x: 100, y: 200 } (no parent, so already absolute)

// Path calculation works the same
catmullRomToBezierPath(source, target, [oldAnchor], ...)
```

### Feature Flags

No feature flags needed:
- Type changes are additive
- Backend validation is additive
- Frontend code handles both cases

### Rollback Plan

If critical issues arise:

**Frontend Rollback**:
1. Remove import of `anchor-drag-sync.ts` from `store/edges/index.ts`
2. Remove import of `anchor-parent-sync.ts` from `store/edges/index.ts`
3. Revert `AnchorHandle.tsx` changes
4. Revert `FlowEdge.tsx` and `AnimatedEdge.tsx` changes

**Backend Rollback**:
1. Add validation to reject `parentNodeId` field
2. Strip `parentNodeId` on save

**Fallback Behavior**:
- Multi-node drag: Anchors stay fixed (original behavior)
- Anchor parenting: Not available

---

## Performance Considerations

### Multi-Node Drag Performance

**Target**: <16ms per frame (60fps)

**Optimizations**:
1. Reuse existing 16ms throttle from multi-node drag system
2. Only process edges where BOTH nodes are dragged
3. Batch anchor updates (single store transaction per edge)
4. No server sync during drag (only on drag end)

**Measurements**:
- Edge between dragged nodes detection: O(E) where E = number of edges
- Delta application per anchor: ~0.1ms
- Coordinate conversion: ~0.05ms per anchor
- **Total**: ~5ms for 10 edges with 2 anchors each

### Anchor Parenting Performance

**Target**: No visible lag when parent moves

**Optimizations**:
1. Memoize absolute position lookups
2. Only bump edge versions for edges with parented anchors
3. Reuse existing edge re-render infrastructure

**Measurements**:
- Parent position change detection: O(1) via store subscription
- Edge version bump: O(A) where A = anchors with parents
- Path recalculation: ~5ms per edge (existing)

### Worst Case Scenario

10 nodes dragged, 20 edges between them, 40 anchors total, 5 anchors have parents in nested groups:

1. Find edges: 20ms (iterate all edges)
2. Calculate delta: <1ms
3. Apply delta to 40 anchors: 4ms (0.1ms × 40)
4. Coordinate conversions: 2.5ms (0.05ms × 50)
5. Store updates: 2ms
6. Edge version bumps: 1ms

**Total**: ~30ms (not ideal, but acceptable for one-time drag end sync)

**During drag**: Only steps 1-5, skipping server sync → ~10ms per frame ✓

---

## Critical Files Reference

### New Files

1. `apps/chaingraph-frontend/src/store/edges/anchor-drag-sync.ts`
   - Multi-node drag coordination
   - Edge tracking and delta application

2. `apps/chaingraph-frontend/src/store/edges/anchor-coordinates.ts`
   - Coordinate transformation utilities
   - Handles nested groups

3. `apps/chaingraph-frontend/src/store/edges/anchor-parent-sync.ts`
   - Parent position change tracking
   - Edge version bumping

### Modified Files

1. `packages/chaingraph-types/src/edge/types.ts`
   - Add `parentNodeId` to `EdgeAnchor`

2. `packages/chaingraph-types/src/edge/types.zod.ts`
   - Update Zod schema

3. `apps/chaingraph-frontend/src/store/edges/anchors.ts`
   - Add `applyDeltaToAnchors` event and handler
   - Add `setAnchorParent` event and handler
   - Add `clearAnchorParentsForDeletedNode` function

4. `apps/chaingraph-frontend/src/components/flow/edges/components/AnchorHandle.tsx`
   - Add drop target calculation
   - Add parent assignment logic

5. `apps/chaingraph-frontend/src/components/flow/edges/FlowEdge.tsx`
   - Convert anchors to absolute before rendering

6. `apps/chaingraph-frontend/src/components/flow/edges/AnimatedEdge.tsx`
   - Convert anchors to absolute before rendering

7. `apps/chaingraph-frontend/src/store/edges/index.ts`
   - Import new wiring files

8. `apps/chaingraph-frontend/src/store/nodes/stores.ts`
   - Handle parent deletion

9. `packages/chaingraph-trpc/server/procedures/edge/update-anchors.ts`
   - Validate parent nodes

---

## Glossary

- **Absolute Position**: Coordinates in the flow canvas coordinate system (origin at top-left of viewport)
- **Relative Position**: Coordinates relative to a parent node's position
- **Parent Node**: Group node that contains a child node or anchor
- **Nested Group**: Group node that is itself inside another group
- **Delta**: Change in position (dx, dy)
- **Anchor Parenting**: Making an anchor a child of a group node
- **Drop Target**: Visual area where items can be dropped during drag operations
- **Hover Target**: Drop target currently under the mouse cursor
- **Grid Snapping**: Rounding coordinates to multiples of 5 pixels

---

## Appendices

### A. Example Code Snippets

#### Creating Anchor with Parent

```typescript
const anchor: EdgeAnchor = {
  id: nanoid(8),
  x: 50,              // Relative to parent
  y: 100,             // Relative to parent
  index: 0,
  parentNodeId: 'group-123',
}
```

#### Converting Anchor to Absolute

```typescript
const absolutePos = getAnchorAbsolutePosition(anchor, nodes)
// If parent at (200, 300):
// absolutePos = { x: 250, y: 400 }
```

#### Detecting Multi-Node Drag Edges

```typescript
const draggedNodeIds = new Set(['node-1', 'node-2', 'node-3'])
const edgesBetween = edges.filter(edge =>
  draggedNodeIds.has(edge.source) && draggedNodeIds.has(edge.target)
)
```

### B. Related Documentation

- [XYFlow Documentation](https://reactflow.dev)
- [Effector Documentation](https://effector.dev)
- [Node Position Utils](../../apps/chaingraph-frontend/src/components/flow/utils/node-position.ts)
- [Edge Anchor Types](../../packages/chaingraph-types/src/edge/types.ts)

---

**End of Design Document**
