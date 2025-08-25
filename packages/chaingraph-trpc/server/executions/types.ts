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
  ExecutionEventEnum,
  ExecutionEventImpl,
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

export interface ExecutionState {
  id: string
  status: ExecutionStatus
  startTime?: Date
  endTime?: Date
  error?: {
    message: string
    nodeId?: string
  }
}

export interface ExecutionInstance {
  id: string
  context: ExecutionContext
  engine: ExecutionEngine
  flow: Flow
  initialStateFlow: Flow // Keep a copy of the original flow with initial node states
  status: ExecutionStatus
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  error?: {
    message: string
    nodeId?: string
  }
  parentExecutionId?: string
  executionDepth: number
  externalEvents?: Array<{ type: string, data?: any }> // Track external events that started this execution
}

export interface ExecutionEventSubscription {
  eventTypes?: ExecutionEventEnum[]
  onEvent: (event: ExecutionEventImpl) => void
  onError?: (error: Error) => void
  onComplete?: () => void
}

export interface CleanupConfig {
  // Maximum age of completed executions (in milliseconds)
  maxAge: number
  // How often to run cleanup (in milliseconds)
  interval: number
  // Maximum number of executions to keep
  maxExecutions?: number
}

// Add to ExecutionOptions
export interface ExecutionOptions {
  execution?: {
    maxConcurrency?: number
    nodeTimeoutMs?: number
    flowTimeoutMs?: number
  }
  debug?: boolean
  cleanup?: CleanupConfig
}

// Default configuration
export const DEFAULT_CLEANUP_CONFIG: CleanupConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  interval: 60 * 60 * 1000, // 1 hour
  maxExecutions: 50000,
}
