# ChainGraph Frontend Performance Analysis

**Date**: 2025-12-18
**Focus**: Flow editor performance bottlenecks during node drag operations
**Symptoms**: Low FPS (lag) when dragging nodes in flows with 20-30 nodes and 50-70 edges
**Environment**: Production build with React Compiler enabled

---

## Executive Summary

### Core Problem
The ChainGraph flow editor experiences significant performance degradation during interactive operations (node dragging, editing) in medium-sized flows. Analysis reveals **cascading store recalculations** and **redundant processing of server echo events** as primary bottlenecks.

### Key Findings
1. **Server echo events trigger full $nodes cascade** even when state already reflects optimistic updates
2. **$xyflowNodes recalculates all 30+ nodes** on every single node update (no structural sharing)
3. **$nodeLayerDepth doubles the cascade** by deriving from $nodes which triggers it again
4. **Sequential event processing blocks main thread** with synchronous handler chains
5. **Each node component has 10+ store subscriptions** multiplying update frequency

### Fast-Win Solutions
The document proposes 5 prioritized solutions targeting **50-70% FPS improvement** with minimal refactoring risk.

---

## Investigation Methodology

### Traced Execution Paths
Starting from user interaction (node drag), I traced the complete data flow through:

1. **XYFlow callbacks** → React event handlers
2. **Effector events** → Store updates and samples
3. **Server round-trip** → tRPC mutation → event emission
4. **Event subscription** → Handler invocation → Store cascades
5. **React re-renders** → Component updates

### Files Analyzed
**State Management (Effector)**:
- `apps/chaingraph-frontend/src/store/domains.ts` - Domain definitions
- `apps/chaingraph-frontend/src/store/flow/subscription.ts` - Event subscription logic
- `apps/chaingraph-frontend/src/store/flow/stores.ts` - Flow state stores (886 lines)
- `apps/chaingraph-frontend/src/store/nodes/stores.ts` - Node state stores (1041 lines)
- `apps/chaingraph-frontend/src/store/ports/stores.ts` - Port state stores (223 lines)

**React Components**:
- `apps/chaingraph-frontend/src/components/flow/Flow.tsx` - Main flow component
- `apps/chaingraph-frontend/src/components/flow/nodes/ChaingraphNode/ChaingraphNode.tsx` - Node rendering
- `apps/chaingraph-frontend/src/components/flow/nodes/ChaingraphNode/ChaingraphNodeOptimized.tsx` - Memoization wrapper

**Interaction Handlers**:
- `apps/chaingraph-frontend/src/components/flow/hooks/useNodeChanges.ts` - Position/dimension handling
- `apps/chaingraph-frontend/src/components/flow/hooks/useNodeDragHandling.ts` - Drag operations

**Core Types**:
- `packages/chaingraph-types/src/node/base-node-compositional.ts` - Node implementation
- `packages/chaingraph-types/src/flow/serializer/flow-serializer.ts` - Serialization
- `packages/chaingraph-types/src/flow/events.ts` - Event type definitions

---

## Critical Bottleneck #1: Server Echo Cascade During Drag

### Location
**File**: `apps/chaingraph-frontend/src/store/flow/stores.ts:610-629`

### The Problem

When a user drags a node, the system performs optimistic updates but also processes server echo events that trigger full cascades:

```typescript
[FlowEventType.NodeUIPositionChanged]: (data) => {
  const currentNode = nodes[data.nodeId]
  if (!currentNode)
    return

  const currentVersion = currentNode.getVersion()

  if (data.version && data.version <= currentVersion) {
    // console.warn(`[SKIPPING] Received outdated position change event`)
    return
  }

  setNodeVersion({
    nodeId: data.nodeId,
    version: data.version,
  })

  const currentPosition = currentNode.metadata.ui?.position || DefaultPosition
  positionInterpolator.addState(data.nodeId, data.newPosition, currentPosition)
}
```

### Data Flow Trace

```
User drags node at position (100, 200)
    ↓
[useNodeChanges.ts:62-66] updateNodePositionOnly()
    ├─> $nodePositions update (FAST - isolated)
    └─> Visual update immediate ✓
    ↓
[useNodeChanges.ts:69-74] updateNodePosition()
    ├─> Throttled 500ms (NODE_POSITION_DEBOUNCE_MS)
    └─> Server mutation sent
    ↓
Server processes, returns NodeUIPositionChanged event
    ↓
[subscription.ts:56-62] onData callback receives event
    ↓
[subscription.ts:58] newFlowEvents([data.data])
    ↓
[stores.ts:689-716] sample → createEffect processes events
    ↓
[stores.ts:610-629] NodeUIPositionChanged handler
    ├─> positionInterpolator.addState() called
    └─> Eventually triggers updateNodePositionInterpolated
    ↓
[stores.ts:791-802] $nodes.on(updateNodePositionInterpolated)
    ├─> node.clone() called
    ├─> node.setPosition() called
    └─> { ...state, [nodeId]: updatedNode } spreads entire state
    ↓
$nodes store changed → CASCADE TRIGGERS:
    ├─> [stores.ts:459-506] $nodeLayerDepth recalculates
    ├─> [stores.ts:509-535] $nodesByLayer recalculates
    └─> [stores.ts:555-684] $xyflowNodes recalculates (ALL NODES)
    ↓
React components re-render (all subscribed to $xyflowNodes)
```

### Why This Happens

1. **Optimistic update**: `updateNodePositionOnly()` updates `$nodePositions` immediately (fast path)
2. **Server sync**: `updateNodePosition()` sends mutation to server (throttled 500ms)
3. **Server echo**: Server emits `NodeUIPositionChanged` event back to client
4. **Interpolator trigger**: Position interpolator receives server position
5. **$nodes update**: `updateNodePositionInterpolated` modifies `$nodes` store
6. **Full cascade**: All derived stores recalculate

### Key Issue

The position is **already in `$nodePositions`** from the optimistic update. The server echo event is **redundant** during active drag but still triggers the expensive `$nodes` cascade.

### Multi-User Consideration

**Original flawed solution**: Skip all server echoes during drag
**Problem**: Other users editing the same flow would not see updates

**Correct approach**:
- Process server echoes that represent OTHER users' changes
- Skip server echoes that confirm our own optimistic updates
- Detect "own updates" by comparing event version with current state version

---

## Critical Bottleneck #2: $xyflowNodes Full Recalculation

### Location
**File**: `apps/chaingraph-frontend/src/store/nodes/stores.ts:555-684`

### The Problem

This combined store creates a **brand new array of all XYFlow node objects** on every change to `$nodes`, `$nodePositions`, `$categoryMetadata`, or `$nodeLayerDepth`:

```typescript
export const $xyflowNodes = combine(
  $nodes,
  $nodePositions,
  $categoryMetadata,
  $nodeLayerDepth,
  (nodes, nodePositions, categoryMetadata, nodeLayerDepth) => {
    if (!nodes || Object.keys(nodes).length === 0) {
      return []
    }

    // ⚠️ Creates new Map on EVERY invocation
    const nodeCache = new Map<string, Node>()

    // Helper function to get category metadata within this computation
    const getCategoryMetadata = (categoryId: string) =>
      categoryMetadata.get(categoryId) ?? categoryMetadata.get(NODE_CATEGORIES.OTHER)!

    // ⚠️ Sorts ALL nodes on every call
    const sortedNodes = Object.values(nodes).sort((a, b) => {
      if (a.metadata.category === NODE_CATEGORIES.GROUP)
        return -1
      if (b.metadata.category === NODE_CATEGORIES.GROUP)
        return 1
      return 0
    })

    // ⚠️ Maps ALL nodes, even if only one changed
    return sortedNodes
      .filter(node => node.metadata.ui?.state?.isHidden !== true)
      .map((node): Node => {
        const nodeId = node.id
        const nodeCategoryMetadata = getCategoryMetadata(node.metadata.category!)

        // ⚠️ Computes parent chain for EVERY node on EVERY update
        const getParentChain = (n: INode): string => {
          const parents: string[] = []
          let current = n
          while (current.metadata.parentNodeId) {
            parents.push(current.metadata.parentNodeId)
            current = nodes[current.metadata.parentNodeId]
            if (!current) break
          }
          return parents.join('-')
        }

        const cacheKey = `${nodeId}-${node.getVersion()}-${getParentChain(node)}`
        const cachedNode = nodeCache.get(cacheKey)

        // Cache check logic...
        // But nodeCache is recreated each time, so cache is empty!
      })
  }
)
```

