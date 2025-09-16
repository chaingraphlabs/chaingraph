/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortContextValue } from '@/components/flow/nodes/ChaingraphNode/ports/context/PortContext'
import type { EdgeData } from '@/store/edges/types'
import { useStoreMap } from 'effector-react'
import { useMemo } from 'react'
import { $nodePortContexts } from '../port-context'

// Default context value that matches PortContextValue interface
const defaultPortContextValue: PortContextValue = {
  updatePortValue: () => {},
  updatePortUI: () => {},
  addFieldObjectPort: () => {},
  removeFieldObjectPort: () => {},
  updateItemConfigArrayPort: () => {},
  appendElementArrayPort: () => {},
  removeElementArrayPort: () => {},
  getEdgesForPort: () => [],
}

/**
 * Hook that returns PortContextValue compatible with existing components
 * Provides a default context when the node context is not available
 */
export function useNodePortContextValue(nodeId: string): PortContextValue {
  const nodeContext = useStoreMap({
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

      // Check if operations reference changed
      if (prev.operations !== next.operations)
        return true

      return false
    },
  })

  // Convert PortOperations to PortContextValue
  const portContextValue = useMemo<PortContextValue>(() => {
    if (!nodeContext || !nodeContext.operations) {
      return defaultPortContextValue
    }

    // Map operations to PortContextValue interface
    return {
      updatePortValue: (params) => {
        nodeContext.operations.updatePortValue(params)
      },
      updatePortUI: (params) => {
        nodeContext.operations.updatePortUI(params)
      },
      addFieldObjectPort: (params) => {
        nodeContext.operations.addFieldObjectPort(params)
      },
      removeFieldObjectPort: (params) => {
        nodeContext.operations.removeFieldObjectPort(params)
      },
      updateItemConfigArrayPort: (params) => {
        nodeContext.operations.updateItemConfigArrayPort(params)
      },
      appendElementArrayPort: (params) => {
        nodeContext.operations.appendElementArrayPort(params)
      },
      removeElementArrayPort: (params) => {
        nodeContext.operations.removeElementArrayPort(params)
      },
      getEdgesForPort: (portId: string): EdgeData[] => {
        return nodeContext.operations.getEdgesForPort(portId)
      },
    }
  }, [nodeContext])

  return portContextValue
}
