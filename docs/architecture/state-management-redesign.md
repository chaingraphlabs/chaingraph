# State Management Architecture Redesign

**Last Updated:** 2025-12-18
**Status:** SUPERSEDED by `state-management-v2.md`

> This document contains an earlier, more complex proposal. The simpler event-driven approach in `state-management-v2.md` is the approved implementation plan.

## Problem Statement

Current architecture issues:

1. **Cascade Hell**: Single port update → full node clone → `$nodes` fires → ALL derived stores recalculate → 400+ re-renders
2. **Type Propagation**: Changing one port type cascades to many connected nodes/ports
3. **No Multi-Flow Support**: Cannot handle multiple open flows with active subscriptions
4. **Bulk Updates**: Server sends batches but processing is inefficient
5. **Deep Port Structures**: Nested ports (object fields) cause full parent updates

## Real-World Usage Patterns

### Pattern 1: High-Frequency Updates
- **Drag operations**: 60 position updates/sec for multiple nodes
- **Type propagation**: Single port type change → 5-20 connected ports update
- **Bulk subscription events**: Server sends 10-50 events in a batch

### Pattern 2: Multi-Flow Editing
- User opens 3 flows in tabs
- Each flow has active WebSocket subscription
- Shared node registry, separate flow state
- Switch between tabs without re-subscribing

### Pattern 3: Complex Port Mutations
- Update nested port field (e.g., `config.metadata.user_id`)
- Should only re-render that port, not entire node
- May trigger type propagation to connected nodes
- Parent port UI may need collapse/expand state update

## Proposed Architecture: Event-Driven Normalized State

### Layer 1: Event Stream Processing

```typescript
// apps/chaingraph-frontend/src/store/events/event-stream.ts

/**
 * Collects events from WebSocket subscriptions
 * Batches, deduplicates, and orders for processing
 */
export const eventStream = {
  // Accumulate events in a microtask batch
  batch: [] as FlowEvent[],

  // Process accumulated events
  flush() {
    const events = this.batch
    this.batch = []

    // Deduplicate: keep only latest version of same entity
    const deduplicated = deduplicateEvents(events)

    // Dispatch to handlers
    processEventBatch(deduplicated)
  }
}

// Deduplicate events by entity ID + version
function deduplicateEvents(events: FlowEvent[]): FlowEvent[] {
  const byEntity = new Map<string, FlowEvent>()

  for (const event of events) {
    const key = `${event.type}:${getEntityId(event)}`
    const existing = byEntity.get(key)

    // Keep event with highest version
    if (!existing || getVersion(event) > getVersion(existing)) {
      byEntity.set(key, event)
    }
  }

  return Array.from(byEntity.values())
}
```

### Layer 2: Normalized State Stores (Flat Structure)

```typescript
// apps/chaingraph-frontend/src/store/state/core-stores.ts

/**
 * Normalized state: each entity type in separate store
 * No nesting, no cascades
 */

// Flow metadata only (no nodes)
export const $flows = stateDomain.createStore<Map<string, FlowMetadata>>(new Map())

// Node structure only (no ports, no positions)
export const $nodes = stateDomain.createStore<Map<string, NodeStructure>>(new Map())

// All ports flat (including nested child ports)
export const $ports = stateDomain.createStore<Map<string, PortData>>(new Map())

// All edges
export const $edges = stateDomain.createStore<Map<string, EdgeData>>(new Map())

// --- Lookup Maps (Relationships) ---

// flowId → Set<nodeId>
export const $flowNodes = stateDomain.createStore<Map<string, Set<string>>>(new Map())

// nodeId → Set<portId>
export const $nodePorts = stateDomain.createStore<Map<string, Set<string>>>(new Map())

// portId → Set<edgeId> (for quick edge lookups)
export const $portEdges = stateDomain.createStore<Map<string, Set<edgeId>>>(new Map())

// --- Separate Concerns Stores ---

// Node positions (high-frequency updates)
export const $nodePositions = stateDomain.createStore<Map<string, Position>>(new Map())

// Node dimensions (medium-frequency)
export const $nodeDimensions = stateDomain.createStore<Map<string, Dimensions>>(new Map())

// Port UI state (collapse/expand, etc.)
export const $portUIStates = stateDomain.createStore<Map<string, PortUIState>>(new Map())

// Active flow per tab
export const $activeFlows = stateDomain.createStore<Map<string, string>>(new Map()) // tabId → flowId
export const $currentTab = stateDomain.createStore<string>('default')
```

**Key Principle**: Each entity type in separate store, no cross-references in state, only IDs.

### Layer 3: Event Handlers (Explicit Updates)

