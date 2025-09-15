/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  ExecutionEngine,
  Flow,
} from '@badaitech/chaingraph-types'
import type { ExecutionRow } from '../server/stores/postgres/schema'
import type { ExecutionTask } from './messages'

export enum ExecutionStatus {
  Idle = 'idle',
  Creating = 'creating',
  Created = 'created',
  Running = 'running',
  Paused = 'paused',
  Completed = 'completed',
  Failed = 'failed',
  Stopped = 'stopped',
}

export interface ExecutionError {
  message: string
  nodeId?: string
  stack?: string
}

export interface ExecutionInstance {
  task: ExecutionTask
  row: ExecutionRow
  context: ExecutionContext
  flow: Flow
  initialStateFlow: Flow
  engine: ExecutionEngine | null
  cleanupEventHandling?: () => Promise<void>
}

export type ExecutionClaimStatus = 'active' | 'released' | 'expired'
export interface ExecutionClaim {
  executionId: string
  workerId: string
  claimedAt: Date
  expiresAt: Date
  heartbeatAt: Date
  status: ExecutionClaimStatus
}

export interface ExecutionTreeNode {
  id: string
  parentId: string | null
  level: number
  execution: ExecutionRow
}

export interface RootExecution {
  execution: ExecutionRow
  levels: number
  totalNested: number
}
