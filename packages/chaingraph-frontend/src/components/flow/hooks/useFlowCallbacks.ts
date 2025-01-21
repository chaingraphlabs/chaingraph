import type { Position } from '@chaingraph/types/node/node-ui.ts'
import type { Connection, Edge, EdgeChange, HandleType, NodeChange } from '@xyflow/react'
import {
  $activeFlowMetadata,
  $nodes,
  requestAddEdge,
  requestRemoveEdge,
  setNodeMetadata,
  updateNodePosition,
  updateNodeUI,
} from '@/store'
import { positionInterpolator } from '@/store/nodes/position-interpolation-advanced.ts'
import { useUnit } from 'effector-react'
import { useCallback, useRef } from 'react'

/**
 * Hook to handle flow interaction callbacks
 */
export function useFlowCallbacks() {
  // const { flow } = useFlow()
  const activeFlow = useUnit($activeFlowMetadata)
  const nodes = useUnit($nodes)

  // Ref to track edge reconnection state
  const reconnectSuccessful = useRef(false)

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    if (!activeFlow || !nodes || !changes || !activeFlow.id === undefined)
      return

    // Handle node changes (position, selection, etc)
    changes.forEach((change, i) => {
      switch (change.type) {
        case 'position':
          {
            const node = nodes[change.id]
            if (!node || !change.position || !change.position.x || !change.position.y) {
              return
            }
            // check if the position is the same
            const isSamePosition
              = node.metadata.ui?.position?.x === change.position.x
              && node.metadata.ui?.position?.y === change.position.y

            if (isSamePosition) {
              return
            }

            positionInterpolator.clearNodeState(node.id)

            updateNodePosition({
              flowId: activeFlow.id!,
              nodeId: change.id,
              position: change.position as Position,
              version: node.getVersion(),
            })
          }
          break

        case 'dimensions':
        {
          const node = nodes[change.id]
          if (!node)
            return

          if (!change.dimensions || !change.dimensions.width || !change.dimensions.height) {
            console.log(`[useFlowCallbacks] Invalid dimensions change:`, change)
            return
          }

          const isSameDimensions
            = node.metadata.ui?.dimensions?.width === change.dimensions.width
            && node.metadata.ui?.dimensions?.height === change.dimensions.height

          if (isSameDimensions) {
            return
          }

          console.log(`[useFlowCallbacks] Setting dimensions for node ${change.id} to:`, change.dimensions)

          updateNodeUI({
            flowId: activeFlow.id!,
            nodeId: change.id,
            ui: {
              dimensions: change.dimensions,
            },
            version: node.getVersion(),
          })
          // setNodeMetadata({
          //   id: change.id,
          //   metadata: {
          //     ...node.metadata,
          //     ui: {
          //       ...node.metadata.ui,
          //       dimensions: change.dimensions,
          //     },
          //   },
          // })

          break
        }

        case 'select':
          {
            const node = nodes[change.id]
            if (!node)
              return

            // check if the selection state is the same
            const isSameSelection = node.metadata.ui?.state?.isSelected === change.selected
            if (isSameSelection)
              return

            setNodeMetadata({
              id: change.id,
              metadata: {
                ...node.metadata,
                ui: {
                  ...node.metadata.ui,
                  state: {
                    ...node.metadata.ui?.state,
                    isSelected: change.selected,
                  },
                },
              },
            })
          }
          break

        default:
          console.log(`[useFlowCallbacks] Unhandled node change:`, change)
          break
      }
    })
  }, [activeFlow, nodes])

  // Handle edge changes (removal, selection)
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    if (!activeFlow?.id)
      return

    console.log('[useFlowCallbacks] Edge changes:', changes)

    changes.forEach((change) => {
      switch (change.type) {
        case 'remove':
          requestRemoveEdge({
            flowId: activeFlow.id!,
            edgeId: change.id,
          })
          break
        case 'select':
          // Handle edge selection if needed
          break
      }
    })
  }, [activeFlow?.id])

  // Handle new connections
  const onConnect = useCallback((connection: Connection) => {
    if (!activeFlow?.id || !connection.source || !connection.target)
      return

    requestAddEdge({
      flowId: activeFlow.id,
      sourceNodeId: connection.source,
      sourcePortId: connection.sourceHandle!,
      targetNodeId: connection.target,
      targetPortId: connection.targetHandle!,
      metadata: {},
    })
  }, [activeFlow?.id])

  /**
   * Called when user starts dragging an edge handle
   */
  const onReconnectStart = useCallback((_: React.MouseEvent, edge: Edge, handleType: HandleType) => {
    console.log('[useFlowCallbacks] Reconnect start:', edge, handleType)
    reconnectSuccessful.current = false
  }, [])

  /**
   * Called when user successfully reconnects an edge to a new handle
   */
  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    if (!activeFlow?.id)
      return

    console.log('[useFlowCallbacks] Reconnect:', oldEdge, newConnection)
    reconnectSuccessful.current = true

    // Remove old edge
    requestRemoveEdge({
      flowId: activeFlow.id,
      edgeId: oldEdge.id,
    })

    // Create new edge if we have valid connection points
    if (newConnection.source && newConnection.target) {
      requestAddEdge({
        flowId: activeFlow.id,
        sourceNodeId: newConnection.source,
        sourcePortId: newConnection.sourceHandle!,
        targetNodeId: newConnection.target,
        targetPortId: newConnection.targetHandle!,
        metadata: {},
      })
    }
  }, [activeFlow?.id])

  /**
   * Called when edge reconnection interaction ends
   * If reconnection wasn't successful (dropped on invalid target), remove the edge
   */
  const onReconnectEnd = useCallback((_: MouseEvent | TouchEvent, edge: Edge) => {
    if (!activeFlow?.id)
      return

    console.log('[useFlowCallbacks] Reconnect end:', edge, 'successful:', reconnectSuccessful.current)

    if (!reconnectSuccessful.current) {
      requestRemoveEdge({
        flowId: activeFlow.id,
        edgeId: edge.id,
      })
    }
    reconnectSuccessful.current = false
  }, [activeFlow?.id])

  return {
    onNodesChange,
    onEdgesChange,
    onConnect,
    onReconnect,
    onReconnectStart,
    onReconnectEnd,
  }
}
