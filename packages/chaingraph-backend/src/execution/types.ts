import type {
  ExecutionContext,
  ExecutionEngine,
  ExecutionEvent,
  ExecutionEventEnum,
  IFlow,
} from '@chaingraph/types'

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
  flow: IFlow
  status: ExecutionStatus
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  error?: {
    message: string
    nodeId?: string
  }
}

export interface ExecutionEventSubscription {
  eventTypes?: ExecutionEventEnum[]
  onEvent: (event: ExecutionEvent) => void
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
  maxExecutions: 1000,
}
