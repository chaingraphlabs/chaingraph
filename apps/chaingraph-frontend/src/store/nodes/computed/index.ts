/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// Export stores
export { $nodeExecutionStyles } from './execution-styles'
export type { NodeExecutionStyle } from './execution-styles'

// Export hooks
export {
  useIsNodeExecuting,
  useNodeExecutionClassName,
  useNodeExecutionStyle,
} from './hooks/useNodeExecutionStyle'

export {
  useHasHighlightedNodes,
  useIsNodeHighlighted,
} from './hooks/useNodeHighlight'

export {
  useNodePortContext,
  useNodePortOperations,
  useStableNodePortContext,
} from './hooks/useNodePortContext'

export { useNodePortContextValue } from './hooks/useNodePortContextValue'

export {
  useNodeEdges,
  useNodePortEdgesMap,
  usePortEdges,
} from './hooks/useNodePortEdges'
export {
  $nodeOperationsFactory,
  $nodePortContexts,
  $stableNodePortContexts,
  elementArrayPortAppendRequested,
  elementArrayPortRemoveRequested,
  fieldObjectPortAddRequested,
  fieldObjectPortRemoveRequested,
  itemConfigArrayPortUpdateRequested,
  portUIUpdateRequested,
  portValueUpdateRequested,
} from './port-context'

export type { NodePortContext, PortOperations } from './port-context'

export { $nodeEdgesMap, $nodePortEdgesMap } from './port-edges'

export type { NodePortEdgesMap, PortEdgesMap } from './port-edges'
