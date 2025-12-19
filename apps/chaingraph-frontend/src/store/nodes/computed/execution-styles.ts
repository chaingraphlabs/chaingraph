/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { combine } from 'effector'
import { $executionNodes, $executionState } from '@/store/execution'

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
 * Default execution style for nodes (no execution running or node not in execution)
 */
export const DEFAULT_EXECUTION_STYLE: NodeExecutionStyle = {
  className: '',
  isExecuting: false,
  isCompleted: false,
  isFailed: false,
  isSkipped: false,
  isDimmed: false,
}

/**
 * Default style for nodes that are dimmed (execution running but node not participating)
 */
export const DIMMED_EXECUTION_STYLE: NodeExecutionStyle = {
  className: 'border-gray-500 opacity-30',
  isExecuting: false,
  isCompleted: false,
  isFailed: false,
  isSkipped: false,
  isDimmed: true,
}

/**
 * Compute execution style for a node based on its execution status
 */
function computeExecutionStyle(status: string | undefined): NodeExecutionStyle {
  if (!status) return DEFAULT_EXECUTION_STYLE

  switch (status) {
    case 'running':
      return {
        className: 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-[1.02] animate-[glow_3s_ease-in-out_infinite]',
        isExecuting: true,
        isCompleted: false,
        isFailed: false,
        isSkipped: false,
        isDimmed: false,
      }

    case 'completed':
      return {
        className: 'border-green-500 shadow-[0_0_20px_rgba(34,207,94,0.5)]',
        isExecuting: false,
        isCompleted: true,
        isFailed: false,
        isSkipped: false,
        isDimmed: false,
      }

    case 'failed':
      return {
        className: 'border-red-500 shadow-[0_0_20px_rgba(249,68,68,0.5)] opacity-80',
        isExecuting: false,
        isCompleted: false,
        isFailed: true,
        isSkipped: false,
        isDimmed: false,
      }

    case 'skipped':
      return {
        className: 'border-gray-500 opacity-50',
        isExecuting: false,
        isCompleted: false,
        isFailed: false,
        isSkipped: true,
        isDimmed: true,
      }

    case 'idle':
      return DIMMED_EXECUTION_STYLE

    default:
      return DEFAULT_EXECUTION_STYLE
  }
}

/**
 * Pre-computed execution styles for nodes in execution.
 *
 * PERF OPTIMIZATION: Removed $nodes dependency to prevent O(N) recalculation
 * when nodes/ports change. This store now only recalculates when execution
 * state actually changes.
 *
 * Usage:
 * - For nodes in $nodeExecutionStyles.styles: use the computed style
 * - For nodes not in styles:
 *   - If hasExecution is true: use DIMMED_EXECUTION_STYLE
 *   - If hasExecution is false: use DEFAULT_EXECUTION_STYLE
 */
export const $nodeExecutionStyles = combine(
  $executionNodes,
  $executionState,
  (executionNodes, executionState) => {
    const styles: Record<string, NodeExecutionStyle> = {}
    const { executionId } = executionState
    const hasExecution = !!executionId

    // Only iterate executionNodes, not all nodes (O(k) where k = nodes in execution)
    Object.entries(executionNodes).forEach(([nodeId, nodeExecution]) => {
      styles[nodeId] = computeExecutionStyle(nodeExecution.status)
    })

    return {
      styles,
      hasExecution,
      // Convenience: default style for nodes not in execution
      defaultStyle: hasExecution ? DIMMED_EXECUTION_STYLE : DEFAULT_EXECUTION_STYLE,
    }
  },
)