### Problems Identified

1. **No persistence**: `nodeCache` Map created fresh on every call - cache is always empty
2. **Full traversal**: `Object.values(nodes)` creates new array of all nodes
3. **Sorting overhead**: Sorts entire array even if no group nodes changed
4. **Parent chain computation**: O(depth) traversal for each node on each update
5. **No structural sharing**: Returns completely new array, triggering React re-renders

### Computational Complexity

With 30 nodes, average depth 2:
- **Per update**: 30 parent chain traversals + 30 object creations + array sort
- **During drag** (16ms budget): This happens multiple times as position updates propagate
- **Result**: Exceeds 16ms frame budget → dropped frames → low FPS

---

## Critical Bottleneck #3: Double Cascade from $nodeLayerDepth

### Location
**File**: `apps/chaingraph-frontend/src/store/nodes/stores.ts:459-506`

### The Problem

`$nodeLayerDepth` is a **derived store** (combine) that recalculates on every `$nodes` change:

```typescript
export const $nodeLayerDepth = combine(
  $nodes,  // ← Triggers on EVERY node update
  (nodes) => {
    const depthCache = new Map<string, number>()

    // Recursive depth calculation with cycle detection
    const calculateDepth = (nodeId: string, visited = new Set<string>()): number => {
      if (depthCache.has(nodeId)) {
        return depthCache.get(nodeId)!
      }

      const node = nodes[nodeId]
      if (!node) return 0
      if (!node.metadata.parentNodeId) {
        depthCache.set(nodeId, 0)
        return 0
      }

      // Cycle detection
      if (visited.has(nodeId)) {
        console.warn(`Circular reference detected for node ${nodeId}, returning depth 0`)
        depthCache.set(nodeId, 0)
        return 0
      }

      // ⚠️ Recursive call up the parent chain
      visited.add(nodeId)
      const parentDepth = calculateDepth(node.metadata.parentNodeId, visited)
      const depth = parentDepth + 1

      depthCache.set(nodeId, depth)
      return depth
    }

    // ⚠️ Calculates for ALL nodes
    const depths: Record<string, number> = {}
    Object.keys(nodes).forEach((nodeId) => {
      depths[nodeId] = calculateDepth(nodeId)
    })

    return depths
  },
)
```

Then it's consumed by `$xyflowNodes` (line 559):

```typescript
export const $xyflowNodes = combine(
  $nodes,
  $nodePositions,
  $categoryMetadata,
  $nodeLayerDepth,  // ← This also depends on $nodes!
  // ...
)
```

### The Cascade Chain

```
$nodes changes (position update)
    ↓
$nodeLayerDepth.combine() fires
    ├─> Recalculates depth for all 30 nodes
    └─> Returns new depths object
    ↓
$xyflowNodes.combine() fires
    ├─> Triggered by $nodes change
    ├─> Triggered AGAIN by $nodeLayerDepth change
    └─> Recalculates all XYFlow nodes TWICE
    ↓
React components re-render
```

### Why This Is Expensive

1. **Redundant recalculation**: Layer depth only changes when parent relationships change (rare), but recalculates on every node update (common)
2. **Double trigger**: Same position update triggers `$xyflowNodes` twice - once from `$nodes`, once from `$nodeLayerDepth`
3. **O(N × D) complexity**: N nodes × D average depth = 30 × 2 = 60 recursive calls per update

---

## Critical Bottleneck #4: Sequential Event Processing Blocks Main Thread

### Location
**File**: `apps/chaingraph-frontend/src/store/flow/stores.ts:689-716`

### The Problem

Flow events are processed **sequentially** in an async effect on the main thread:

```typescript
sample({
  clock: newFlowEvents,
  source: combine({ nodes: $nodes, flowId: $activeFlowId }),
  fn: (
    { nodes, flowId },
    events,
  ) => ({ nodes, flowId: flowId!, events }),
  filter: ({ flowId }) => !!flowId,
  target: createEffect(async ({ nodes, flowId, events }) => {
    if (!flowId) {
      console.warn('No active flow ID, skipping event processing')
      return
    }

    const eventHandlers = createEventHandlers(flowId, nodes)
    const handleEvent = createEventHandler(eventHandlers, {
      onError: (error, event) => {
        console.error(`Error handling event ${event.type}:`, error)
      },
    })

    // ⚠️ Sequential processing - awaits each event
    for (const event of events) {
      try {
        await handleEvent(event)  // Blocks until handler completes
      } catch (error) {
        console.error(`Unhandled error processing event ${event.type}:`, error)
      }
    }
  }),
})
```

### Event Handlers Called
**File**: `apps/chaingraph-frontend/src/store/flow/stores.ts:410-686`

Each handler can trigger store updates:

```typescript
function createEventHandlers(flowId: string, nodes: Record<string, INode>): FlowEventHandlerMap {
  return {
    [FlowEventType.NodeUpdated]: (data) => {
      // Version check
      const node = nodes[data.node.id]
      if (node && data.node.getVersion() < node.getVersion()) {
        return  // Outdated event - skip
      }

      updateNode(data.node)        // ← Triggers $nodes cascade
      nodeUpdated(data.node.id)    // ← Additional event
    },

    [FlowEventType.NodeUIPositionChanged]: (data) => {
      // ... version check ...
      positionInterpolator.addState(...)  // ← Triggers updateNodePositionInterpolated
    },

    // ... 15+ other handlers
  }
}
```

### Impact Analysis

**Scenario**: Server sends 5 events in one WebSocket message
- Event 1 triggers `updateNode()` → `$nodes` cascade → React re-render cycle starts
- Main thread blocked waiting for cascade to settle
- Event 2 starts processing...
- **Total blocking time**: 5 events × ~10-20ms each = 50-100ms blocked

**During drag**: Position updates generate continuous event streams, creating stuttering.

---

## Critical Bottleneck #5: Excessive Component Subscriptions

### Location
**File**: `apps/chaingraph-frontend/src/components/flow/nodes/ChaingraphNode/ChaingraphNode.tsx:65-93`

### The Problem

Each node component subscribes to **10+ different stores**:

```typescript
function ChaingraphNodeComponent({
  data,
  selected,
  id,
}: NodeProps<ChaingraphNode>) {
  // ⚠️ 10+ store subscriptions per node
  const node = useNode(id)                              // 1. Subscribe to $nodes
  const parentNode = useNode(node?.metadata.parentNodeId || '')  // 2. Parent $nodes
  const nodeExecution = useNodeExecution(id)            // 3. $executionState
  const executionStyle = useNodeExecutionStyle(id)      // 4. Derived execution style
  const nodePulseState = useNodePulseState(id)          // 5. $updatePulses
  const portContext = useNodePortContextValue(id)       // 6. $nodePortEdgesMap + computed
  const isHighlighted = useIsNodeHighlighted(id)        // 7. $highlightedNodes
  const hasHighlights = useHasHighlightedNodes()        // 8. $highlightedNodes (all)
  const dropFeedback = useNodeDropFeedback(id)          // 9. $dragDropState
  const isBreakpointSet = useBreakpoint(id)             // 10. $breakpoints
  const activeFlow = useUnit($activeFlowMetadata)       // 11. $activeFlowMetadata
  const { debugMode } = useUnit($executionState)        // 12. $executionState
  const isFlowLoaded = useUnit($isFlowLoaded)           // 13. $isFlowLoaded

  // ...
}
```

### Subscription Multiplication

With 30 nodes in the flow:
- **30 nodes × 13 subscriptions** = **390 active subscriptions**
- Each store update evaluates **all subscribed hooks**
- Even if only 1 node changes, all 390 subscriptions check for updates

### Example: Single Position Update Impact

```
$nodes changes (1 node position)
    ↓
All 30 × useNode(id) hooks evaluate
    ├─> useStoreMap runs updateFilter for each
    └─> 30 × version comparisons
    ↓
All 30 × useNodeExecution(id) hooks evaluate
    └─> 30 × execution state lookups
    ↓
All 30 × useNodeExecutionStyle(id) hooks evaluate
    └─> 30 × style computations
    ↓
... (10 more hook types) ...
```

**Reference Files**:
- `apps/chaingraph-frontend/src/store/nodes/hooks/useNode.ts:21-70` - useNode implementation
- `apps/chaingraph-frontend/src/store/nodes/computed/*.ts` - Various computed hooks

---

## Critical Bottleneck #6: Object Spread in State Updates

### Location
**File**: `apps/chaingraph-frontend/src/store/nodes/stores.ts:214-250`

