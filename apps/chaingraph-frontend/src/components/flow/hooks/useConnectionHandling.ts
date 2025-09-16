/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Connection } from '@xyflow/react'
import { hasCycle } from '@badaitech/chaingraph-types'
import { useUnit } from 'effector-react'
import { useCallback, useMemo } from 'react'
import { $edges, requestAddEdge } from '@/store/edges'
import { $activeFlowMetadata } from '@/store/flow'
import { $nodes } from '@/store/nodes'

/**
 * Hook for handling connection creation and cycle detection
 */
export function useConnectionHandling() {
  const activeFlow = useUnit($activeFlowMetadata)
  const nodes = useUnit($nodes)
  const edges = useUnit($edges)

  const edgeViews = useMemo(() => {
    if (!activeFlow || !nodes || !edges)
      return []

    return edges.map(edge => ({
      sourceNode: nodes[edge.sourceNodeId],
      targetNode: nodes[edge.targetNodeId],
    }))
  }, [activeFlow, edges, nodes])

  // Handle new connections
  const onConnect = useCallback((connection: Connection) => {
    if (!activeFlow?.id || !connection.source || !connection.target)
      return

    if (hasCycle(Object.values(nodes), edgeViews, {
      sourceNode: nodes[connection.source],
      targetNode: nodes[connection.target],
    })) {
      console.warn('Cycle detected')
      return
    }

    requestAddEdge({
      flowId: activeFlow.id,
      sourceNodeId: connection.source,
      sourcePortId: connection.sourceHandle!,
      targetNodeId: connection.target,
      targetPortId: connection.targetHandle!,
      metadata: {},
    })
  }, [activeFlow?.id, nodes, edgeViews])

  return {
    onConnect,
    edgeViews,
  }
}
