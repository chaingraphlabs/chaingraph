# State Management Architecture v2 - Event-Driven Approach

**Last Updated:** 2025-12-18
**Status:** Approved for implementation

## Problem Summary

Single port UI toggle causes:
- **73.8ms** processing time
- **441 traces**
- **400+ component re-renders** (all nodes, not just changed one)

**Root Cause:** Store subscriptions create cascades. Port update → $nodes fires → ALL derived stores recalculate.

## Current Architecture Issues

### Issue 1: WIRE 2 Uses $nodes as Clock
**File:** `apps/chaingraph-frontend/src/store/xyflow/stores/node-render-data.ts:260`

```typescript
sample({
  clock: $nodes,  // ← Fires on ANY $nodes change (including port updates!)
  source: $xyflowNodeRenderMap,
  fn: (renderMap, nodes) => {
    for (const [nodeId, node] of Object.entries(nodes)) {
      // ↑ O(N) - checks ALL nodes even when only 1 port changed
    }
  }
})
```

### Issue 2: $nodeExecutionStyles Depends on $nodes
**File:** `apps/chaingraph-frontend/src/store/nodes/computed/execution-styles.ts:30`

```typescript
export const $nodeExecutionStyles = combine(
  $nodes,           // ← Fires on ANY $nodes change
  $executionNodes,
  $executionState,
  (nodes, ...) => {
    Object.keys(nodes).forEach(...)  // O(N) recalculation
  }
)
```

### Issue 3: Port Updates Clone Full Node
**File:** `apps/chaingraph-frontend/src/store/nodes/stores.ts:340`

```typescript
.on(updatePort, (state, { id, data }) => {
  const updatedNode = node  // Even without .clone(), returns new state object
  return { ...state, [nodeId]: updatedNode }  // $nodes fires!
})
```

## Solution: Event-Driven Updates

**Principle:** Use granular Effector events instead of store subscriptions. Events carry entity IDs, allowing O(1) targeted updates.

### Existing Backend Events (FlowEventType)

We already have granular events from the backend:

```typescript
enum FlowEventType {
  // Structure events (should trigger WIRE 2)
  NodeAdded = 'flow:node:added',
  NodesAdded = 'flow:nodes:added',
  NodeRemoved = 'flow:node:removed',
  NodeParentUpdated = 'flow:node:parent-updated',

  // Data events (should trigger targeted WIRE 2)
  NodeUpdated = 'flow:node:updated',
  NodesUpdated = 'flow:nodes:updated',

  // Port events (should NOT trigger WIRE 2 - port-only changes)
  PortCreated = 'flow:port:created',
  PortUpdated = 'flow:port:updated',
  PortRemoved = 'flow:port:removed',

  // UI events (should trigger targeted WIRE 2)
  NodeUIPositionChanged = 'flow:node:ui:position-changed',
  NodeUIDimensionsChanged = 'flow:node:ui:dimensions-changed',
  NodeUIChanged = 'flow:node:ui:changed',
}
```

**Key insight:** We have the granularity at the backend event level. We lose it when we merge everything into `$nodes`.

## Implementation Plan

### Phase 1: Event-Driven WIRE 2 (Minimal Change)

**Goal:** WIRE 2 should not run for port-only updates.

**Current Problem:**
```
PortUpdated → updatePort → $nodes.on() → { ...state, [nodeId]: node } → $nodes fires → WIRE 2 runs
```

**Solution:** Change WIRE 2 clock from `$nodes` to specific events.