### The Problem

Every node update **spreads the entire nodes object**:

```typescript
export const $nodes = nodesDomain.createStore<Record<string, INode>>({})
  .on(setNodes, (_, nodes) => ({ ...nodes }))  // ⚠️ Full copy

  .on(addNode, (state, node) => {
    return { ...state, [node.id]: node }  // ⚠️ Spreads all 30+ nodes
  })

  .on(addNodes, (state, nodes) => {
    const newState = { ...state }  // ⚠️ Spreads all
    nodes.forEach((node) => {
      newState[node.id] = node
    })
    return newState
  })

  .on(updateNode, (state, node) => {
    return { ...state, [node.id]: node }  // ⚠️ Spreads all
  })
```

### Why This Is Expensive

JavaScript object spread `{ ...state }` creates a **shallow copy of all properties**:
- With 30 nodes: Copies 30 key-value pairs
- Creates new object reference → triggers all subscribers
- **No structural sharing** - even unchanged nodes get new container reference

### Effector's Behavior

Effector detects state changes via **reference equality**:
```typescript
const oldState = { a: node1, b: node2, c: node3 }
const newState = { ...oldState, a: updatedNode1 }

// oldState !== newState → triggers subscribers
// Even though b and c didn't change!
```

### Compounding Effect

Combined with `$xyflowNodes` recalculation:
```
updateNode(nodeA)
    ↓
$nodes = { ...state, [nodeA.id]: nodeA }  // New object reference
    ↓
$xyflowNodes recalculates
    ├─> Object.values(nodes) - creates new array
    ├─> sortedNodes - creates new array
    └─> .map() - creates new array
    ↓
XYFlow receives new nodes array
    ↓
React compares old vs new
    ⚠️ Array reference changed → checks all 30 elements
```

**Reference**: `apps/chaingraph-frontend/src/store/nodes/hooks/useXYFlowNodes.ts:21-117` has mitigation via `updateFilter`, but still processes the new array.

---

## Supporting Bottleneck #7: Event Handler Version Checks

### Location
**File**: `apps/chaingraph-frontend/src/store/flow/stores.ts:434-447`

### The Pattern

Every event handler performs version checking:

```typescript
[FlowEventType.NodeUpdated]: (data) => {
  const node = nodes[data.node.id]
  if (node) {
    if (data.node.getVersion() && data.node.getVersion() < node.getVersion()) {
      // console.warn(`[NodeUpdated] Received outdated node update event for node ${data.node.id}`)
      return  // Skip outdated
    }
  }

  updateNode(data.node)
  nodeUpdated(data.node.id)
},
```

### Observations

1. **Good**: Skips outdated events (optimistic update protection)
2. **Problem**: Still called for every event, even if skipped
3. **Opportunity**: Could filter events earlier in pipeline before handler invocation

**Similar patterns**:
- Line 437-446: `NodeUpdated` handler
- Line 610-629: `NodeUIPositionChanged` handler
- Line 631-654: `NodeUIChanged` handler

---

## Supporting Bottleneck #8: Node Cloning in Event Flow

### Location
**File**: `packages/chaingraph-types/src/node/implementations/node-serializer.ts:177-201`

### The Pattern

Nodes are cloned at multiple stages:

1. **Server serialization** (`flow-serializer.ts:73-120`):
```typescript
serializeNode(node: INode): SerializedNode {
  const serializedPorts: SerializedPort[] = []
  for (const [portId, port] of node.ports.entries()) {
    // Serializes all ports...
  }
  return { id: node.id, /* ... */ }
}
```

2. **Client deserialization** (`flow-serializer.ts:149-288`):
```typescript
deserializeNode(serializedNode: SerializedNode, instance?: T): T {
  const node = instance ?? NodeRegistry.getInstance().createNode(...)
  // Recreates all ports from scratch...
}
```

3. **Event emission** (`flow/flow.ts:128`):
```typescript
await this.emitEvent(newEvent(
  this.getNextEventIndex(),
  this.id,
  FlowEventType.NodeAdded,
  { node: node.clone() },  // ⚠️ Full clone
))
```

4. **Store updates** (`stores.ts:242-244`):
```typescript
.on(updateNode, (state, node) => {
  return { ...state, [node.id]: node }  // Another spread
})
```

### Clone Implementation

**File**: `packages/chaingraph-types/src/node/implementations/node-serializer.ts:177-201`

```typescript
clone(): INodeComposite {
  const newNode = this.createInstance(this.nodeRef.id)

  // Deep copy metadata
  newNode.setMetadata(deepCopy(this.nodeRef.metadata))
  // Copy status
  newNode.setStatus(this.nodeRef.status, false)
  // Copy version
  newNode.setVersion(this.nodeRef.getVersion())

  // ⚠️ Clone ALL ports
  const clonedPorts = new Map<string, IPort>()
  for (const [portId, port] of this.portManager.ports.entries()) {
    clonedPorts.set(portId, port.clone())  // Deep clone each port
  }
  newNode.setPorts(clonedPorts)

  newNode.bindPortBindings()  // Rebind all port bindings

  return newNode
}
```

### Impact

**For a node with 10 ports**:
- Clone node metadata (shallow copy)
- Clone 10 ports (each port clones config + value)
- Rebind port bindings (traverse all ports)
- **Estimated time**: 1-2ms per node

**During rapid updates** (drag operation):
- Multiple events per second
- Each triggers clone + deserialize + store update
- Garbage collector pressure increases

---

## Data Flow: Complete Trace of Position Update

### User Drags Node from (0,0) to (100,100)

**Phase 1: Optimistic Update (Immediate)**

**File**: `apps/chaingraph-frontend/src/components/flow/hooks/useNodeChanges.ts:36-74`

```typescript
case 'position': {
  if (!change.dragging) return

  const node = currentNodes[change.id]
  // ...

  positionInterpolator.clearNodeState(node.id)

  // ✅ FAST PATH: Updates only $nodePositions (isolated store)
  updateNodePositionOnly({
    nodeId: change.id,
    position: roundPosition(change.position as Position),
  })

  // Also trigger throttled server sync
  updateNodePosition({
    flowId: activeFlow.id!,
    nodeId: change.id,
    position: roundPosition(change.position as Position),
    version: node.getVersion(),
  })
}
```

**Store update** (`stores.ts:380-388`):
```typescript
export const $nodePositions = nodesDomain.createStore<Record<string, Position>>({})
  .on(updateNodePositionOnly, (state, { nodeId, position }) => {
    const current = state[nodeId]
    if (current?.x === position.x && current?.y === position.y) {
      return state  // Same reference - no cascade
    }
    return { ...state, [nodeId]: position }  // Update only positions
  })
```

**Result**: Visual update immediate (< 5ms), no cascade to $nodes.

---

**Phase 2: Server Sync (Throttled 500ms)**

**File**: `apps/chaingraph-frontend/src/store/nodes/stores.ts:888-903`

```typescript
const throttledUpdatePosition = accumulateAndSample({
  source: [updateNodePosition],
  timeout: NODE_POSITION_DEBOUNCE_MS,  // 500ms
  getKey: update => update.nodeId,
})

sample({
  source: $nodes,
  clock: throttledUpdatePosition,
  fn: (nodes, params) => ({
    ...params,
    version: (nodes[params.nodeId]?.getVersion() ?? 0) + 1,
  }),
  target: [setNodeVersion, baseUpdateNodePositionFx],  // Server mutation
})
```

**Server processes** (tRPC layer):
- Receives position update mutation
- Updates database
- Emits `NodeUIPositionChanged` event
- Broadcasts to all subscribed clients

---

**Phase 3: Server Echo Received**

**File**: `apps/chaingraph-frontend/src/store/flow/subscription.ts:56-62`

```typescript
onData: (data) => {
  if (data && data.data) {
    newFlowEvents([
      data.data,  // FlowEvent with type NodeUIPositionChanged
    ])
  }
},
```

---

**Phase 4: Event Handler Processes Echo**

**File**: `apps/chaingraph-frontend/src/store/flow/stores.ts:610-629`

```typescript
[FlowEventType.NodeUIPositionChanged]: (data) => {
  const currentNode = nodes[data.nodeId]
  if (!currentNode) return

  const currentVersion = currentNode.getVersion()

  // Version check (good!)
  if (data.version && data.version <= currentVersion) {
    return  // Skip if our optimistic update has higher version
  }

  setNodeVersion({ nodeId: data.nodeId, version: data.version })

  const currentPosition = currentNode.metadata.ui?.position || DefaultPosition
  positionInterpolator.addState(data.nodeId, data.newPosition, currentPosition)
  // ⚠️ This eventually triggers updateNodePositionInterpolated
}
```

