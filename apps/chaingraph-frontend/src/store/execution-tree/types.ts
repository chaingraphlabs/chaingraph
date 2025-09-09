/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionTreeNode, RootExecution } from '@badaitech/chaingraph-executor/types'
import type { ExecutionStatus } from '../execution/types'

// Re-export backend types for convenience
export type { ExecutionTreeNode, RootExecution } from '@badaitech/chaingraph-executor/types'

// Map to store expanded trees by root execution ID
export type ExpandedTreesMap = Map<string, ExecutionTreeNode[]>

// Frontend-specific filter interface
export interface ExecutionTreeFilters {
  flowId?: string
  status: ExecutionStatus | 'all'
  searchQuery: string
  limit: number
  after?: Date
}

export interface ExecutionTreeError {
  message: string
  code: string
}

// Helper type for UI state
export interface ExecutionUINode {
  node: RootExecution | ExecutionTreeNode
  isRoot: boolean
  isExpanded?: boolean
  isLoading?: boolean
  children?: ExecutionTreeNode[]
}
