/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeExecutionStyle } from '../execution-styles'
import { useStoreMap } from 'effector-react'
import { $nodeExecutionStyles, DEFAULT_EXECUTION_STYLE } from '../execution-styles'

/**
 * Ultra-optimized hook to get execution style for a specific node
 * Only re-renders when the execution style for this specific node changes
 *
 * Returns the node's execution style, or:
 * - defaultStyle (dimmed) if execution is running but node not participating
 * - DEFAULT_EXECUTION_STYLE if no execution is running
 */
export function useNodeExecutionStyle(nodeId: string): NodeExecutionStyle {
  return useStoreMap({
    store: $nodeExecutionStyles,
    keys: [nodeId],
    fn: ({ styles, defaultStyle }, [nodeId]) => {
      return styles[nodeId] ?? defaultStyle
    },
    updateFilter: (prev, next) => {
      // Only update if the style actually changed
      if (!prev && !next)
        return false
      if (!prev || !next)
        return true

      // Deep compare the style properties
      return (
        prev.className !== next.className
        || prev.isExecuting !== next.isExecuting
        || prev.isCompleted !== next.isCompleted
        || prev.isFailed !== next.isFailed
        || prev.isSkipped !== next.isSkipped
        || prev.isDimmed !== next.isDimmed
      )
    },
  })
}

/**
 * Hook to get just the execution style className for a node
 * Optimized for when you only need the CSS class
 */
export function useNodeExecutionClassName(nodeId: string): string {
  return useStoreMap({
    store: $nodeExecutionStyles,
    keys: [nodeId],
    fn: ({ styles, defaultStyle }, [nodeId]) => {
      return styles[nodeId]?.className ?? defaultStyle.className
    },
    updateFilter: (prev, next) => {
      // Only update if className changed
      return prev !== next
    },
  })
}

/**
 * Hook to check if a node is currently executing
 * Returns a boolean for simple conditional rendering
 */
export function useIsNodeExecuting(nodeId: string): boolean {
  return useStoreMap({
    store: $nodeExecutionStyles,
    keys: [nodeId],
    fn: ({ styles }, [nodeId]) => {
      return styles[nodeId]?.isExecuting ?? false
    },
    updateFilter: (prev, next) => {
      // Only update if execution state changed
      return prev !== next
    },
  })
}

/**
 * Hook to check if any execution is currently running
 * Useful for showing global execution indicators
 */
export function useHasExecution(): boolean {
  return useStoreMap({
    store: $nodeExecutionStyles,
    keys: [],
    fn: ({ hasExecution }) => hasExecution,
    updateFilter: (prev, next) => prev !== next,
  })
}
