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
} from '@badaitech/chaingraph-types'
import { combine, createEffect, sample } from 'effector'

import {
  getNodePositionInFlow,
  getNodePositionInsideParent,
} from '@/components/flow/utils/node-position'
import { flowDomain } from '@/store/domains'
import { nodeUpdated } from '@/store/updates'
import { globalReset } from '../common'
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
  setNodeVersion,
  updateNode,
  updateNodes,
  updateNodeUILocal,
} from '../nodes/stores'
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
  throttledRequestUpdatePortUi,
  updateItemConfigArrayPort,
  updateItemConfigArrayPortFx,
  updatePort,
} from '../ports/stores'
import { $trpcClient } from '../trpc/store'
import { $activeSubscription, newFlowEvents, switchSubscriptionFx } from './subscription'
import { FlowSubscriptionStatus } from './types'

// EVENTS

// Flow list events
export const loadFlowsList = flowDomain.createEvent()
export const setFlowsList = flowDomain.createEvent<FlowMetadata[]>()
export const setFlowsLoading = flowDomain.createEvent<boolean>()
export const setFlowsError = flowDomain.createEvent<Error | null>()
export const setFlowMetadata = flowDomain.createEvent<FlowMetadata>()
export const setFlowLoaded = flowDomain.createEvent<string>()

// Active flow events
export const setActiveFlowId = flowDomain.createEvent<string>()
export const clearActiveFlow = flowDomain.createEvent()

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
    const flowExists = flows.some(f => f.id === updatedFlowId)
    if (flowExists) {
      // Update existing flow
      return flows.map(flow =>
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
    }
  })
  .on(deleteFlow, (flows, id) =>
    flows.filter(f => f.id !== id))
  .reset(globalReset)

// Currently active flow ID
export const $activeFlowId = flowDomain.createStore<string | null>(null)
  .on(setActiveFlowId, (_, id) => {
    return id
  })
  .reset(clearActiveFlow)
  .reset(globalReset)

// Main loading state
export const $isFlowsLoading = flowDomain.createStore<boolean>(false)
  .on(setFlowsLoading, (_, isLoading) => isLoading)
  .on(loadFlowsListFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

export const $isFlowLoaded = flowDomain.createStore<boolean>(false)
  .on(setFlowLoaded, (_, flowId) => {
    const flow = $flows.getState().find(f => f.id === flowId)
    return flow && flow.metadata ? !!flow.metadata?.loaded : false
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
      clearNodes()
      resetEdges()
      setFlowMetadata(data.metadata)
    },

    [FlowEventType.FlowInitEnd]: (data) => {
      setFlowLoaded(data.flowId)
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
      const node = nodes[data.node.id]
      if (node) {
        if (data.node.getVersion() && data.node.getVersion() < node.getVersion()) {
          // console.warn(`[NodeUpdated] Received outdated node update event for node ${data.node.id}`)
          return
        }
      }

      // console.log(`[NodeUpdated] Updating node ${data.node.id} to version ${data.node.getVersion()}`)

      updateNode(data.node)
      nodeUpdated(data.node.id)
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
      if (!data.port.getConfig().nodeId) {
        console.error(`Port ${data.port.id} has no node ID`)
        return
      }

      const node = nodes[data.port.getConfig().nodeId!]
      if (!node) {
        console.error(`Node ${data.port.getConfig().nodeId} not found`)
        return
      }

      updatePort({
        id: data.port.id,
        data: {
          id: data.port.id,
          config: data.port.getConfig(),
          value: data.port.getValue(),
        },
        nodeVersion: data.nodeVersion ?? 1,
      })

      nodeUpdated(data.port.getConfig().nodeId!)
    },

    [FlowEventType.PortUpdated]: (data) => {
      if (!data.port.getConfig().nodeId) {
        console.error(`Port ${data.port.id} has no node ID`)
        return
      }

      const node = nodes[data.port.getConfig().nodeId!]
      if (!node) {
        console.error(`Node ${data.port.getConfig().nodeId} not found`)
        return
      }

      // if (data.nodeVersion && data.nodeVersion <= node.getVersion()) {
      // console.warn(`[PortUpdated] Received outdated port update event`)
      // return
      // }

      // console.log(`[PortUpdated] Updating port ${data.port.id} on node ${data.port.getConfig().nodeId} to node version ${data.nodeVersion} with value:`, data.port.getValue())

      updatePort({
        id: data.port.id,
        data: {
          id: data.port.id,
          config: data.port.getConfig(),
          value: data.port.getValue(),
        },
        nodeVersion: data.nodeVersion ?? 1,
      })

      nodeUpdated(data.port.getConfig().nodeId!)
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
    },

    [FlowEventType.EdgeRemoved]: (data) => {
      removeEdge({
        flowId,
        edgeId: data.edgeId,
      })
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

      setNodeVersion({
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

      setNodeVersion({
        nodeId: data.nodeId,
        version: data.version,
      })

      const currentPosition = currentNode.metadata.ui?.position || DefaultPosition
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

      setNodeVersion({
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

      setNodeVersion({
        nodeId: data.nodeId,
        version: data.version,
      })

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
    for (const event of events) {
      try {
        await handleEvent(event)
      } catch (error) {
        console.error(`Unhandled error processing event ${event.type}:`, error)
      }
    }
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

sample({
  source: combine({
    activeFlowId: $activeFlowId,
    nodes: $nodes,
  }),
  clock: requestUpdatePortValue,
  // fn: ({ portId, nodeId, value }) => {
  fn: (source, event) => {
    const activeFlowId = source.activeFlowId
    const nodes = source.nodes
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }
    return {
      flowId: activeFlowId,
      nodeId: event.nodeId,
      portId: event.portId,
      value: event.value,
      nodeVersion: (nodes[event.nodeId]?.getVersion() ?? 0) + 1, // Optimistic version increment
    }
  },
  target: [
    preBaseUpdatePortValueFx,
    baseUpdatePortValueFx,
  ],
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
