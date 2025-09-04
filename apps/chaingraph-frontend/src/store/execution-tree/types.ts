/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionStatus } from '../execution/types'

// export interface ExecutionTreeItem {
//   id: string
//   flowId: string
//   flowName: string
//   status: string // We receive string from backend
//   parentExecutionId?: string
//   executionDepth: number
//   createdAt: Date
//   startedAt?: Date
//   completedAt?: Date
//   error?: {
//     message: string
//     nodeId?: string
//   }
//   triggeredByEvent?: {
//     eventName: string
//     payload?: any
//   }
//   childCount: number
//   // Additional details (only populated for selected execution)
//   integrations?: any
//   options?: any
//   abortSignal?: boolean
// }

export interface ExecutionTreeFilters {
  flowId?: string
  status: ExecutionStatus | 'all'
  searchQuery: string
  limit: number
}

export interface ExecutionTreeError {
  message: string
  code: string
}