```typescript
// apps/chaingraph-frontend/src/store/xyflow/stores/node-render-data.ts

// NEW: Granular events for node data changes
export const nodeDataChanged = xyflowDomain.createEvent<{
  nodeId: string
  changes: Partial<XYFlowNodeRenderData>
}>()

export const nodesDataChanged = xyflowDomain.createEvent<{
  nodeIds: string[]
}>()

// WIRE 2: Node data changes (NOT triggered by port-only updates)
sample({
  clock: [
    // Structure changes - need full render data
    addNode,
    addNodes,
    removeNode,
    updateNodeParent,

    // UI changes - need position/dimensions update
    updateNodeUILocal,
    updateNodeDimensionsLocal,

    // Node metadata changes - need version/category update
    updateNode,
    updateNodes,
    setNodeMetadata,

    // NOT included: updatePort, updatePortUI, requestUpdatePortValue
  ],
  source: { renderMap: $xyflowNodeRenderMap, nodes: $nodes },
  fn: ({ renderMap, nodes }, payload) => {
    // Extract nodeId(s) from the event payload
    const nodeIds = getNodeIdsFromPayload(payload)

    // Only check affected nodes - O(k) where k is affected nodes
    const changes: XYFlowNodesDataChangedPayload['changes'] = []
    for (const nodeId of nodeIds) {
      const node = nodes[nodeId]
      const current = renderMap[nodeId]
      if (!node || !current) continue

      // Check for actual changes (same logic as current)
      const updates = computeNodeUpdates(current, node)
      if (Object.keys(updates).length > 0) {
        changes.push({ nodeId, changes: updates })
      }
    }

    return { changes }
  },
  target: xyflowNodesDataChanged,
})

// Helper to extract nodeIds from various event payloads
function getNodeIdsFromPayload(payload: unknown): string[] {
  if (!payload) return []

  // INode
  if (typeof payload === 'object' && 'id' in payload) {
    return [(payload as INode).id]
  }

  // INode[]
  if (Array.isArray(payload)) {
    return payload.map(n => n.id)
  }

  // { nodeId: string }
  if (typeof payload === 'object' && 'nodeId' in payload) {
    return [(payload as { nodeId: string }).nodeId]
  }

  return []
}
```

**Impact:** Port updates will NOT trigger WIRE 2 → no O(N) scan → massive performance improvement.

### Phase 2: Remove $nodes from $nodeExecutionStyles

**Goal:** Execution styles should only recalculate when execution state changes, not on every node/port update.

```typescript
// apps/chaingraph-frontend/src/store/nodes/computed/execution-styles.ts

// BEFORE: Recalculates on every $nodes change
export const $nodeExecutionStyles = combine(
  $nodes,           // ← REMOVE THIS
  $executionNodes,
  $executionState,
  (nodes, executionNodes, executionState) => {...}
)

// AFTER: Only recalculates when execution state changes
export const $nodeExecutionStyles = combine(
  $executionNodes,
  $executionState,
  (executionNodes, executionState) => {
    const styles: Record<string, NodeExecutionStyle> = {}

    // Only iterate executionNodes, not all nodes
    Object.entries(executionNodes).forEach(([nodeId, nodeExecution]) => {
      styles[nodeId] = computeExecutionStyle(nodeExecution, executionState)
    })

    return styles
  }
)

// For nodes without execution state, return default style in component
function useNodeExecutionStyle(nodeId: string) {
  const styles = useUnit($nodeExecutionStyles)
  return styles[nodeId] ?? DEFAULT_EXECUTION_STYLE
}
```

**Impact:** Port/UI changes won't recalculate execution styles → 30ms saved.

### Phase 3: Skip Server Echo Events

**Goal:** Filter out stale server responses (echoes of our own updates).

```typescript
// apps/chaingraph-frontend/src/store/flow/stores.ts

[FlowEventType.PortUpdated]: (data) => {
  const nodeId = data.port.getConfig().nodeId!
  const node = nodes[nodeId]

  if (!node) return

  // Skip if we already have a newer version (our optimistic update was newer)
  if (data.nodeVersion && data.nodeVersion <= node.getVersion()) {
    console.debug(`[PortUpdated] Skipping stale event v${data.nodeVersion}, current v${node.getVersion()}`)
    return
  }

  updatePort({
    id: data.port.id,
    data: {
      config: data.port.getConfig(),
      value: data.port.getValue(),
    },
    nodeVersion: data.nodeVersion,
  })
}
```

**Impact:** ~50% reduction in port update processing.

### Phase 4: Separate Port Rendering (Future)

If more granularity is needed, we can create a separate `$portRenderData` store:

