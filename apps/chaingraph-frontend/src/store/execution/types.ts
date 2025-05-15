/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IEdge, INode } from '@badaitech/chaingraph-types'

export enum ExecutionStatus {
  IDLE = 'IDLE',
  CREATING = 'CREATING',
  CREATED = 'CREATED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

// export interface ExecutionStateUI {
//   highlightedNodeId: string[] | null
//   highlightedEdgeId: string[] | null
// }

export interface ExecutionState {
  status: ExecutionStatus
  executionId: string | null
  debugMode: boolean
  breakpoints: Set<string>
  error: ExecutionError | null
  subscription: ExecutionSubscriptionState
  // nodeStates: Map<string, NodeExecutionState>
  // edgeStates: Map<string, EdgeExecutionState>
  // ui: ExecutionStateUI
}

export interface ExecutionError {
  message: string
  code?: string
  timestamp: Date
}

// export interface ExecutionEvent {
//   type: ExecutionEventEnum
//   timestamp: Date
//   data: any // TODO: We'll type this more specifically as we implement different event handlers
// }

export interface CreateExecutionOptions {
  flowId: string
  debug?: boolean

  archAIIntegration?: {
    agentID?: string
    agentSession?: string
    chatID?: string
    messageID?: number
  }
}

export interface ExecutionOptions {
  maxConcurrency?: number
  nodeTimeoutMs?: number
  flowTimeoutMs?: number
}

// Execution types
export enum ExecutionSubscriptionStatus {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  SUBSCRIBED = 'SUBSCRIBED',
  ERROR = 'ERROR',
  DISCONNECTED = 'DISCONNECTED',
}

// Combined subscription state type
export interface ExecutionSubscriptionState {
  status: ExecutionSubscriptionStatus
  error: ExecutionError | null
  isSubscribed: boolean
}

export const TERMINAL_EXECUTION_STATUSES = [
  ExecutionStatus.COMPLETED,
  ExecutionStatus.ERROR,
  ExecutionStatus.STOPPED,
] as const

export type TerminalExecutionStatus = typeof TERMINAL_EXECUTION_STATUSES[number]

export function isTerminalStatus(status: ExecutionStatus): status is TerminalExecutionStatus {
  return TERMINAL_EXECUTION_STATUSES.includes(status as TerminalExecutionStatus)
}

export interface NodeExecutionState {
  status: 'idle' | 'running' | 'completed' | 'failed' | 'skipped'
  startTime?: Date
  endTime?: Date
  executionTime?: number
  error?: Error
  node?: INode
}

export interface EdgeExecutionState {
  status: 'idle' | 'transferring' | 'completed' | 'failed'
  edge: IEdge
}
