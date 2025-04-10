/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import type { Node } from '@xyflow/react'
import { useStoreMap } from 'effector-react'
import { useMemo, useRef } from 'react'
import { $xyflowNodes } from '../xyflow-nodes'

/**
 * Returns a stable reference to XYFlow nodes, only updating when there are
 * meaningful changes to the nodes.
 *
 * This implementation includes node reference preservation to prevent
 * unnecessary re-renders when only a single node changes.
 */
export function useXYFlowNodes() {
  // Keep a ref to the previous nodes array for intelligent diffing
  const prevNodesRef = useRef<Node[]>([])

  // Use Effector's useStoreMap with a custom update filter
  const nodes = useStoreMap({
    store: $xyflowNodes,
    keys: [], // No external dependencies
    fn: nodes => nodes,
    updateFilter: (prevNodes, nextNodes) => {
      // Store the previous nodes for our reference preservation
      prevNodesRef.current = prevNodes

      // Quick reference check
      if (prevNodes === nextNodes)
        return false

      // Length check
      if (prevNodes.length !== nextNodes.length)
        return true

      // Only check essential properties to determine if an update is needed
      for (let i = 0; i < nextNodes.length; i++) {
        const prev = prevNodes[i]
        const next = nextNodes[i]

        // ID check (if order changed)
        if (prev.id !== next.id)
          return true

        // Position changed?
        if (prev.position.x !== next.position.x
          || prev.position.y !== next.position.y) {
          return true
        }

        // Dimensions changed?
        if (prev.width !== next.width || prev.height !== next.height)
          return true

        // Selection state changed?
        if (prev.selected !== next.selected)
          return true

        // Parent changed?
        if (prev.parentId !== next.parentId)
          return true

        // Type changed?
        if (prev.type !== next.type)
          return true

        // Version check (most important - detects any data changes)
        const prevVersion = (prev.data?.node as INode).getVersion?.() ?? 0
        const nextVersion = (next.data?.node as INode).getVersion?.() ?? 0
        if (prevVersion !== nextVersion)
          return true
      }

      // No meaningful changes detected
      return false
    },
  })

  // This final memoization step ensures we return a stable reference
  // even when there are node changes that don't affect display
  return useMemo(() => {
    // Create a new array only if needed, preserving node object references
    // when a node hasn't changed
    if (nodes !== prevNodesRef.current) {
      // This is a deep change case - return the new nodes array
      return nodes
    }

    // Return the previous reference if nothing meaningful changed
    return prevNodesRef.current
  }, [nodes])
}