```typescript
// apps/chaingraph-frontend/src/store/handlers/node-handlers.ts

/**
 * Explicit event handlers - NO automatic cascades
 * Each handler updates ONLY its relevant stores
 */

// Node structure changes
export const handleNodeUpdated = (event: NodeUpdatedEvent) => {
  const { node, flowId } = event.data

  // Update node structure
  $nodes.getState().set(node.id, {
    id: node.id,
    type: node.type,
    metadata: node.metadata,
    version: node.version,
  })

  // Update lookup: flowId → nodeIds
  const flowNodes = $flowNodes.getState().get(flowId) || new Set()
  flowNodes.add(node.id)
  $flowNodes.getState().set(flowId, flowNodes)

  // Update lookup: nodeId → portIds
  const portIds = Array.from(node.ports.keys())
  $nodePorts.getState().set(node.id, new Set(portIds))

  // Update ports (delegate to port handler)
  for (const [portId, port] of node.ports.entries()) {
    handlePortUpdated({ portId, port, nodeId: node.id })
  }

  // Emit specific event for UI layer
  nodeStructureChanged({ nodeId: node.id, fields: ['type', 'metadata'] })
}

// Port value changes (isolated)
export const handlePortValueUpdated = (event: PortValueUpdatedEvent) => {
  const { portId, value, version } = event.data

  const port = $ports.getState().get(portId)
  if (!port || port.version >= version) return // Skip stale

  // Update ONLY this port
  $ports.getState().set(portId, { ...port, value, version })

  // Emit for type propagation (if needed)
  if (shouldPropagateType(port)) {
    portTypePropagationNeeded({ portId, newType: inferType(value) })
  }

  // Emit specific event
  portValueChanged({ portId })
}

// Port UI state (no node update!)
export const handlePortUIChanged = (event: PortUIChangedEvent) => {
  const { portId, ui } = event.data

  // Update separate UI state store
  $portUIStates.getState().set(portId, ui)

  // Emit specific event
  portUIChanged({ portId })
}

// Position updates (isolated, high-frequency)
export const handleNodePositionChanged = (event: NodePositionChangedEvent) => {
  const { nodeId, position } = event.data

  // Update separate position store
  $nodePositions.getState().set(nodeId, position)

  // No other stores touched!
  nodePositionChanged({ nodeId })
}
```

**Key Principle**: Handlers are explicit, no cascades, emit granular events.

### Layer 4: Derived State (Event-Driven, Cached)

```typescript
// apps/chaingraph-frontend/src/store/derived/render-data.ts

/**
 * Derived state for rendering - computed once, updated only on relevant events
 * Uses granular event subscriptions, not store subscriptions
 */

// Render data per node (cached)
export const $nodeRenderCache = stateDomain.createStore<Map<string, NodeRenderData>>(new Map())

// Listen to SPECIFIC events, not store changes
sample({
  clock: [
    nodeStructureChanged,   // Type/metadata changed
    nodePositionChanged,    // Position changed
    nodeDimensionsChanged,  // Dimensions changed
    // NOT portValueChanged - ports render separately
  ],
  fn: ({ nodeId, fields }) => {
    const current = $nodeRenderCache.getState().get(nodeId)

    // Only recompute changed fields
    const updates = {}
    if (fields.includes('position')) {
      updates.position = $nodePositions.getState().get(nodeId)
    }
    if (fields.includes('dimensions')) {
      updates.dimensions = $nodeDimensions.getState().get(nodeId)
    }
    // ... etc

    // Surgical update
    $nodeRenderCache.getState().set(nodeId, { ...current, ...updates })

    // Emit to XYFlow layer
    xyflowNodeDataChanged({ nodeId, changes: updates })
  }
})

// Execution styles (ONLY execution events)
export const $executionStyles = stateDomain.createStore<Map<string, ExecutionStyle>>(new Map())

sample({
  clock: [
    executionNodeStatusChanged,  // Specific event, not $executionNodes store!
    executionStateChanged,
  ],
  fn: ({ nodeId, status }) => {
    const style = computeExecutionStyle(nodeId, status)
    $executionStyles.getState().set(nodeId, style)

    // Only this node's style changed
    nodeStyleChanged({ nodeId })
  }
})
```

**Key Principle**: Derived state listens to events, not stores. Cached + surgical updates.

### Layer 5: Type Propagation (Explicit, Batched)

```typescript
// apps/chaingraph-frontend/src/store/handlers/type-propagation.ts

/**
 * Type propagation system - explicit, batched
 */

// Accumulate propagation requests
const propagationQueue = new Set<string>() // portIds needing propagation

sample({
  clock: portTypePropagationNeeded,
  fn: ({ portId }) => {
    propagationQueue.add(portId)

    // Schedule propagation in next microtask
    queueMicrotask(() => {
      if (propagationQueue.size === 0) return

      const portsToPropagate = Array.from(propagationQueue)
      propagationQueue.clear()

      // Process all propagations in one batch
      processPropagationBatch(portsToPropagate)
    })
  }
})

function processPropagationBatch(portIds: string[]) {
  const affectedPorts = new Set<string>()

  for (const portId of portIds) {
    const port = $ports.getState().get(portId)
    const edges = $portEdges.getState().get(portId) || new Set()

    // Find connected ports
    for (const edgeId of edges) {
      const edge = $edges.getState().get(edgeId)
      const targetPortId = edge.targetPortId

      // Propagate type to target
      const targetPort = $ports.getState().get(targetPortId)
      const newType = inferTypeFromSource(port, targetPort)

      if (newType !== targetPort.type) {
        // Update target port type
        $ports.getState().set(targetPortId, { ...targetPort, type: newType })
        affectedPorts.add(targetPortId)

        // May trigger further propagation
        if (shouldPropagate(targetPort)) {
          propagationQueue.add(targetPortId)
        }
      }
    }
  }

  // Emit batch update
  if (affectedPorts.size > 0) {
    portsTypesPropagated({ portIds: Array.from(affectedPorts) })
  }
}
```