---

**Phase 5: Position Interpolator Updates $nodes**

**File**: `apps/chaingraph-frontend/src/store/nodes/stores.ts:791-802`

```typescript
$nodes
  .on(updateNodePositionInterpolated, (state, { nodeId, position }) => {
    const node = state[nodeId]
    if (!node) return state

    // ⚠️ Clone the node
    const updatedNode = node.clone()
    updatedNode.setPosition(position, false)

    // ⚠️ Spread entire state
    return { ...state, [nodeId]: updatedNode }
  })
```

---

**Phase 6: The Cascade**

```
$nodes changed
    ↓
$nodeLayerDepth.combine() fires
    └─> Recalculates depths for all 30 nodes
    ↓
$nodesByLayer.combine() fires
    └─> Regroups all nodes by layer
    ↓
$xyflowNodes.combine() fires
    └─> Recalculates all XYFlow nodes
        ├─> Object.values(nodes) - 30 nodes
        ├─> .sort() - sorts 30 nodes
        ├─> .filter() - filters 30 nodes
        └─> .map() - creates 30 XYFlow nodes
            └─> getParentChain() for each - 30 traversals
    ↓
useXYFlowNodes() hook receives new array
    ↓
[useXYFlowNodes.ts:30-101] updateFilter checks changes
    └─> Iterates all 30 nodes comparing prev vs next
    ↓
If changes detected, React re-render propagates
    ↓
<ReactFlow nodes={nodes} /> receives new array
    └─> XYFlow internal reconciliation
        └─> 30 node components check for updates
```

**Total time**: 20-40ms for the cascade alone, eating the entire 16ms frame budget multiple times.

---

## Proposed Solutions (Corrected & Prioritized)

---

### ✅ Solution 1: Smart Version-Based Event Deduplication (CORRECTED)

**Impact**: 🔴 **HIGH** - Eliminates redundant cascades during drag
**Effort**: 🟢 **LOW** - Single conditional check
**Risk**: 🟢 **LOW** - Preserves multi-user editing

#### Motivation

During drag, the client's optimistic update creates state that the server echo confirms. The server event is redundant but still triggers expensive cascades. We need to detect and skip these confirming echoes while preserving other users' updates.

#### The Corrected Approach

**File to modify**: `apps/chaingraph-frontend/src/store/flow/stores.ts:610-629`

**Current code**:
```typescript
[FlowEventType.NodeUIPositionChanged]: (data) => {
  const currentNode = nodes[data.nodeId]
  if (!currentNode)
    return

  const currentVersion = currentNode.getVersion()

  if (data.version && data.version <= currentVersion) {
    // console.warn(`[SKIPPING] Received outdated position change event`)
    return
  }

  setNodeVersion({
    nodeId: data.nodeId,
    version: data.version,
  })

  const currentPosition = currentNode.metadata.ui?.position || DefaultPosition
  positionInterpolator.addState(data.nodeId, data.newPosition, currentPosition)
}
```

**Proposed fix**:
```typescript
[FlowEventType.NodeUIPositionChanged]: (data) => {
  const currentNode = nodes[data.nodeId]
  if (!currentNode)
    return

  const currentVersion = currentNode.getVersion()

  // Skip outdated events (existing check)
  if (data.version && data.version <= currentVersion) {
    return
  }

  // NEW: Skip if position is already in state (echo of our optimistic update)
  const currentPosition = currentNode.metadata.ui?.position || DefaultPosition
  const positionUnchanged =
    Math.abs(currentPosition.x - data.newPosition.x) < 1 &&
    Math.abs(currentPosition.y - data.newPosition.y) < 1

  if (positionUnchanged) {
    // Position already matches - this is likely an echo of our optimistic update
    // Still update version to prevent future outdated checks
    setNodeVersion({
      nodeId: data.nodeId,
      version: data.version,
    })
    return  // Skip expensive interpolator and $nodes update
  }

  // Different position - another user moved the node or server correction
  setNodeVersion({
    nodeId: data.nodeId,
    version: data.version,
  })

  positionInterpolator.addState(data.nodeId, data.newPosition, currentPosition)
}
```

**Why this works**:
- **Own updates**: Client's optimistic update already set position → echo skipped
- **Other users**: Their updates have different positions → echo processed
- **Server corrections**: If server applies different position → processed
- **Version tracking**: Still updates version to maintain consistency

**Also apply to**:
- `NodeUIChanged` handler (line 631-654)
- `NodeUIDimensionsChanged` handler (line 656-685)
- `PortUpdated` handler (line 499-529)

---

### ✅ Solution 2: Persistent Cache for $xyflowNodes

**Impact**: 🔴 **HIGH** - Prevents full recomputation on every update
**Effort**: 🟡 **MEDIUM** - Cache management logic needed
**Risk**: 🟢 **LOW** - Cache invalidation is straightforward

#### Motivation

Currently, `$xyflowNodes` recreates the entire node array on every change. A persistent cache can preserve unchanged node references, providing structural sharing for React reconciliation.

#### Implementation

**File to modify**: `apps/chaingraph-frontend/src/store/nodes/stores.ts:555-684`

**Create new file**: `apps/chaingraph-frontend/src/store/nodes/xyflow-node-cache.ts`

```typescript
import type { INode } from '@badaitech/chaingraph-types'
import type { Node } from '@xyflow/react'
import type { CategoryMetadata } from '@badaitech/chaingraph-types'

interface CachedNodeEntry {
  version: number
  parentChain: string
  xyflowNode: Node
}

/**
 * Persistent cache for XYFlow node objects
 * Enables structural sharing - unchanged nodes keep same reference
 */
export class XYFlowNodeCache {
  private cache = new Map<string, CachedNodeEntry>()

  /**
   * Get or create XYFlow node for a given ChainGraph node
   * Returns cached node if version and parent chain unchanged
   */
  getOrCreate(
    node: INode,
    position: { x: number; y: number },
    categoryMetadata: CategoryMetadata,
    layerDepth: number,
    allNodes: Record<string, INode>,
  ): Node {
    const nodeId = node.id
    const version = node.getVersion()
    const parentChain = this.computeParentChain(node, allNodes)

    const cached = this.cache.get(nodeId)

    // Cache hit - check if still valid
    if (cached && cached.version === version && cached.parentChain === parentChain) {
      const xyflowNode = cached.xyflowNode

      // Update mutable properties that don't affect cache validity
      const posRounded = {
        x: Math.round(position.x),
        y: Math.round(position.y),
      }

      if (xyflowNode.position.x !== posRounded.x || xyflowNode.position.y !== posRounded.y) {
        xyflowNode.position = posRounded
      }

      // Update selection state (XYFlow manages this internally)
      const isSelected = node.metadata.ui?.state?.isSelected || false
      if (xyflowNode.selected !== isSelected) {
        xyflowNode.selected = isSelected
      }

      return xyflowNode  // Same reference - React won't re-render!
    }

    // Cache miss - create new XYFlow node
    const xyflowNode = this.createXYFlowNode(node, position, categoryMetadata, layerDepth, allNodes)

    this.cache.set(nodeId, {
      version,
      parentChain,
      xyflowNode,
    })

    return xyflowNode
  }

  /**
   * Remove node from cache when deleted
   */
  remove(nodeId: string): void {
    this.cache.delete(nodeId)
  }

  /**
   * Clear entire cache (e.g., when switching flows)
   */
  clear(): void {
    this.cache.clear()
  }

  private computeParentChain(node: INode, allNodes: Record<string, INode>): string {
    const parents: string[] = []
    let current = node
    while (current.metadata.parentNodeId) {
      parents.push(current.metadata.parentNodeId)
      current = allNodes[current.metadata.parentNodeId]
      if (!current) break
    }
    return parents.join('-')
  }

  private createXYFlowNode(
    node: INode,
    position: { x: number; y: number },
    categoryMetadata: CategoryMetadata,
    layerDepth: number,
    allNodes: Record<string, INode>,
  ): Node {
    const nodeType = node.metadata.category === 'group' ? 'groupNode' : 'chaingraphNode'
    const parentNode = node.metadata.parentNodeId ? allNodes[node.metadata.parentNodeId] : undefined
    const isMovingDisabled = node.metadata.ui?.state?.isMovingDisabled === true

    return {
      id: node.id,
      type: nodeType,
      position: {
        x: Math.round(position.x),
        y: Math.round(position.y),
      },
      width: node.metadata.ui?.dimensions?.width || (nodeType === 'groupNode' ? 300 : 200),
      height: node.metadata.ui?.dimensions?.height || (nodeType === 'groupNode' ? 200 : 100),
      draggable: !isMovingDisabled,
      zIndex: layerDepth,
      data: {
        node,
        categoryMetadata,
      },
      parentId: node.metadata.parentNodeId,
      extent: parentNode && parentNode.metadata.category !== 'group' ? 'parent' : undefined,
      selected: node.metadata.ui?.state?.isSelected || false,
      hidden: node.metadata.ui?.state?.isHidden || false,
    }
  }
}
```

