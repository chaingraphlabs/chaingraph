/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  FlowMetadata,
} from '@badaitech/chaingraph-types'
import type {
  FlowEventHandlerMap,
  INode,
} from '@badaitech/chaingraph-types'
import type { PortUIState } from '../ports-v2'
import type {
  AddFieldObjectPortInput,
  AppendElementArrayPortInput,
  RemoveFieldObjectPortInput,
  UpdateItemConfigArrayPortInput,
} from '../ports/stores'
import type { CreateFlowEvent, FlowSubscriptionError, UpdateFlowEvent } from './types'
import {
  createEventHandler,
  DefaultPosition,
  FlowEventType,
  isDeepEqual,
} from '@badaitech/chaingraph-types'

import { combine, createEffect, sample } from 'effector'
import {
  getNodePositionInFlow,
  getNodePositionInsideParent,
} from '@/components/flow/utils/node-position'
import { trace } from '@/lib/perf-trace'
import { $flowInitMode, flowDomain, flowInitEnded, flowInitStarted } from '@/store/domains'
import { nodeUpdated } from '@/store/updates'
import { globalReset } from '../common'
import { $edgeVersions, clearAnchorNodesForEdge, loadAnchorNodesFromBackend } from '../edges/anchor-nodes'
import {
  removeEdge,
  resetEdges,
  setEdge,
  setEdges,
} from '../edges/stores'
import {
  positionInterpolator,
} from '../nodes/position-interpolation-advanced'
import {
  $nodes,
  addNode,
  addNodes,
  clearNodes,
  removeNode,
  setNodeVersionOnly,
  updateNode,
  updateNodes,
  updateNodeUILocal,
} from '../nodes/stores'
// Granular port stores - ONLY mode (migration complete)
import {
  $portConfigs,
  $portHierarchy,
  $portValues,
  addPendingMutation,
  computeParentValue,
  extractConfigCore,
  fromPortKey,
  generateMutationId,
  getClientId,
  getParentChain,
  portUpdateReceived,
  rejectPendingMutation,
  removePortsBatch,
  toPortKey,
} from '../ports-v2'
import {
  addFieldObjectPort,
  addFieldObjectPortFx,
  appendElementArrayPort,
  appendElementArrayPortFx,
  baseUpdatePortUIFx,
  baseUpdatePortValueFx,
  preBaseUpdatePortUiFx,
  preBaseUpdatePortValueFx,
  removeElementArrayPort,
  removeElementArrayPortFx,
  removeFieldObjectPort,
  removeFiledObjectPortFx,
  requestUpdatePortValue,
  requestUpdatePortValueThrottled,
  throttledRequestUpdatePortUi,
  throttledServerPortValueSync,
  updateItemConfigArrayPort,
  updateItemConfigArrayPortFx,
} from '../ports/stores'
import { $trpcClient } from '../trpc/store'
import { $activeFlowId, clearActiveFlow } from './active-flow'
import { newFlowEvents } from './event-buffer'
import { $activeSubscription, switchSubscriptionFx } from './subscription'
import { FlowSubscriptionStatus } from './types'

// EVENTS

// Flow list events
export const loadFlowsList = flowDomain.createEvent()
export const setFlowsList = flowDomain.createEvent<FlowMetadata[]>()
export const setFlowsLoading = flowDomain.createEvent<boolean>()
export const setFlowsError = flowDomain.createEvent<Error | null>()
export const setFlowMetadata = flowDomain.createEvent<FlowMetadata>()
export const setFlowLoaded = flowDomain.createEvent<string>()

// Flow initialization mode - imported from domains.ts to avoid circular dependencies
// Used to defer expensive derived computations until init is complete
// Re-exported for convenience
export { $flowInitMode, flowInitEnded, flowInitStarted }

// Active flow events - imported from ./active-flow to avoid circular dependencies
// Re-exported for backwards compatibility
export { $activeFlowId, clearActiveFlow, setActiveFlowId } from './active-flow'

// Removed debugging - issue identified and fixed

// Flow CRUD events
export const createFlow = flowDomain.createEvent<CreateFlowEvent>()
export const updateFlow = flowDomain.createEvent<UpdateFlowEvent>()
export const deleteFlow = flowDomain.createEvent<string>()
export const forkFlow = flowDomain.createEvent<{ flowId: string, name?: string }>()

// Subscription events
export const setFlowSubscriptionStatus = flowDomain.createEvent<FlowSubscriptionStatus>()
export const setFlowSubscriptionError = flowDomain.createEvent<FlowSubscriptionError | null>()
export const resetFlowSubscription = flowDomain.createEvent()