```typescript
// NEW: Port render data separate from node render data
export const $portRenderData = portsDomain.createStore<Map<string, PortRenderData>>(new Map())

// Port updates only affect $portRenderData, not $xyflowNodeRenderMap
sample({
  clock: [updatePort, updatePortUI],
  source: $portRenderData,
  fn: (renderData, event) => {
    const { portId, changes } = extractPortChanges(event)
    const newMap = new Map(renderData)
    newMap.set(portId, { ...newMap.get(portId), ...changes })
    return newMap
  },
  target: $portRenderData,
})

// Component subscribes to specific port
function usePortRenderData(portId: string) {
  return useStoreMap($portRenderData, portId)
}
```

This is a larger refactor but provides ultimate granularity.

## Multi-Flow Tab Support

For future multi-flow support, we need to scope stores by flowId:

```typescript
// apps/chaingraph-frontend/src/store/multi-flow/index.ts

// Tab management
export const $openTabs = createStore<Map<string, TabState>>(new Map())
export const $activeTabId = createStore<string>('default')

// Events for tab management
export const openFlowInTab = createEvent<{ flowId: string }>()
export const closeTab = createEvent<{ tabId: string }>()
export const switchTab = createEvent<{ tabId: string }>()

// Per-flow subscriptions
interface TabState {
  tabId: string
  flowId: string
  subscriptionStatus: 'idle' | 'connecting' | 'subscribed' | 'error'
}

// When tab is opened, create subscription
sample({
  clock: openFlowInTab,
  fn: ({ flowId }) => ({
    tabId: generateTabId(),
    flowId,
    subscriptionStatus: 'connecting' as const,
  }),
  target: addTab,
})

// Flow events scoped to tabs
sample({
  clock: newFlowEvents,
  source: $openTabs,
  filter: (tabs, event) => {
    // Process event only for tabs subscribed to this flow
    return Array.from(tabs.values()).some(tab => tab.flowId === event.flowId)
  },
  target: processFlowEvent,
})
```

## Backend Event Suggestions

If we need more granular events, we could add:

```typescript
// New events for better frontend optimization (optional)
enum FlowEventType {
  // Existing...

  // NEW: Batch port updates (single event for multiple port changes)
  PortsUpdated = 'flow:ports:updated',  // { ports: IPort[], nodeId: string }

  // NEW: Port value only changed (no config change)
  PortValueChanged = 'flow:port:value-changed',  // { portId, value, nodeId }

  // NEW: Port UI only changed (no value change)
  PortUIChanged = 'flow:port:ui-changed',  // { portId, ui, nodeId }
}
```

However, the current events are sufficient if we fix the frontend cascade issue.

## Expected Results

### Before (Current)
- Port toggle: **73.8ms**, 441 traces, 400+ renders

### After Phase 1-3
- Port toggle: **<5ms**, <20 traces, 1-2 renders (only affected component)
- Reason: No O(N) cascade, only targeted updates

### After Phase 4 (Optional)
- Port toggle: **<2ms**, <5 traces, 1 render
- Reason: Port changes completely isolated from node render data

## File Changes Summary

| Phase | File | Change |
|-------|------|--------|
| 1 | `store/xyflow/stores/node-render-data.ts` | WIRE 2 uses events instead of $nodes |
| 2 | `store/nodes/computed/execution-styles.ts` | Remove $nodes from combine() |
| 3 | `store/flow/stores.ts` | Add version check to PortUpdated handler |
| 4 | `store/ports/render-data.ts` | NEW: Separate port render data (optional) |

## Key Principles

1. **Events carry entity IDs** - Process only affected entities (O(k) not O(N))
2. **No store-to-store subscriptions for hot paths** - Use events as clocks
3. **$nodes is for structure** - Port changes shouldn't need full $nodes recalculation
4. **Execution styles are execution-only** - Not tied to node/port changes
5. **Version checks filter echoes** - Skip stale server responses

## Questions for Discussion

1. **Phase 1 scope:** Should `setNodeVersion` trigger WIRE 2? Currently it does via $nodes.

2. **Port isolation:** Is Phase 4 (separate port store) needed, or are Phases 1-3 sufficient?

3. **Backend events:** Should we add `PortValueChanged` vs `PortUIChanged` distinction?
