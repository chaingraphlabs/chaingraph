/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionClaim, ExecutionInstance } from '../../types'

export interface IExecutionStore {
  create: (instance: ExecutionInstance) => Promise<void>
  get: (id: string) => Promise<ExecutionInstance | null>
  delete: (id: string) => Promise<boolean>
  list: (limit?: number) => Promise<ExecutionInstance[]>

  // Additional methods for parent-child tracking
  getChildExecutions?: (parentId: string) => Promise<string[]>
  getExecutionTree?: (rootId: string) => Promise<Array<{ id: string, parentId: string | null, level: number }>>

  // Execution claim methods for distributed worker coordination
  claimExecution: (executionId: string, workerId: string, timeoutMs: number) => Promise<boolean>
  releaseExecution: (executionId: string, workerId: string) => Promise<void>
  extendClaim: (executionId: string, workerId: string, timeoutMs: number) => Promise<boolean>
  getActiveClaims: () => Promise<ExecutionClaim[]>
  getClaimForExecution: (executionId: string) => Promise<ExecutionClaim | null>
  expireOldClaims: () => Promise<number>
}