// EFFECTS

// Effect for loading flows list
export const loadFlowsListFx = flowDomain.createEffect(async () => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.list.query()
})

export const loadFlowMetadataFx = flowDomain.createEffect(async (flowId: string) => {
  const client = $trpcClient.getState()
  if (!client) {
    console.error('[Flow|store] TRPC client is not initialized')
    throw new Error('TRPC client is not initialized')
  }
  const meta = await client.flow.getMeta.query({
    flowId,
  })

  return meta
})

// Effect for creating new flow
export const createFlowFx = flowDomain.createEffect(async (event: CreateFlowEvent) => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.create.mutate(event.metadata)
})

// Effect for editing flow
export const editFlowFx = flowDomain.createEffect(async (event: UpdateFlowEvent) => {
  const client = $trpcClient.getState()

  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.edit.mutate({
    flowId: event.id,
    ...event.metadata,
  })
})

// Effect for deleting flow
export const deleteFlowFx = flowDomain.createEffect(async (id: string) => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.delete.mutate({
    flowId: id,
  })
})

// Effect for forking flow
export const forkFlowFx = flowDomain.createEffect(async (event: { flowId: string, name?: string }) => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.fork.mutate({
    flowId: event.flowId,
    name: event.name,
  })
})

// STORES

// Store for all flows list
export const $flows = flowDomain.createStore<FlowMetadata[]>([])
  // Handle direct state updates
  .on(setFlowsList, (_, flows) => flows)
  .on(setFlowMetadata, (flows, updatedFlow) => {
    const flowExists = flows.some(f => f.id === updatedFlow.id)
    if (flowExists) {
      // Update existing flow
      return flows.map(flow =>
        flow.id === updatedFlow.id ? updatedFlow : flow,
      )
    } else {
      // Insert new flow
      return [...flows, updatedFlow]
    }
  })
  .on(setFlowLoaded, (flows, updatedFlowId) => {
    const spanId = trace.start('store.$flows.setLoaded', { category: 'store' })
    const flowExists = flows.some(f => f.id === updatedFlowId)
    if (flowExists) {
      // Update existing flow
      const result = flows.map(flow =>
        flow.id === updatedFlowId
          ? {
              ...flow,
              metadata: {
                ...flow.metadata,
                loaded: true,
              },
            }
          : flow,
      )
      trace.end(spanId)
      return result
    }
    trace.end(spanId)
  })
  .on(deleteFlow, (flows, id) =>
    flows.filter(f => f.id !== id))
  .reset(globalReset)

// $activeFlowId store moved to ./active-flow.ts to avoid circular dependencies

