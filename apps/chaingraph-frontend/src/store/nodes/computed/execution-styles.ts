/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { combine } from 'effector'
import { $executionNodes, $executionState } from '@/store/execution'
import { $nodes } from '../stores'

/**
 * Computed execution style for a node based on its execution state
 * This is a pure computation with no side effects
 */
export interface NodeExecutionStyle {
  className: string
  isExecuting: boolean
  isCompleted: boolean
  isFailed: boolean
  isSkipped: boolean
  isDimmed: boolean
}

/**
 * Pre-computed execution styles for all nodes
 * This store only updates when execution state changes, not on every render
 */
export const $nodeExecutionStyles = combine(
  $nodes,
  $executionNodes,
  $executionState,
  (nodes, executionNodes, executionState) => {
    const styles: Record<string, NodeExecutionStyle> = {}
    const { executionId } = executionState

    Object.keys(nodes).forEach((nodeId) => {
      const nodeExecution = executionNodes[nodeId]

      let className = ''
      let isExecuting = false
      let isCompleted = false
      let isFailed = false
      let isSkipped = false
      let isDimmed = false

      // No execution running
      if (!executionId) {
        styles[nodeId] = {
          className: '',
          isExecuting: false,
          isCompleted: false,
          isFailed: false,
          isSkipped: false,
          isDimmed: false,
        }
        return
      }

      // Node not in execution
      if (!nodeExecution) {
        styles[nodeId] = {
          className: 'border-gray-500 opacity-30',
          isExecuting: false,
          isCompleted: false,
          isFailed: false,
          isSkipped: false,
          isDimmed: true,
        }
        return
      }

      // Calculate based on execution status
      switch (nodeExecution.status) {
        case 'running':
          className = 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-[1.02] animate-[glow_3s_ease-in-out_infinite]'
          isExecuting = true
          break

        case 'completed':
          className = 'border-green-500 shadow-[0_0_20px_rgba(34,207,94,0.5)]'
          isCompleted = true
          break

        case 'failed':
          className = 'border-red-500 shadow-[0_0_20px_rgba(249,68,68,0.5)] opacity-80'
          isFailed = true
          break

        case 'skipped':
          className = 'border-gray-500 opacity-50'
          isSkipped = true
          isDimmed = true
          break

        case 'idle':
          if (executionId) {
            className = 'border-gray-500 opacity-30'
            isDimmed = true
          }
          break

        default:
          className = ''
      }

      styles[nodeId] = {
        className,
        isExecuting,
        isCompleted,
        isFailed,
        isSkipped,
        isDimmed,
      }
    })

    return styles
  },
)
