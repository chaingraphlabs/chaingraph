/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodePortContext, PortOperations } from '../port-context'
import { useStoreMap } from 'effector-react'
import { useMemo } from 'react'
import { $nodePortContexts, $stableNodePortContexts } from '../port-context'

/**
 * Hook to get the port context for a specific node
 * Returns stable references to prevent unnecessary re-renders
 */
export function useNodePortContext(nodeId: string): NodePortContext | null {
  return useStoreMap({
    store: $nodePortContexts,
    keys: [nodeId],
    fn: (contexts, [nodeId]) => {
      return contexts[nodeId] ?? null
    },
    updateFilter: (prev, next) => {
      // Only update if the context actually changed
      if (!prev && !next)
        return false
      if (!prev || !next)
        return true

      // Check if node ID changed
      if (prev.nodeId !== next.nodeId)
        return true

      // Check if edges changed (compare keys and lengths)
      const prevEdgeKeys = Object.keys(prev.edgesForPorts).sort().join(',')
      const nextEdgeKeys = Object.keys(next.edgesForPorts).sort().join(',')

      if (prevEdgeKeys !== nextEdgeKeys)
        return true

      // Operations should have stable references, but check just in case
      if (prev.operations !== next.operations)
        return true

      return false
    },
  })
}

/**
 * Hook to get just the port operations for a node
 * Returns memoized operations to maintain stable references
 */
export function useNodePortOperations(nodeId: string): PortOperations | null {
  const context = useNodePortContext(nodeId)

  return useMemo(() => {
    return context?.operations ?? null
  }, [context?.operations])
}

/**
 * Hook to get the stable version of port contexts
 * Use this when you need to detect structural changes
 */
export function useStableNodePortContext(nodeId: string): NodePortContext | null {
  return useStoreMap({
    store: $stableNodePortContexts,
    keys: [nodeId],
    fn: (stable, [nodeId]) => {
      return stable.contexts[nodeId] ?? null
    },
    updateFilter: (prev, next) => {
      // Only update if the context structure changed
      if (!prev && !next)
        return false
      if (!prev || !next)
        return true

      // Check version key (changes when nodes are added/removed)
      return prev.nodeId !== next.nodeId
    },
  })
}