// Main loading state
export const $isFlowsLoading = flowDomain.createStore<boolean>(false)
  .on(setFlowsLoading, (_, isLoading) => isLoading)
  .on(loadFlowsListFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

export const $isFlowLoaded = flowDomain.createStore<boolean>(false)
  .on(setFlowLoaded, (_, flowId) => {
    const spanId = trace.start('store.$isFlowLoaded.set', { category: 'store' })
    const flow = $flows.getState().find(f => f.id === flowId)
    const result = flow && flow.metadata ? !!flow.metadata?.loaded : false
    trace.end(spanId)
    return result
  })
  .reset(clearActiveFlow)
  .reset(globalReset)

// Main error state
export const $flowsError = flowDomain.createStore<Error | null>(null)
  .on(setFlowsError, (_, error) => error)
  .on(loadFlowsListFx.failData, (_, error) => error)
  .reset(loadFlowsListFx.done)
  .reset(globalReset)

// Specific operation error stores
export const $createFlowError = flowDomain.createStore<Error | null>(null)
  .on(createFlowFx.failData, (_, error) => error)
  .reset(createFlowFx.done)
  .reset(globalReset)

export const $updateFlowError = flowDomain.createStore<Error | null>(null)
  .on(editFlowFx.failData, (_, error) => error)
  .reset(editFlowFx.done)
  .reset(globalReset)

export const $deleteFlowError = flowDomain.createStore<Error | null>(null)
  .on(deleteFlowFx.failData, (_, error) => error)
  .reset(deleteFlowFx.done)
  .reset(globalReset)

export const $forkFlowError = flowDomain.createStore<Error | null>(null)
  .on(forkFlowFx.failData, (_, error) => error)
  .reset(forkFlowFx.done)
  .reset(globalReset)

// Specific operation loading states
export const $isCreatingFlow = flowDomain.createStore<boolean>(false)
  .on(createFlowFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

export const $isUpdatingFlow = flowDomain.createStore<boolean>(false)
  .on(editFlowFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

export const $isDeletingFlow = flowDomain.createStore<boolean>(false)
  .on(deleteFlowFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

export const $isForkingFlow = flowDomain.createStore<boolean>(false)
  .on(forkFlowFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

// Combined error store
export const $allFlowsErrors = combine(
  $flowsError,
  $createFlowError,
  $updateFlowError,
  $deleteFlowError,
  $forkFlowError,
  (loadError, createError, updateError, deleteError, forkError) =>
    loadError || createError || updateError || deleteError || forkError,
)

// Currently active flow metadata - loaded directly via loadFlowMetadataFx
export const $activeFlowMetadata = flowDomain.createStore<FlowMetadata | null>(null)
  .on(loadFlowMetadataFx.doneData, (_, metadata) => metadata)
  .on(loadFlowMetadataFx.fail, () => null) // Clear on error
  .reset(clearActiveFlow)
  .reset(globalReset)

// Loading state for active flow metadata
export const $isActiveFlowMetadataLoading = flowDomain.createStore<boolean>(false)
  .on(loadFlowMetadataFx.pending, (_, isPending) => isPending)
  .reset(clearActiveFlow)
  .reset(globalReset)

// Subscription related stores
export const $flowSubscriptionStatus = flowDomain.createStore<FlowSubscriptionStatus>(
  FlowSubscriptionStatus.IDLE,
).on(setFlowSubscriptionStatus, (_, status) => status).reset(resetFlowSubscription).reset(clearActiveFlow).reset(globalReset)

export const $flowSubscriptionError = flowDomain.createStore<FlowSubscriptionError | null>(null)
  .on(setFlowSubscriptionError, (_, error) => error)
  .reset(resetFlowSubscription)
  .reset(clearActiveFlow)
  .reset(globalReset)

// Derived store to check if subscription is active
export const $isFlowSubscribed = $flowSubscriptionStatus.map(
  status => status === FlowSubscriptionStatus.SUBSCRIBED,
)

// Combined subscription state for UI
export const $flowSubscriptionState = combine({
  status: $flowSubscriptionStatus,
  error: $flowSubscriptionError,
  isSubscribed: $isFlowSubscribed,
})

// SAMPLES

// Flow List operations
sample({
  clock: loadFlowsList,
  target: loadFlowsListFx,
})
sample({
  clock: loadFlowsListFx.doneData,
  target: setFlowsList,
})

// Flow Create operations
sample({
  clock: createFlow,
  target: createFlowFx,
})
sample({
  clock: createFlowFx.doneData,
  fn: response => response,
  target: setFlowMetadata,
})

// Flow Update operations
sample({
  clock: updateFlow,
  target: editFlowFx,
})
sample({
  clock: editFlowFx.doneData,
  fn: response => response.metadata,
  target: setFlowMetadata,
})

// Flow Delete operations
sample({
  clock: deleteFlow,
  target: [
    deleteFlowFx,
    // If we need to clear active flow after deletion
    sample({
      clock: deleteFlow,
      source: $activeFlowId,
      filter: (activeId, deletedId) => activeId === deletedId,
      target: clearActiveFlow,
    }),
  ],
})

// Flow Fork operations
sample({
  clock: forkFlow,
  target: forkFlowFx,
})
sample({
  clock: forkFlowFx.doneData,
  fn: response => response,
  target: setFlowMetadata,
})
// Reload flow list after fork to get updated canFork values
sample({
  clock: forkFlowFx.done,
  target: loadFlowsListFx,
})

// Auto-load active flow metadata when setActiveFlowId is called
sample({
  clock: $activeFlowId,
  filter: Boolean, // Only if flowId is truthy
  target: loadFlowMetadataFx,
})

// Handle metadata loading errors gracefully
sample({
  clock: loadFlowMetadataFx.fail,
  fn: ({ error, params }) => {
    console.warn(`[Flow] Failed to load flow metadata for ${params}:`, error)
  },
})

// Create event handlers map
function createEventHandlers(flowId: string, nodes: Record<string, INode>): FlowEventHandlerMap {
  return {
    [FlowEventType.FlowInitStart]: (data) => {
      flowInitStarted() // Signal init mode start (defers expensive computations)
      clearNodes()
      resetEdges()
      setFlowMetadata(data.metadata)
    },

    [FlowEventType.FlowInitEnd]: (data) => {
      const spanId = trace.start('handler.setFlowLoaded', { category: 'event' })
      flowInitEnded() // Signal init mode end (triggers deferred computations)
      setFlowLoaded(data.flowId)
      trace.end(spanId)
    },

    [FlowEventType.MetadataUpdated]: (data) => {
      setFlowMetadata(data.newMetadata)
    },

    [FlowEventType.NodesAdded]: (data) => {
      addNodes(data.nodes)
    },

    [FlowEventType.NodeAdded]: (data) => {
      addNode(data.node)
    },

    [FlowEventType.NodeUpdated]: (data) => {
      const nodeId = data.node.id
      const node = nodes[nodeId]

      // Version check (keep existing)
      if (node) {
        if (data.node.getVersion() && data.node.getVersion() < node.getVersion()) {
          // console.warn(`[NodeUpdated] Received outdated node update event for node ${nodeId}`)
          return
        }
      }

      // Extract only non-port changes (metadata, UI state, status)
      // Port changes already handled via PortUpdated events → granular stores
      // Use isDeepEqual to catch ALL metadata changes (title, ui.style, etc.)
      const metadataChanged = !node || !isDeepEqual(
        {
          title: node.metadata.title,
          ui: node.metadata.ui,
          status: node.status,
        },
        {
          title: data.node.metadata.title,
          ui: data.node.metadata.ui,
          status: data.node.status,
        },
      )

      if (metadataChanged) {
        // Update $nodes for metadata-only changes (position, dimensions, status)
        // console.log(`[NodeUpdated] Metadata changed for node ${nodeId}, updating $nodes`)
        updateNode(data.node)
        nodeUpdated(nodeId)
      } else {
        // Port-only changes - granular stores already updated via PortUpdated events
        // Just update version in granular store (NO $nodes update = NO cascade!)
        // console.log(`[NodeUpdated] Port-only change for node ${nodeId}, skipping $nodes`)
        setNodeVersionOnly({ nodeId, version: data.node.getVersion() })
      }
    },

    [FlowEventType.NodesUpdated]: (data) => {
      const validNodes = data.nodes.filter((node) => {
        const existingNode = nodes[node.id]
        if (existingNode) {
          if (node.getVersion() && node.getVersion() < existingNode.getVersion()) {
            // console.warn(`[NodesUpdated] Skipping outdated node update event for node ${node.id}`)
            return false
          }
        }
        return true
      })

      if (validNodes.length === 0) {
        return
      }

      // console.log(`[NodesUpdated] Updating nodes:`, validNodes.map(n => n.id).join(', '))
      updateNodes(validNodes)
      validNodes.forEach(node => nodeUpdated(node.id))
    },

    [FlowEventType.NodeRemoved]: (data) => {
      removeNode(data.nodeId)
    },

    [FlowEventType.PortCreated]: (data) => {
      const nodeId = data.port.getConfig().nodeId
      if (!nodeId) {
        console.error(`Port ${data.port.id} has no node ID`)
        return
      }

      const node = nodes[nodeId]
      if (!node) {
        console.error(`Node ${nodeId} not found`)
        return
      }

      const portId = data.port.id
      const config = data.port.getConfig()
      const value = data.port.getValue()

      // ALWAYS route to granular stores (migration complete)
      portUpdateReceived({
        portKey: toPortKey(nodeId, portId),
        nodeId,
        portId,
        timestamp: Date.now(),
        source: 'subscription',
        version: data.nodeVersion,
        changes: {
          value,
          ui: (config.ui ?? {}) as PortUIState,
          config: extractConfigCore(config),
          connections: config.connections || [],
        },
      })
    },

    [FlowEventType.PortUpdated]: (data) => {
      const nodeId = data.port.getConfig().nodeId
      if (!nodeId) {
        console.error(`Port ${data.port.id} has no node ID`)
        return
      }

      const node = nodes[nodeId]
      if (!node) {
        console.error(`Node ${nodeId} not found`)
        return
      }

      const portId = data.port.id
      const config = data.port.getConfig()
      const value = data.port.getValue()

      // ALWAYS route to granular stores (migration complete)
      portUpdateReceived({
        portKey: toPortKey(nodeId, portId),
        nodeId,
        portId,
        timestamp: Date.now(),
        source: 'subscription',
        version: data.nodeVersion,
        changes: {
          value,
          ui: (config.ui ?? {}) as PortUIState,
          config: extractConfigCore(config),
          connections: config.connections || [],
        },
      })
    },

    [FlowEventType.PortRemoved]: (data) => {
      const nodeId = data.port.getConfig().nodeId
      if (!nodeId) {
        console.error(`[PortRemoved] Port ${data.port.id} has no node ID`)
        return
      }

      const portId = data.port.id
      const portKey = toPortKey(nodeId, portId)

      // Remove port from granular stores (values, configs, UI, connections, hierarchy)
      removePortsBatch(new Set([portKey]))
    },

    [FlowEventType.EdgeAdded]: (data) => {
      setEdge({
        flowId,
        edgeId: data.edgeId,
        sourceNodeId: data.sourceNodeId,
        sourcePortId: data.sourcePortId,
        targetNodeId: data.targetNodeId,
        targetPortId: data.targetPortId,
        metadata: data.metadata,
      })

      // Initialize anchors from edge metadata if present
      if (data.metadata?.anchors && data.metadata.anchors.length > 0) {
        // Load anchors as XYFlow nodes (new anchor system)
        loadAnchorNodesFromBackend({
          edgeId: data.edgeId,
          anchors: data.metadata.anchors,
        })
      }
    },

    [FlowEventType.EdgesAdded]: (data) => {
      setEdges(data.edges.map(edge => ({
        flowId,
        edgeId: edge.edgeId,
        sourceNodeId: edge.sourceNodeId,
        sourcePortId: edge.sourcePortId,
        targetNodeId: edge.targetNodeId,
        targetPortId: edge.targetPortId,
        metadata: edge.metadata,
      })))

      // Initialize anchors from edge metadata for all edges
      data.edges.forEach((edge) => {
        if (edge.metadata?.anchors && edge.metadata.anchors.length > 0) {
          // Load anchors as XYFlow nodes (new anchor system)
          loadAnchorNodesFromBackend({
            edgeId: edge.edgeId,
            anchors: edge.metadata.anchors,
          })
        }
      })
    },

    [FlowEventType.EdgeRemoved]: (data) => {
      removeEdge({
        flowId,
        edgeId: data.edgeId,
      })
    },

    [FlowEventType.EdgeMetadataUpdated]: (data) => {
      // Check if edge has pending local changes (e.g., anchor being deleted/moved)
      const versions = $edgeVersions.getState()
      const edgeVersion = versions.get(data.edgeId)

      if (edgeVersion?.isDirty) {
        // Skip reload - we have pending local changes that haven't been synced yet
        // This prevents deleted anchors from being restored by broadcast events
        return
      }

      // Safe to reload anchors from backend (no pending local changes)
      if (data.metadata.anchors && data.metadata.anchors.length > 0) {
        loadAnchorNodesFromBackend({
          edgeId: data.edgeId,
          anchors: data.metadata.anchors,
        })
      } else {
        // No anchors in metadata - clear any existing anchors for this edge
        clearAnchorNodesForEdge(data.edgeId)
      }
    },

    [FlowEventType.NodeParentUpdated]: (data) => {
      const node = nodes[data.nodeId]
      if (!node)
        return

      const currentVersion = node.getVersion()
      const currentParent = node.metadata.parentNodeId ? nodes[node.metadata.parentNodeId] : undefined
      const newParent = data.newParentNodeId ? nodes[data.newParentNodeId] : undefined

      if ((!currentParent && !newParent) || (currentParent?.id === newParent?.id)) {
        return
      }

      let currentPosition = data.oldPosition || node.metadata.ui?.position || DefaultPosition
      const newPosition = data.newPosition || currentPosition

      if (currentParent && newParent === undefined) {
        currentPosition = getNodePositionInFlow(
          currentPosition,
          currentParent.metadata.ui!.position!,
        )
      }

      if (currentParent === undefined && newParent) {
        currentPosition = getNodePositionInsideParent(
          currentPosition,
          newParent.metadata.ui!.position!,
        )
      }

      if (data.version && data.version <= currentVersion) {
        return
      }

      node.setMetadata({
        ...node.metadata,
        parentNodeId: data.newParentNodeId,
      })

      // Use granular version store to avoid $nodes cascade
      setNodeVersionOnly({
        nodeId: data.nodeId,
        version: data.version,
      })

      positionInterpolator.clearNodeState(data.nodeId)
      positionInterpolator.addState(data.nodeId, newPosition, currentPosition)
    },

    [FlowEventType.NodeUIPositionChanged]: (data) => {
      const currentNode = nodes[data.nodeId]
      if (!currentNode)
        return

      const currentVersion = currentNode.getVersion()

      if (data.version && data.version <= currentVersion) {
        // console.warn(`[SKIPPING] Received outdated position change event`)
        return
      }

      const currentPosition = currentNode.metadata.ui?.position || DefaultPosition

      // PERF: Skip if position is already in state (echo of our optimistic update)
      // This preserves multi-user editing: other users' different positions will be processed
      const positionUnchanged
        = Math.abs(currentPosition.x - data.newPosition.x) < 1
          && Math.abs(currentPosition.y - data.newPosition.y) < 1

      // Use granular version store to avoid $nodes cascade on position echoes
      setNodeVersionOnly({
        nodeId: data.nodeId,
        version: data.version,
      })

      if (positionUnchanged) {
        // Position already matches - skip expensive interpolator
        return
      }

      // Different position - another user moved the node or server correction
      positionInterpolator.addState(data.nodeId, data.newPosition, currentPosition)
    },

    [FlowEventType.NodeUIChanged]: (data) => {
      const currentNode = nodes[data.nodeId]
      if (!currentNode)
        return

      const currentVersion = currentNode.getVersion()

      if (data.version && data.version <= currentVersion) {
        // console.warn(`[NodeUIChanged] Skipping outdated UI change event for node ${data.nodeId}, event version ${data.version}, current version ${currentVersion}`)
        return
      }

      updateNodeUILocal({
        flowId,
        nodeId: data.nodeId,
        ui: data.ui,
        version: data.version,
      })

      // Use granular version store to avoid $nodes cascade
      setNodeVersionOnly({
        nodeId: data.nodeId,
        version: data.version,
      })
    },

    [FlowEventType.NodeUIDimensionsChanged]: (data) => {
      const currentNode = nodes[data.nodeId]
      if (!currentNode)
        return

      const currentVersion = currentNode.getVersion()

      if (data.version && data.version <= currentVersion) {
        return
      }

      if (!data.newDimensions || !data.newDimensions.width) { // || !data.newDimensions.height) {
        return
      }

      const currentDimensions = currentNode.metadata.ui?.dimensions

      // PERF: Skip if dimensions are already in state (echo of our optimistic update)
      // This preserves multi-user editing: other users' different dimensions will be processed
      const dimensionsUnchanged = currentDimensions
        && Math.abs((currentDimensions.width ?? 0) - (data.newDimensions.width ?? 0)) < 1
        && Math.abs((currentDimensions.height ?? 0) - (data.newDimensions.height ?? 0)) < 1

      // Use granular version store to avoid $nodes cascade on dimension echoes
      setNodeVersionOnly({
        nodeId: data.nodeId,
        version: data.version,
      })

      if (dimensionsUnchanged) {
        // Dimensions already match - skip expensive interpolator
        return
      }

      // Different dimensions - another user resized the node or server correction
      updateNodeUILocal({
        flowId,
        nodeId: data.nodeId,
        ui: {
          ...(currentNode.metadata.ui ?? {}),
          dimensions: data.newDimensions,
        },
        version: data.version,
      })
    },
  }
}

// Hot path event types to trace (high-frequency during user interaction)
const HOT_PATH_EVENTS = new Set([
  FlowEventType.NodeUpdated,
  FlowEventType.NodesUpdated,
  FlowEventType.NodesAdded, // ADDED: Initial flow load
  FlowEventType.PortUpdated,
  FlowEventType.PortCreated, // ADDED: Initial flow load
  FlowEventType.EdgeAdded,
  FlowEventType.EdgesAdded,
  FlowEventType.NodeUIPositionChanged,
  FlowEventType.FlowInitStart, // ADDED: Init markers
  FlowEventType.FlowInitEnd, // ADDED: Init markers
])

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

    const batchSpanId = trace.start('event.batch.process', {
      category: 'effect',
      tags: { eventCount: events.length },
    })

    const eventHandlers = createEventHandlers(flowId, nodes)
    const handleEvent = createEventHandler(eventHandlers, {
      onError: (error, event) => {
        console.error(`Error handling event ${event.type}:`, error)
      },
    })

    for (const event of events) {
      // Only trace hot path events to reduce overhead
      const isHotPath = HOT_PATH_EVENTS.has(event.type)
      const eventSpanId = isHotPath
        ? trace.start(`event.handle.${event.type}`, { category: 'event' })
        : null

      try {
        await handleEvent(event)
      } catch (error) {
        console.error(`Unhandled error processing event ${event.type}:`, error)
      }

      if (eventSpanId)
        trace.end(eventSpanId)
    }

    trace.end(batchSpanId)
  }),
})

// Watch for activeFlowId changes and manage subscriptions
// Use source combine to prevent race conditions
sample({
  clock: $activeFlowId,
  source: combine({ currentSub: $activeSubscription, isEffectPending: switchSubscriptionFx.pending }),
  filter: ({ currentSub, isEffectPending }, newFlowId) => {
    // Prevent concurrent executions
    // if (isEffectPending) {
    //   return false
    // }
    if (!newFlowId) {
      return false
    }
    // Only proceed if flowId is valid and different from current subscription
    const shouldSwitch = Boolean(newFlowId) && currentSub?.flowId !== newFlowId
    return shouldSwitch
  },
  fn: ({ currentSub }, newFlowId) => ({ oldSub: currentSub, newFlowId: newFlowId! }),
  target: switchSubscriptionFx,
})

// Handle flow deselection (when flowId becomes null)
sample({
  clock: $activeFlowId,
  source: combine({ currentSub: $activeSubscription, isEffectPending: switchSubscriptionFx.pending }),
  filter: ({ currentSub, isEffectPending }, flowId) => !flowId && currentSub !== null && !isEffectPending,
  fn: ({ currentSub }) => ({ oldSub: currentSub, newFlowId: '' }),
  target: switchSubscriptionFx,
})

/**
 * Optimistic port value update effect
 * Applies update locally immediately and tracks pending mutation
 *
 * PARENT CHAIN HANDLING:
 * The server updates not just the target port, but ALL parent ports up to the root.
 * For example, updating `object.a` also updates `object` with the merged value.
 * This is REDUNDANT work (server sends these updates too), but necessary for:
 * 1. Immediate optimistic feedback on parent values
 * 2. Correct echo matching - server echoes for parents need matching pending mutations
 *
 * When server is optimized to send only leaf updates, this parent chain logic can be removed.
 */
const optimisticUpdatePortValueFx = flowDomain.createEffect((params: {
  nodeId: string
  portId: string
  value: unknown
  version: number
  mutationId: string
}) => {
  const portKey = toPortKey(params.nodeId, params.portId)
  const hierarchy = $portHierarchy.getState()
  const portValues = $portValues.getState()
  const portConfigs = $portConfigs.getState()
  const clientId = getClientId()
  const timestamp = Date.now()

  // 1. Get parent chain (child → parent → grandparent → ... → root)
  //    REDUNDANT: Server already computes parent values. We do this for echo matching.
  const chain = getParentChain(portKey, hierarchy)

  // 2. Compute values for entire chain and prepare updates
  const updates: Array<{
    portKey: typeof portKey
    nodeId: string
    portId: string
    value: unknown
    mutationId: string
  }> = []

  // Process chain from target (index 0) to root
  for (let i = 0; i < chain.length; i++) {
    const currentKey = chain[i]
    const { nodeId, portId } = fromPortKey(currentKey)
    const isTarget = i === 0

    // Generate unique mutation ID for each port in chain
    // Parent mutations get suffixed IDs to distinguish from target
    const portMutationId = isTarget
      ? params.mutationId
      : `${params.mutationId}:parent:${i}`

    let portValue: unknown

    if (isTarget) {
      // Target port: use provided value directly
      portValue = params.value
    } else {
      // Parent port: compute new value based on child update
      // REDUNDANT: Server does this same computation
      const childKey = chain[i - 1]
      const childValue = updates[i - 1].value

      portValue = computeParentValue(
        currentKey,
        childKey,
        childValue,
        portValues,
        portConfigs,
      )
    }

    updates.push({
      portKey: currentKey,
      nodeId,
      portId,
      value: portValue,
      mutationId: portMutationId,
    })
  }

  // 3. Track pending mutations and apply optimistic updates for ALL ports in chain
  for (const update of updates) {
    // Track pending mutation (for echo matching)
    addPendingMutation({
      portKey: update.portKey,
      value: update.value,
      version: params.version,
      timestamp,
      mutationId: update.mutationId,
      clientId,
    })

    // Apply optimistic update to $portValues
    portUpdateReceived({
      portKey: update.portKey,
      nodeId: update.nodeId,
      portId: update.portId,
      timestamp,
      source: 'local-optimistic',
      version: params.version,
      mutationId: update.mutationId,
      clientId,
      changes: {
        value: update.value,
      },
    })
  }
})

sample({
  source: combine({
    activeFlowId: $activeFlowId,
    nodes: $nodes,
  }),
  clock: requestUpdatePortValue,
  fn: (source, event) => {
    const activeFlowId = source.activeFlowId
    const nodes = source.nodes
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }

    const nextVersion = (nodes[event.nodeId]?.getVersion() ?? 0) + 1
    const mutationId = generateMutationId()

    return {
      flowId: activeFlowId,
      nodeId: event.nodeId,
      portId: event.portId,
      value: event.value,
      nodeVersion: nextVersion,
      mutationId,
      version: nextVersion,
    }
  },
  target: [
    optimisticUpdatePortValueFx, // NEW: Instant local update
    preBaseUpdatePortValueFx,
    baseUpdatePortValueFx,
  ],
})