**Key Principle**: Type propagation is explicit, batched, emits granular events.

### Layer 6: Component Subscriptions (Granular)

```typescript
// apps/chaingraph-frontend/src/store/hooks/useNodeRenderData.ts

/**
 * Components subscribe to SPECIFIC entity IDs, not global stores
 */

export function useNodeRenderData(nodeId: string): NodeRenderData | null {
  // Subscribe to this node's render data changes
  const renderData = useUnit($nodeRenderCache)

  // Listen to events for THIS node only
  useEffect(() => {
    const unsubscribe = nodeStyleChanged.watch((payload) => {
      if (payload.nodeId === nodeId) {
        // Force re-render of this component
        forceUpdate()
      }
    })
    return unsubscribe
  }, [nodeId])

  return renderData.get(nodeId) || null
}

// Alternative: Per-node stores (more granular but more memory)
export const $nodeRenderData = (nodeId: string) => {
  return $nodeRenderCache.map(cache => cache.get(nodeId))
}
```

**Key Principle**: Components subscribe to specific entities, not global state.

## Multi-Flow Support Architecture

```typescript
// apps/chaingraph-frontend/src/store/multi-flow/tab-manager.ts

/**
 * Manage multiple open flows with active subscriptions
 */

// Tab state
export const $openTabs = stateDomain.createStore<Map<string, TabState>>(new Map())

interface TabState {
  tabId: string
  flowId: string
  subscription: Subscription | null
  isActive: boolean
}

// Open new tab
export const openFlowInTab = stateDomain.createEvent<{ flowId: string }>()

sample({
  clock: openFlowInTab,
  fn: ({ flowId }) => {
    const tabId = generateTabId()

    // Create subscription for this flow
    const subscription = subscribeToFlow(flowId, {
      onEvent: (event) => {
        // Process event in context of this flow
        processFlowEvent({ flowId, event })
      }
    })

    $openTabs.getState().set(tabId, {
      tabId,
      flowId,
      subscription,
      isActive: false,
    })

    // Switch to new tab
    switchToTab({ tabId })
  }
})

// Switch active tab
export const switchToTab = stateDomain.createEvent<{ tabId: string }>()

sample({
  clock: switchToTab,
  fn: ({ tabId }) => {
    // Update active tab
    $currentTab.setState(tabId)

    // All tabs keep their subscriptions active!
    // Just change which flow is rendered
    const tab = $openTabs.getState().get(tabId)
    activeFlowChanged({ flowId: tab.flowId })
  }
})
```

## Migration Strategy

### Phase 1: Normalize State (Week 1-2)
1. Create new normalized stores (`$nodes`, `$ports`, `$edges` as Maps)
2. Create lookup stores (`$flowNodes`, `$nodePorts`, `$portEdges`)
3. Keep old stores, write to both during migration

### Phase 2: Event Handlers (Week 2-3)
1. Implement explicit event handlers (no cascades)
2. Add event deduplication/batching
3. Migrate handlers one-by-one from old to new

### Phase 3: Derived State (Week 3-4)
1. Rewrite derived stores to be event-driven
2. Implement caching + surgical updates
3. Remove old combine()-based derives

### Phase 4: Component Layer (Week 4-5)
1. Update components to use granular subscriptions
2. Migrate from `useUnit($nodes)` to `useNodeRenderData(nodeId)`
3. Test render counts (should be <10 per update)

### Phase 5: Multi-Flow Support (Week 5-6)
1. Implement tab manager
2. Add per-tab subscription handling
3. Test with 3+ open flows

## Expected Performance

**Before** (current):
- Port toggle: 73.8ms, 441 traces, 400+ renders
- Type propagation (10 ports): ~500ms, cascade hell
- Cannot support multi-flow

**After** (new architecture):
- Port toggle: <2ms, <10 traces, 1-2 renders (affected components only)
- Type propagation (10 ports): ~10ms, batched + surgical updates
- Multi-flow: 3+ flows with active subscriptions, <5ms per tab switch

## Key Principles

1. **Normalized State**: Each entity type in separate store, no nesting
2. **Explicit Events**: Handlers emit granular events, no cascades
3. **Event-Driven Derives**: Listen to events, not store changes
4. **Cached + Surgical**: Derive once, update only changed fields
5. **Granular Subscriptions**: Components subscribe to specific entities
6. **Batched Propagation**: Accumulate + process in one batch

This architecture handles:
- ✅ High-frequency updates (positions, values)
- ✅ Type propagation cascades
- ✅ Deep port structures
- ✅ Multi-flow with active subscriptions
- ✅ Bulk server events
- ✅ Granular reactivity
