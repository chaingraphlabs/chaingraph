/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useUpdateNodeInternals } from '@xyflow/react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { portCollapseChangedForNodes } from '@/store/edges'

/**
 * Syncs node internals with XYFlow when port handles move.
 *
 * When ports collapse/expand, handle positions change in DOM.
 * XYFlow caches handle positions and doesn't automatically re-measure.
 * This component listens for collapse changes and triggers XYFlow
 * to re-measure handle positions.
 *
 * Must be rendered inside <ReactFlow> or <ReactFlowProvider>.
 */
export function NodeInternalsSync() {
  const updateNodeInternals = useUpdateNodeInternals()
  const [pendingNodes, setPendingNodes] = useState<string[]>([])

  // Subscribe to Effector event
  useEffect(() => {
    const unsubscribe = portCollapseChangedForNodes.watch((nodeIds) => {
      if (nodeIds.length > 0) {
        setPendingNodes(prev => [...new Set([...prev, ...nodeIds])])
      }
    })
    return unsubscribe
  }, [])

  // After DOM updates, call updateNodeInternals
  useLayoutEffect(() => {
    if (pendingNodes.length > 0) {
      pendingNodes.forEach(nodeId => updateNodeInternals(nodeId))
      setPendingNodes([])
    }
  }, [pendingNodes, updateNodeInternals])

  return null
}
