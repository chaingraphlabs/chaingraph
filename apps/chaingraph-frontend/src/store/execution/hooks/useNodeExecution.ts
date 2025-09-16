/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useStoreMap } from 'effector-react'
import { $executionNodes } from '../stores'

export function useNodeExecution(nodeId: string) {
  return useStoreMap({
    store: $executionNodes,
    keys: [nodeId],
    fn: (executionNodes, [nodeId]) => {
      const state = executionNodes[nodeId]
      if (!state) {
        return null
      }
      return {
        status: state?.status ?? 'idle',
        isExecuting: state?.status === 'running',
        isCompleted: state?.status === 'completed',
        isFailed: state?.status === 'failed',
        isSkipped: state?.status === 'skipped',
        executionTime: state?.executionTime,
        error: state?.error,
        startTime: state?.startTime,
        endTime: state?.endTime,
        node: state?.node,
      }
    },
    // updateFilter: (prev, next) => {
    //   if (!prev || !next) {
    //     return true
    //   }
    //
    //   if (prev.status !== next.status)
    //     return true
    //
    //   return false
    // },
  })
}

/**
 * Hook that returns all node executions but only triggers re-renders
 * when execution status changes in any node.
 *
 * @returns Record of all node executions
 */
export function useNodeExecutions() {
  return useStoreMap({
    store: $executionNodes,
    keys: [], // No specific node ID
    fn: (executionNodes) => {
      // Process all nodes to have a consistent return structure
      const result: Record<string, {
        status: string
        isExecuting: boolean
        isCompleted: boolean
        isFailed: boolean
        isSkipped: boolean
        executionTime?: number
        error?: any
        startTime?: Date
        endTime?: Date
        node?: any
      }> = {}

      // Transform each node state into the same format as useNodeExecution
      Object.entries(executionNodes).forEach(([nodeId, state]) => {
        if (!state)
          return

        result[nodeId] = {
          status: state?.status ?? 'idle',
          isExecuting: state?.status === 'running',
          isCompleted: state?.status === 'completed',
          isFailed: state?.status === 'failed',
          isSkipped: state?.status === 'skipped',
          executionTime: state?.executionTime,
          error: state?.error,
          startTime: state?.startTime,
          endTime: state?.endTime,
          node: state?.node,
        }
      })

      return result
    },
    updateFilter: (prev, next) => {
      // If either is null/undefined
      if (!prev || !next)
        return true

      // Check for different node IDs
      const prevIds = Object.keys(prev)
      const nextIds = Object.keys(next)

      // If number of nodes changed
      if (prevIds.length !== nextIds.length)
        return true

      // Check if any node has a different status
      for (const nodeId of prevIds) {
        // If node doesn't exist in next
        if (!next[nodeId])
          return true

        // If status changed
        if (prev[nodeId]?.status !== next[nodeId]?.status)
          return true
      }

      // No relevant changes detected
      return false
    },
  })
}
