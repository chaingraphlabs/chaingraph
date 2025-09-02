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

export enum ExecutionStatus {
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

export interface ExecutionOptions {
  execution?: {
    maxConcurrency?: number
    nodeTimeoutMs?: number
    flowTimeoutMs?: number
  }
  debug?: boolean
  breakpoints?: string[]
}

export interface ExecutionInstance {
  id: string
  flow: Flow
  initialStateFlow: Flow
  context: ExecutionContext
  engine: ExecutionEngine | null
  status: ExecutionStatus
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  error?: ExecutionError
  parentExecutionId?: string
  executionDepth: number
  externalEvents?: Array<{ type: string, data?: any }>
}

export interface ExecutionState {
  id: string
  status: ExecutionStatus
  startTime?: Date
  endTime?: Date
  error?: ExecutionError
}

export interface ExecutionClaim {
  executionId: string
  workerId: string
  claimedAt: Date
  expiresAt: Date
  heartbeatAt: Date
  status: 'active' | 'released' | 'expired'
}