// Handle server errors - reject pending mutation
sample({
  clock: baseUpdatePortValueFx.fail,
  fn: ({ params }) => ({
    portKey: toPortKey(params.nodeId, params.portId),
    mutationId: params.mutationId,
    reason: 'server error',
  }),
  target: rejectPendingMutation,
})

// ============================================================================
// THROTTLED PORT VALUE UPDATE (for sliders and continuous input)
// ============================================================================
// Split into two phases:
// 1. Immediate: optimistic local update with pending tracking
// 2. Throttled: server sync only (optimistic already applied)
// ============================================================================

// Phase 1: Immediate optimistic update (no server call)
sample({
  source: combine({
    activeFlowId: $activeFlowId,
    nodes: $nodes,
  }),
  clock: requestUpdatePortValueThrottled,
  fn: (source, event) => {
    const nodes = source.nodes
    const nextVersion = (nodes[event.nodeId]?.getVersion() ?? 0) + 1
    const mutationId = generateMutationId()

    return {
      nodeId: event.nodeId,
      portId: event.portId,
      value: event.value,
      version: nextVersion,
      mutationId,
    }
  },
  target: optimisticUpdatePortValueFx, // Only optimistic, no server
})

// Phase 2: Throttled server sync (latest value wins)
sample({
  source: combine({
    activeFlowId: $activeFlowId,
    nodes: $nodes,
  }),
  clock: throttledServerPortValueSync,
  fn: (source, event) => {
    const activeFlowId = source.activeFlowId
    const nodes = source.nodes
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }

    // Note: Version may have changed since immediate update
    // Server will use this version for conflict resolution
    const nextVersion = (nodes[event.nodeId]?.getVersion() ?? 0) + 1
    const mutationId = generateMutationId()

    return {
      flowId: activeFlowId,
      nodeId: event.nodeId,
      portId: event.portId,
      value: event.value,
      nodeVersion: nextVersion,
      mutationId,
      version: nextVersion,
    }
  },
  target: [
    preBaseUpdatePortValueFx,
    baseUpdatePortValueFx,
  ], // Server call only, optimistic already done
})

