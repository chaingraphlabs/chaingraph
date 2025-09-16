/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Connection, Edge, HandleType } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { useCallback, useRef } from 'react'
import { requestRemoveEdge } from '@/store/edges'
import { $activeFlowMetadata } from '@/store/flow'

/**
 * Hook for handling edge reconnection logic
 */
export function useEdgeReconnection(onConnect: (connection: Connection) => void) {
  const activeFlow = useUnit($activeFlowMetadata)

  // Ref to track edge reconnection state
  const reconnectSuccessful = useRef(false)

  /**
   * Called when user starts dragging an edge handle
   */
  const onReconnectStart = useCallback((_: React.MouseEvent, edge: Edge, handleType: HandleType) => {
    reconnectSuccessful.current = false
  }, [])

  /**
   * Called when user successfully reconnects an edge to a new handle
   */
  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    if (!activeFlow?.id)
      return

    reconnectSuccessful.current = true

    // Remove old edge
    requestRemoveEdge({
      flowId: activeFlow.id,
      edgeId: oldEdge.id,
    })

    // Create new edge if we have valid connection points
    if (newConnection.source && newConnection.target) {
      onConnect(newConnection)
    }
  }, [activeFlow?.id, onConnect])

  /**
   * Called when edge reconnection interaction ends
   * If reconnection wasn't successful (dropped on invalid target), remove the edge
   */
  const onReconnectEnd = useCallback((_: MouseEvent | TouchEvent, edge: Edge) => {
    if (!activeFlow?.id)
      return

    if (!reconnectSuccessful.current) {
      requestRemoveEdge({
        flowId: activeFlow.id,
        edgeId: edge.id,
      })
    }
    reconnectSuccessful.current = false
  }, [activeFlow?.id])

  return {
    onReconnectStart,
    onReconnect,
    onReconnectEnd,
  }
}