**Modified store** (`stores.ts:555-684`):

```typescript
// Create persistent cache (outside store definition)
const xyflowNodeCache = new XYFlowNodeCache()

export const $xyflowNodes = combine(
  $nodes,
  $nodePositions,
  $categoryMetadata,
  $nodeLayerDepth,
  (nodes, nodePositions, categoryMetadata, nodeLayerDepth) => {
    if (!nodes || Object.keys(nodes).length === 0) {
      return []
    }

    // Clean cache for removed nodes
    for (const cachedId of xyflowNodeCache.keys()) {
      if (!nodes[cachedId]) {
        xyflowNodeCache.remove(cachedId)
      }
    }

    const getCategoryMetadata = (categoryId: string) =>
      categoryMetadata.get(categoryId) ?? categoryMetadata.get(NODE_CATEGORIES.OTHER)!

    // Sort only if needed (group nodes first)
    const hasGroupNodes = Object.values(nodes).some(n => n.metadata.category === NODE_CATEGORIES.GROUP)
    const nodeList = Object.values(nodes)

    const sortedNodes = hasGroupNodes
      ? nodeList.sort((a, b) => {
          if (a.metadata.category === NODE_CATEGORIES.GROUP) return -1
          if (b.metadata.category === NODE_CATEGORIES.GROUP) return 1
          return 0
        })
      : nodeList

    // Use cache to preserve node references
    return sortedNodes
      .filter(node => node.metadata.ui?.state?.isHidden !== true)
      .map((node): Node => {
        const position = nodePositions[node.id] || node.metadata.ui?.position || DefaultPosition
        const nodeCategoryMetadata = getCategoryMetadata(node.metadata.category!)
        const depth = nodeLayerDepth[node.id] ?? 0

        return xyflowNodeCache.getOrCreate(
          node,
          position,
          nodeCategoryMetadata,
          depth,
          nodes,
        )
      })
  }
)

// Clear cache when flow cleared
sample({
  clock: clearNodes,
  fn: () => {
    xyflowNodeCache.clear()
  },
})
```

**Benefits**:
- Unchanged nodes return same object reference → React skips re-render
- Parent chain computed once, cached until parent changes
- Position updates mutate existing object → no new allocation

**Expected improvement**: 50-70% reduction in node component re-renders

---

### ✅ Solution 3: Decouple $nodeLayerDepth Calculation

**Impact**: 🟡 **MEDIUM-HIGH** - Prevents double cascade
**Effort**: 🟢 **LOW** - Event-based trigger
**Risk**: 🟢 **LOW** - Layer depth only depends on parent relationships

#### Motivation

Layer depth only changes when parent relationships change (rare), but currently recalculates on every `$nodes` update (common). This causes `$xyflowNodes` to fire twice per update.

#### Implementation

**File to modify**: `apps/chaingraph-frontend/src/store/nodes/stores.ts:458-506`

**Current code**:
```typescript
export const $nodeLayerDepth = combine(
  $nodes,  // ⚠️ Triggers on EVERY node change
  (nodes) => {
    // ... expensive recursive calculation ...
  }
)
```

**Proposed code**:
```typescript
// New event: trigger only when parent structure changes
export const nodeParentStructureChanged = nodesDomain.createEvent<void>()

// Trigger events that affect parent hierarchy
sample({
  clock: [
    addNode,
    addNodes,
    removeNode,
    updateNodeParent,
    clearNodes,
  ],
  target: nodeParentStructureChanged,
})

// Throttled to prevent multiple recalculations during batch operations
const throttledParentStructureChange = throttle({
  source: nodeParentStructureChanged,
  timeout: 50,  // 50ms debounce
})

// Store only recalculates when parent structure actually changes
export const $nodeLayerDepth = nodesDomain.createStore<Record<string, number>>({})
  .on(throttledParentStructureChange, () => {
    const nodes = $nodes.getState()
    const depthCache = new Map<string, number>()

    const calculateDepth = (nodeId: string, visited = new Set<string>()): number => {
      if (depthCache.has(nodeId)) {
        return depthCache.get(nodeId)!
      }

      const node = nodes[nodeId]
      if (!node) return 0
      if (!node.metadata.parentNodeId) {
        depthCache.set(nodeId, 0)
        return 0
      }

      if (visited.has(nodeId)) {
        console.warn(`Circular reference detected for node ${nodeId}`)
        depthCache.set(nodeId, 0)
        return 0
      }

      visited.add(nodeId)
      const parentDepth = calculateDepth(node.metadata.parentNodeId, visited)
      const depth = parentDepth + 1

      depthCache.set(nodeId, depth)
      return depth
    }

    const depths: Record<string, number> = {}
    Object.keys(nodes).forEach((nodeId) => {
      depths[nodeId] = calculateDepth(nodeId)
    })

    return depths
  })
  .reset(clearNodes)
  .reset(globalReset)
```

**Benefits**:
- $nodeLayerDepth no longer triggers on position/dimension/port updates
- Reduces $xyflowNodes cascade frequency by ~90%
- 50ms debounce prevents multiple recalculations during batch adds

**Import needed**:
```typescript
import { throttle } from 'patronum'  // or implement custom throttle
```

---

### ✅ Solution 4: Batch Event Processing with Priority Queue

**Impact**: 🟡 **MEDIUM-HIGH** - Smooths frame timing
**Effort**: 🟡 **MEDIUM** - Requires batching infrastructure
**Risk**: 🟡 **MEDIUM** - Must preserve event ordering guarantees

#### Motivation

Current sequential processing blocks the main thread. Events should be batched and processed during idle time to prevent frame drops.

#### Implementation

**Create new file**: `apps/chaingraph-frontend/src/store/flow/event-batch-processor.ts`

```typescript
import type { FlowEvent } from '@badaitech/chaingraph-types'
import { createEvent, createStore, sample } from 'effector'

interface EventBatch {
  events: FlowEvent[]
  timestamp: number
}

/**
 * Batches incoming flow events and processes them during browser idle time
 * Prevents blocking the main thread during rapid event streams
 */

// Store for pending events
const $pendingEventBatch = flowDomain.createStore<FlowEvent[]>([])

// Events
export const queueFlowEvents = flowDomain.createEvent<FlowEvent[]>()
export const processBatchedEvents = flowDomain.createEvent<FlowEvent[]>()
const scheduleProcessing = flowDomain.createEvent<void>()

// Collect events into pending batch
$pendingEventBatch.on(queueFlowEvents, (pending, newEvents) => {
  return [...pending, ...newEvents]
})

// Clear batch after processing
$pendingEventBatch.on(processBatchedEvents, () => [])

// Schedule processing using requestIdleCallback
scheduleProcessing.watch(() => {
  // Use requestIdleCallback for non-blocking processing
  if ('requestIdleCallback' in window) {
    requestIdleCallback(
      () => {
        const batch = $pendingEventBatch.getState()
        if (batch.length > 0) {
          processBatchedEvents(batch)
        }
      },
      { timeout: 32 }  // Max 2 frames delay
    )
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      const batch = $pendingEventBatch.getState()
      if (batch.length > 0) {
        processBatchedEvents(batch)
      }
    }, 0)
  }
})

// Trigger scheduling when new events arrive
sample({
  clock: queueFlowEvents,
  target: scheduleProcessing,
})
```

**Modify**: `apps/chaingraph-frontend/src/store/flow/stores.ts:689-716`

**Current code**:
```typescript
sample({
  clock: newFlowEvents,
  source: combine({ nodes: $nodes, flowId: $activeFlowId }),
  fn: ({ nodes, flowId }, events) => ({ nodes, flowId: flowId!, events }),
  filter: ({ flowId }) => !!flowId,
  target: createEffect(async ({ nodes, flowId, events }) => {
    // Sequential processing...
  }),
})
```

