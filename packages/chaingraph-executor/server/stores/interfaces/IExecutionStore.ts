/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionRow } from 'server/stores/postgres/schema'
import type { ExecutionClaim, ExecutionTreeNode, RootExecution } from 'types'

// export interface GetRootExecutionsForOwnerInput {
//   ownerId: string
//   limit?: number
//   offset?: number
// }

export interface IExecutionStore {
  create: (instance: ExecutionRow) => Promise<void>
  get: (id: string) => Promise<ExecutionRow | null>
  delete: (id: string) => Promise<boolean>

  // Additional methods for parent-child tracking
  getRootExecutions: (
    flowId: string,
    limit?: number,
    after?: Date | null
  ) => Promise<RootExecution[]>
  getChildExecutions: (parentId: string) => Promise<ExecutionRow[]>
  getExecutionTree: (rootId: string) => Promise<Array<ExecutionTreeNode>>

  // Execution claim methods for distributed worker coordination
  claimExecution: (executionId: string, workerId: string, timeoutMs: number) => Promise<boolean>
  releaseExecution: (executionId: string, workerId: string) => Promise<void>
  extendClaim: (executionId: string, workerId: string, timeoutMs: number) => Promise<boolean>
  getActiveClaims: () => Promise<ExecutionClaim[]>
  getClaimForExecution: (executionId: string) => Promise<ExecutionClaim | null>
  expireOldClaims: () => Promise<number>
}
