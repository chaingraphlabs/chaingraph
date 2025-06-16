/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useConnectionHandling } from './useConnectionHandling'
import { useEdgeChanges } from './useEdgeChanges'
import { useEdgeReconnection } from './useEdgeReconnection'
import { useNodeChanges } from './useNodeChanges'
import { useNodeDragHandling } from './useNodeDragHandling'
import { useNodeSchemaDropEvents } from './useNodeSchemaDropEvents'

// Re-export the NodeSchemaDropEvent and subscription function for backward compatibility
export type { NodeSchemaDropEvent } from './useNodeSchemaDropEvents'
export { subscribeToNodeSchemaDrop } from './useNodeSchemaDropEvents'

/**
 * Main hook that combines all flow interaction callbacks
 * This hook orchestrates the different flow operations by composing smaller, focused hooks
 */
export function useFlowCallbacks() {
  // Get individual hook functionality
  const { checkForNodeSchemaDrop } = useNodeSchemaDropEvents()
  const { onNodesChange } = useNodeChanges()
  const { onEdgesChange } = useEdgeChanges()
  const { onConnect } = useConnectionHandling()
  const { onNodeDragStart, onNodeDragStop } = useNodeDragHandling(checkForNodeSchemaDrop)
  const { onReconnectStart, onReconnect, onReconnectEnd } = useEdgeReconnection(onConnect)

  return {
    onNodesChange,
    onEdgesChange,
    onConnect,
    onReconnect,
    onReconnectStart,
    onReconnectEnd,
    onNodeDragStart,
    onNodeDragStop,
  }
}