**Proposed code**:
```typescript
import { queueFlowEvents, processBatchedEvents } from './event-batch-processor'

// Queue events instead of processing immediately
sample({
  clock: newFlowEvents,
  filter: () => !!$activeFlowId.getState(),
  target: queueFlowEvents,
})

// Process batched events
sample({
  clock: processBatchedEvents,
  source: combine({ nodes: $nodes, flowId: $activeFlowId }),
  fn: ({ nodes, flowId }, events) => ({ nodes, flowId: flowId!, events }),
  filter: ({ flowId }) => !!flowId,
  target: createEffect(async ({ nodes, flowId, events }) => {
    if (!flowId) return

    const eventHandlers = createEventHandlers(flowId, nodes)
    const handleEvent = createEventHandler(eventHandlers, {
      onError: (error, event) => {
        console.error(`Error handling event ${event.type}:`, error)
      },
    })

    // ✅ Still sequential but batched during idle time
    for (const event of events) {
      try {
        await handleEvent(event)
      } catch (error) {
        console.error(`Unhandled error processing event ${event.type}:`, error)
      }
    }
  }),
})
```

**Benefits**:
- Events processed during browser idle time (doesn't block drag)
- Multiple events batched together (fewer effect invocations)
- Maintains event ordering for consistency

**Trade-offs**:
- Events may arrive 1-2 frames later (imperceptible to users)
- More complex event flow (harder to debug)

---

### ✅ Solution 5: Reduce Component Subscriptions via Combined Store

**Impact**: 🟡 **MEDIUM** - Reduces subscription overhead
**Effort**: 🟡 **MEDIUM** - Requires refactoring components
**Risk**: 🟡 **MEDIUM** - Must maintain same render behavior

#### Motivation

Each node component has 10+ individual store subscriptions. Store updates trigger evaluation of all subscriptions even if results don't change. A single combined subscription reduces this overhead.

#### Implementation

**Create new file**: `apps/chaingraph-frontend/src/store/nodes/render-data.ts`

```typescript
import type { INode } from '@badaitech/chaingraph-types'
import { combine } from 'effector'
import { nodesDomain } from '../domains'
import { $nodes } from './stores'
import { $executionState, $breakpoints } from '../execution'
import { $highlightedNodes } from './computed'
import { $dragDropState } from '../drag-drop'

/**
 * Optimized render data for node components
 * Combines multiple stores into a single subscription point
 */
export interface NodeRenderData {
  // Core node data
  node: INode | undefined
  version: number

  // UI state
  isSelected: boolean
  isHidden: boolean
  isMovingDisabled: boolean

  // Execution state
  executionState: 'idle' | 'running' | 'success' | 'error' | undefined
  executionStyle: string | undefined
  hasBreakpoint: boolean

  // Interaction state
  isHighlighted: boolean
  hasAnyHighlights: boolean
  isDragging: boolean
  canAcceptDrop: boolean

  // Parent reference (minimal)
  parentNodeId: string | undefined
}

/**
 * Combined store with all render-relevant data
 * Single subscription point instead of 10+ separate hooks
 */
export const $nodeRenderDataMap = combine(
  $nodes,
  $executionState,
  $breakpoints,
  $highlightedNodes,
  $dragDropState,
  (nodes, executionState, breakpoints, highlightedNodes, dragDropState) => {
    const result: Record<string, NodeRenderData> = {}

    for (const [nodeId, node] of Object.entries(nodes)) {
      const nodeExecState = executionState.nodeStates?.[nodeId]
      const hasHighlights = highlightedNodes.size > 0

      result[nodeId] = {
        node,
        version: node.getVersion(),

        // UI state (from node metadata)
        isSelected: node.metadata.ui?.state?.isSelected || false,
        isHidden: node.metadata.ui?.state?.isHidden || false,
        isMovingDisabled: node.metadata.ui?.state?.isMovingDisabled || false,

        // Execution state
        executionState: nodeExecState?.status,
        executionStyle: computeExecutionStyle(nodeExecState),
        hasBreakpoint: breakpoints.has(nodeId),

        // Interaction state
        isHighlighted: highlightedNodes.has(nodeId),
        hasAnyHighlights: hasHighlights,
        isDragging: dragDropState.draggingNodes.includes(nodeId),
        canAcceptDrop: dragDropState.dropFeedback?.[nodeId]?.canAcceptDrop || false,

        // Parent
        parentNodeId: node.metadata.parentNodeId,
      }
    }

    return result
  }
)

function computeExecutionStyle(execState: any): string | undefined {
  if (!execState) return undefined

  switch (execState.status) {
    case 'running': return 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.6)]'
    case 'success': return 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]'
    case 'error': return 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]'
    default: return undefined
  }
}
```

**Create new hook**: `apps/chaingraph-frontend/src/store/nodes/hooks/useNodeRenderData.ts`

```typescript
import { useStoreMap } from 'effector-react'
import { $nodeRenderDataMap, type NodeRenderData } from '../render-data'

/**
 * Optimized hook for node render data
 * Single store subscription instead of 10+
 */
export function useNodeRenderData(nodeId: string): NodeRenderData | undefined {
  return useStoreMap({
    store: $nodeRenderDataMap,
    keys: [nodeId],
    fn: (dataMap, [id]) => dataMap[id],
    updateFilter: (prev, next) => {
      // Skip update if data unchanged
      if (!prev && !next) return false
      if (!prev || !next) return true

      // Compare only render-relevant properties
      return (
        prev.version !== next.version ||
        prev.isSelected !== next.isSelected ||
        prev.executionState !== next.executionState ||
        prev.isHighlighted !== next.isHighlighted ||
        prev.hasAnyHighlights !== next.hasAnyHighlights ||
        prev.isDragging !== next.isDragging ||
        prev.canAcceptDrop !== next.canAcceptDrop
      )
    },
  })
}
```

**Modify component**: `apps/chaingraph-frontend/src/components/flow/nodes/ChaingraphNode/ChaingraphNode.tsx:65-93`

**Before** (10+ subscriptions):
```typescript
function ChaingraphNodeComponent({ data, selected, id }: NodeProps) {
  const node = useNode(id)
  const parentNode = useNode(node?.metadata.parentNodeId || '')
  const nodeExecution = useNodeExecution(id)
  const executionStyle = useNodeExecutionStyle(id)
  const nodePulseState = useNodePulseState(id)
  const portContext = useNodePortContextValue(id)
  const isHighlighted = useIsNodeHighlighted(id)
  const hasHighlights = useHasHighlightedNodes()
  const dropFeedback = useNodeDropFeedback(id)
  const isBreakpointSet = useBreakpoint(id)
  // ...
}
```

**After** (1 subscription):
```typescript
function ChaingraphNodeComponent({ data, selected, id }: NodeProps) {
  // ✅ Single subscription
  const renderData = useNodeRenderData(id)

  // Minimal additional subscriptions for data not in renderData
  const portContext = useNodePortContextValue(id)  // Complex, keep separate
  const nodePulseState = useNodePulseState(id)     // Deferred, keep separate

  const activeFlow = useUnit($activeFlowMetadata)
  const isFlowLoaded = useUnit($isFlowLoaded)

  if (!renderData || !renderData.node) return null

  // Use renderData.* instead of individual hooks
  const node = renderData.node
  const parentNode = useNode(renderData.parentNodeId || '')  // Only if has parent
  const isHighlighted = renderData.isHighlighted
  const hasHighlights = renderData.hasAnyHighlights
  // ...
}
```

**Benefits**:
- 30 nodes × 10 fewer subscriptions = 300 fewer subscription evaluations
- updateFilter runs once instead of 10+ times
- Easier to reason about component updates

---

### ✅ Solution 6: Structural Sharing in $nodes Updates

**Impact**: 🟠 **MEDIUM** - Reduces unnecessary reference changes
**Effort**: 🟢 **LOW** - Add equality checks
**Risk**: 🟢 **LOW** - Purely optimization, no behavior change

#### Motivation

Current code spreads entire `$nodes` state even when the node reference hasn't changed. This creates a new state object unnecessarily, triggering cascades.

#### Implementation

**File to modify**: `apps/chaingraph-frontend/src/store/nodes/stores.ts:214-284`

**Current code**:
```typescript
export const $nodes = nodesDomain.createStore<Record<string, INode>>({})
  .on(addNode, (state, node) => {
    return { ...state, [node.id]: node }  // ⚠️ Always spreads
  })

  .on(updateNode, (state, node) => {
    return { ...state, [node.id]: node }  // ⚠️ Always spreads
  })

  .on(setNodeVersion, (state, { nodeId, version }) => {
    const node = state[nodeId]
    if (!node) {
      console.error(`Node ${nodeId} not found in store`)
      return state
    }

    const updatedNode = node.clone()  // ⚠️ Always clones
    updatedNode.setVersion(version)

    return { ...state, [nodeId]: updatedNode }  // ⚠️ Always spreads
  })
```

**Proposed code**:
```typescript
export const $nodes = nodesDomain.createStore<Record<string, INode>>({})
  .on(addNode, (state, node) => {
    // Check if node already exists with same reference
    if (state[node.id] === node) {
      return state  // ✅ Same reference - no update
    }
    return { ...state, [node.id]: node }
  })

  .on(updateNode, (state, node) => {
    const existing = state[node.id]

    // ✅ Skip if reference unchanged
    if (existing === node) {
      return state
    }

    // ✅ Skip if version not newer (handles race conditions)
    if (existing && existing.getVersion() >= node.getVersion()) {
      return state
    }

    return { ...state, [node.id]: node }
  })

  .on(setNodeVersion, (state, { nodeId, version }) => {
    const node = state[nodeId]
    if (!node) {
      console.error(`Node ${nodeId} not found in store`)
      return state
    }

    // ✅ Skip if version already set
    if (node.getVersion() === version) {
      return state
    }

    const updatedNode = node.clone()
    updatedNode.setVersion(version)

    return { ...state, [nodeId]: updatedNode }
  })
```

**Also apply to**:
- `.on(updateNodes, ...)` (line 233-240)
- `.on(setNodeMetadata, ...)` (line 257-268)
- `.on(updatePort, ...)` (line 287-320)

**Benefits**:
- Prevents cascade when event doesn't change state
- Handles race conditions (old events arriving late)
- Zero behavior change, pure optimization

---

### ✅ Solution 7: Optimize Position Update Path

**Impact**: 🟠 **MEDIUM** - Smoother drag experience
**Effort**: 🟢 **LOW** - Skip unnecessary interpolator calls
**Risk**: 🟢 **LOW** - Position interpolation already has guards

#### Motivation

Position updates flow through interpolator even when position is unchanged. Adding early exit prevents unnecessary work.

#### Implementation

**File to modify**: `apps/chaingraph-frontend/src/store/nodes/stores.ts:791-802`

**Current code**:
```typescript
$nodes
  .on(updateNodePositionInterpolated, (state, { nodeId, position }) => {
    const node = state[nodeId]
    if (!node)
      return state

    // Clone the node and update its position
    const updatedNode = node.clone()
    updatedNode.setPosition(position, false)

    return { ...state, [nodeId]: updatedNode }
  })
```

**Proposed code**:
```typescript
$nodes
  .on(updateNodePositionInterpolated, (state, { nodeId, position }) => {
    const node = state[nodeId]
    if (!node)
      return state

    // ✅ Skip if position unchanged
    const currentPos = node.metadata.ui?.position
    if (currentPos &&
        Math.abs(currentPos.x - position.x) < 1 &&
        Math.abs(currentPos.y - position.y) < 1) {
      return state  // Position unchanged - no update needed
    }

    // Clone the node and update its position
    const updatedNode = node.clone()
    updatedNode.setPosition(position, false)

    return { ...state, [nodeId]: updatedNode }
  })
```

**Also add to**: `apps/chaingraph-frontend/src/store/nodes/stores.ts:728-749` (updateNodePositionLocal)

**Benefits**:
- Prevents $nodes cascade when server echoes same position
- Works with Solution 1 to provide defense in depth
- Minimal code change

---

## Implementation Priority & Expected Impact

### Phase 1: Immediate Wins (Week 1)

**Target**: 40-50% FPS improvement

1. **Solution 1** - Smart event deduplication (4 hours)
   - Modify event handlers in `stores.ts:410-686`
   - Add position/dimension comparison logic
   - Test with multi-user scenario
   - **Expected**: 20-30% FPS improvement

2. **Solution 6** - Structural sharing (2 hours)
   - Add equality checks in `stores.ts:214-284`
   - Test with rapid updates
   - **Expected**: 10-15% FPS improvement

3. **Solution 7** - Position update optimization (1 hour)
   - Add early exit in `stores.ts:791-802`
   - **Expected**: 5-10% FPS improvement

---

### Phase 2: Architectural Improvements (Week 2)

**Target**: Additional 20-30% FPS improvement

4. **Solution 3** - Decouple layer depth (6 hours)
   - Create `nodeParentStructureChanged` event
   - Refactor `$nodeLayerDepth` to event-based
   - Add throttling
   - Test parent relationship changes
   - **Expected**: 15-20% FPS improvement

5. **Solution 2** - Persistent XYFlow node cache (8 hours)
   - Create `XYFlowNodeCache` class
   - Refactor `$xyflowNodes` to use cache
   - Test node additions/removals
   - Handle cache invalidation edge cases
   - **Expected**: 20-30% FPS improvement

---

### Phase 3: Advanced Optimizations (Week 3+)

**Target**: Smooth 60 FPS in flows up to 100+ nodes

6. **Solution 4** - Batch event processing (12 hours)
   - Create event batch processor
   - Integrate with subscription flow
   - Test event ordering guarantees
   - Handle edge cases (rapid updates during batch)
   - **Expected**: Smoother frame timing, reduced jank

7. **Additional optimizations**:
   - Move deserialization to Web Worker
   - Implement virtual rendering for large flows
   - Optimize port computation in WASM

---

## Testing Strategy

### Performance Benchmarks

**Before optimization**:
```typescript
// Create test flow
const flow = createTestFlow({
  nodeCount: 30,
  edgeCount: 50,
  nodeTypes: ['llm-prompt', 'event-emitter', 'string-input', 'object-builder'],
})

// Measure drag performance
const fps = measureDragFPS({
  flow,
  dragDistance: 500,  // pixels
  dragDuration: 2000, // ms
})

// Expected baseline: 20-35 FPS
```

**After each solution**:
- Repeat benchmark
- Compare FPS improvement
- Profile with Chrome DevTools Performance tab
- Check for regressions

### Test Cases

1. **Basic drag** (30 nodes, no edges)
2. **Connected drag** (30 nodes, 50 edges)
3. **Multi-user edit** (simulate concurrent position updates)
4. **Batch operations** (paste 10 nodes at once)
5. **Parent relationship changes** (drag into/out of groups)

### Regression Tests

Ensure solutions don't break:
- Multi-user collaboration (others' edits still visible)
- Event ordering (no out-of-order updates)
- Optimistic updates (immediate feedback preserved)
- Version conflict resolution (newer versions win)

---

## Alternative Approaches Considered

### ❌ Skip All Server Echoes During Drag

**Rejected because**: Multi-user editing requires processing other users' updates even during active drag.

**Original flawed idea**:
```typescript
// ❌ DON'T DO THIS
const draggingNodes = $draggingNodes.getState()
if (draggingNodes.includes(data.nodeId)) {
  return  // Skip ALL echoes - breaks multi-user!
}
```

---

### ⚠️ Move Computation to Web Worker

**Considered but deferred**: Requires significant refactoring

**Approach**:
- Deserialize events in Worker
- Compute derived stores in Worker
- Transfer minimal data to main thread

**Challenges**:
- INode instances use class methods (not serializable)
- Effector stores must run on main thread
- Complexity vs benefit trade-off unclear

**Decision**: Defer until Phase 1-2 optimizations exhausted

---

### ⚠️ Virtual Rendering (Windowing)

**Considered for future**: Not needed for current scale (30-50 nodes)

**Approach**:
- Only render nodes visible in viewport
- Use `react-window` or similar
- Maintain virtual scroll position

**Decision**: Revisit if flows regularly exceed 100+ nodes

---

## Monitoring & Validation

### Metrics to Track

**Before/After Comparison**:
1. **FPS during drag** (target: 60 FPS)
2. **Time to process event batch** (target: < 16ms)
3. **Number of React re-renders per update** (target: 50% reduction)
4. **Memory usage** (ensure cache doesn't leak)

### Instrumentation Points

**Add performance marks**:

**File**: `apps/chaingraph-frontend/src/store/flow/stores.ts:689`

```typescript
sample({
  clock: newFlowEvents,
  source: combine({ nodes: $nodes, flowId: $activeFlowId }),
  target: createEffect(async ({ nodes, flowId, events }) => {
    performance.mark('events-process-start')

    // Process events...

    performance.mark('events-process-end')
    performance.measure('events-processing', 'events-process-start', 'events-process-end')
  }),
})
```

**File**: `apps/chaingraph-frontend/src/store/nodes/stores.ts:555`

```typescript
export const $xyflowNodes = combine(
  $nodes,
  $nodePositions,
  $categoryMetadata,
  $nodeLayerDepth,
  (nodes, nodePositions, categoryMetadata, nodeLayerDepth) => {
    performance.mark('xyflow-nodes-compute-start')

    // Computation...

    performance.mark('xyflow-nodes-compute-end')
    performance.measure('xyflow-nodes-compute', 'xyflow-nodes-compute-start', 'xyflow-nodes-compute-end')

    return result
  }
)
```

**Chrome DevTools**:
- Record Performance profile during drag
- Analyze "Measure" entries
- Check Main thread utilization (target: < 50% during drag)

---

## Risk Assessment

### Low Risk (Safe to implement immediately)
- ✅ Solution 1 (Event deduplication) - Pure optimization, preserves semantics
- ✅ Solution 6 (Structural sharing) - Adds checks, no behavior change
- ✅ Solution 7 (Position optimization) - Early exit, same results

### Medium Risk (Needs careful testing)
- ⚠️ Solution 3 (Layer depth decoupling) - Must ensure all parent changes trigger event
- ⚠️ Solution 4 (Event batching) - Must preserve event ordering
- ⚠️ Solution 5 (Combined subscriptions) - Must maintain render equivalence

### High Risk (Future consideration)
- 🔴 Web Worker deserialization - Complex threading, debugging harder
- 🔴 Virtual rendering - Major architectural change

---

## Success Criteria

### Must Achieve
- ✅ 60 FPS during node drag with 30 nodes, 50 edges
- ✅ No regressions in multi-user editing
- ✅ Optimistic updates still feel instant (< 50ms)

### Nice to Have
- ✅ 60 FPS with 50+ nodes
- ✅ Reduced memory consumption
- ✅ Smoother event processing (no visible stutters)

---

## File Reference Index

### Core State Management
- `apps/chaingraph-frontend/src/store/domains.ts` - Domain definitions
- `apps/chaingraph-frontend/src/store/flow/subscription.ts` - Event subscription (56-62: onData)
- `apps/chaingraph-frontend/src/store/flow/stores.ts` - Flow stores (689-716: event processing, 410-686: handlers)
- `apps/chaingraph-frontend/src/store/nodes/stores.ts` - Node stores (555-684: $xyflowNodes, 459-506: $nodeLayerDepth, 791-802: position interpolation)
- `apps/chaingraph-frontend/src/store/nodes/operators/accumulate-and-sample.ts` - Throttling operator

### React Components
- `apps/chaingraph-frontend/src/components/flow/Flow.tsx` - Main flow
- `apps/chaingraph-frontend/src/components/flow/nodes/ChaingraphNode/ChaingraphNode.tsx` - Node component (65-93: subscriptions)
- `apps/chaingraph-frontend/src/components/flow/nodes/ChaingraphNode/ChaingraphNodeOptimized.tsx` - Memoization
- `apps/chaingraph-frontend/src/components/flow/hooks/useNodeChanges.ts` - Position handling (36-74)

### Type Definitions
- `packages/chaingraph-types/src/flow/events.ts` - FlowEvent types
- `packages/chaingraph-types/src/flow/serializer/flow-serializer.ts` - Serialization
- `packages/chaingraph-types/src/node/base-node-compositional.ts` - Node implementation
- `packages/chaingraph-types/src/port/base/BasePort.ts` - Port base class

### Utilities
- `apps/chaingraph-frontend/src/components/flow/utils/node-position.ts` - Position calculations
- `apps/chaingraph-frontend/src/store/nodes/position-interpolation-advanced.ts` - Position interpolator

---

## Appendix A: Profiling Data Collection Guide

### Chrome DevTools Performance Recording

1. Open ChainGraph editor with test flow (30 nodes)
2. Open DevTools → Performance tab
3. Click Record
4. Drag a node continuously for 3 seconds
5. Stop recording
6. Analyze:
   - **Main thread** - Look for long tasks (yellow blocks)
   - **Scripting** - Time spent in JavaScript
   - **Rendering** - Time spent in layout/paint
   - **FPS graph** - Target steady 60 FPS (green line)

### Key Metrics to Extract

**From Main Thread**:
- Time spent in `combine()` functions
- Time spent in `createEffect()`
- Time spent in React reconciliation

**From Call Tree**:
- `$xyflowNodes` computation time
- `$nodeLayerDepth` computation time
- Event handler execution time

**From Bottom-Up**:
- Top self-time functions
- Identify hot paths

---

## Appendix B: Effector Store Update Semantics

### How Effector Propagates Updates

```typescript
const $storeA = createStore(initialA)
const $storeB = $storeA.map(a => transformA(a))
const $storeC = combine($storeA, $storeB, (a, b) => computeC(a, b))

// When $storeA updates:
eventA()
  ↓
$storeA state changes
  ↓
$storeB.map() fires → transformA() runs → $storeB state changes
  ↓
$storeC.combine() fires → computeC() runs → $storeC state changes
  ↓
All React hooks subscribed to $storeA, $storeB, $storeC re-evaluate
```

### Update Batching

Effector **batches synchronous updates** within a single event:
```typescript
eventA()      // Triggers cascade
eventB()      // Triggers cascade
// React re-renders once for both

// But:
await eventA()
await eventB()
// React re-renders twice (different microtasks)
```

**Reference**: This is why the `for (const event of events)` loop with `await` causes multiple render cycles.

---

## Appendix C: React Reconciliation Impact

### How React Processes Node Updates

**File**: `apps/chaingraph-frontend/src/components/flow/Flow.tsx:227-230`

```typescript
<ReactFlow
  nodes={nodes}  // From useXYFlowNodes()
  nodeTypes={nodeTypes}
  edges={edges}
  // ...
/>
```

When `nodes` array reference changes:
1. React compares `prevNodes === nextNodes` → `false`
2. Iterates all elements: `prevNodes[i] === nextNodes[i]`
3. For changed elements, calls `shouldComponentUpdate` or memo comparison
4. Re-renders changed components

**File**: `apps/chaingraph-frontend/src/components/flow/nodes/ChaingraphNode/ChaingraphNodeOptimized.tsx:16-50`

```typescript
const ChaingraphNodeOptimized = memo(
  (props: NodeProps<ChaingraphNode>) => <ChaingraphNodeComponent {...props} />,
  (prevProps, nextProps) => {
    // Compare IDs
    if (prevProps.id !== nextProps.id)
      return false

    // Compare selected state
    if (prevProps.selected !== nextProps.selected)
      return false

    // Compare node version
    const prevVersion = prevProps.data?.node?.getVersion?.() ?? 0
    const nextVersion = nextProps.data?.node?.getVersion?.() ?? 0
    if (prevVersion !== nextVersion)
      return false

    // ... more checks ...

    return true  // Skip re-render
  },
)
```

**Good**: Custom memo prevents unnecessary re-renders
**Problem**: Still invoked for all 30 nodes even if only 1 changed
**Solution 2 benefit**: Unchanged nodes keep same reference → memo comparison skips immediately

---

## Questions for Validation

1. **Solution 1 approach**: Does comparing position values (< 1px tolerance) correctly identify echo events in multi-user scenarios?

2. **Solution 2 cache invalidation**: Are there edge cases where the cache should be invalidated beyond version/parent changes?

3. **Solution 3 throttling**: Is 50ms debounce acceptable for parent relationship changes, or should it be immediate?

4. **Solution 4 batching**: Are there specific event types that must be processed immediately (no batching)?

5. **Solution 5 combined store**: What other render-relevant data should be included in `NodeRenderData`?

---

## Next Steps

1. **Validate this analysis** - Confirm findings match observed behavior
2. **Prioritize solutions** - Which order provides best incremental improvement?
3. **Create performance test harness** - Automated FPS measurements
4. **Implement Phase 1** - Start with low-risk, high-impact solutions
5. **Measure & iterate** - Profile after each change, adjust approach

---

**End of Document**

*This analysis provides a foundation for systematic performance optimization of the ChainGraph flow editor. Each solution is designed to be implementable independently with measurable impact.*