sample({
  source: combine({
    activeFlowId: $activeFlowId,
    nodes: $nodes,
  }),
  clock: throttledRequestUpdatePortUi,
  fn: ({ activeFlowId, nodes }, { nodeId, portId, ui }) => {
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }

    return {
      flowId: activeFlowId,
      nodeId,
      portId,
      ui,
      nodeVersion: (nodes[nodeId]?.getVersion() ?? 0) + 1,
    }
  },
  target: [
    preBaseUpdatePortUiFx,
    baseUpdatePortUIFx,
  ],
})

sample({
  source: $activeFlowId,
  clock: addFieldObjectPort,
  fn: (activeFlowId, { nodeId, portId, key, config }) => {
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }
    const result: AddFieldObjectPortInput = {
      nodeId,
      config,
      flowId: activeFlowId,
      portId,
      key,
    }
    return result
  },
  target: addFieldObjectPortFx,
})

sample({
  source: $activeFlowId,
  clock: removeFieldObjectPort,
  fn: (activeFlowId, { nodeId, portId, key }) => {
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }

    const result: RemoveFieldObjectPortInput = { flowId: activeFlowId, nodeId, portId, key }
    return result
  },
  target: removeFiledObjectPortFx,
})

sample({
  source: $activeFlowId,
  clock: updateItemConfigArrayPort,
  fn: (activeFlowId, { nodeId, portId, itemConfig }) => {
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }
    const result: UpdateItemConfigArrayPortInput = {
      nodeId,
      flowId: activeFlowId,
      portId,
      itemConfig,
    }
    return result
  },
  target: updateItemConfigArrayPortFx,
})

sample({
  source: $activeFlowId,
  clock: appendElementArrayPort,
  fn: (activeFlowId, { nodeId, portId, value }) => {
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }
    const result: AppendElementArrayPortInput = {
      nodeId,
      flowId: activeFlowId,
      portId,
      value,
    }
    return result
  },
  target: appendElementArrayPortFx,
})

sample({
  source: $activeFlowId,
  clock: removeElementArrayPort,
  fn: (activeFlowId, { nodeId, portId, index }) => {
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }
    return {
      nodeId,
      flowId: activeFlowId,
      portId,
      index,
    }
  },
  target: removeElementArrayPortFx,
})
