/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  EmittedEventContext,
  ExecutionEventImpl,
  ExecutionOptions,
  IntegrationContext,
} from '@badaitech/chaingraph-types'
import process from 'node:process'

export enum ExecutionCommandType {
  CREATE = 'CREATE',
  START = 'START',
  STOP = 'STOP',
  PAUSE = 'PAUSE',
  STEP = 'STEP',
  RESUME = 'RESUME',
  HEARTBEAT = 'HEARTBEAT',
}

/**
 * Command to control execution lifecycle
 */
export interface ExecutionCommand {
  id: string // Command ID for idempotency
  executionId?: string // Target execution ID (required for control commands)
  workerId?: string // Target worker ID (optional, for routing)
  command: ExecutionCommandType
  payload: {
    flowId?: string // Required for CREATE, optional for others
    options?: ExecutionOptions
    integrations?: IntegrationContext
    parentExecutionId?: string
    eventData?: EmittedEventContext
    externalEvents?: Array<{ type: string, data: any }>
    executionDepth?: number
    reason?: string // Optional reason for stop/pause
  }
  timestamp: number
  requestId: string
  issuedBy: string // Who issued the command (user, system, worker)
}

/**
 * Retry history entry for debugging
 */
export interface RetryHistoryEntry {
  attempt: number
  error: string
  timestamp: number
  workerId?: string
}

/**
 * Task to execute a flow
 */
export interface ExecutionTask {
  executionId: string
  flowId: string
  timestamp: number
  retryCount?: number
  maxRetries?: number
  retryDelayMs?: number
  retryHistory?: RetryHistoryEntry[]
}

/**
 * Event message published to Kafka
 */
export interface ExecutionEventMessage {
  executionId: string
  event: ExecutionEventImpl // Existing ExecutionEvent type
  timestamp: number
  workerId: string // Which worker produced this
}

let topicsPrefix = ''
try {
  topicsPrefix = process?.env?.KAFKA_TOPICS_PREFIX || ''
} catch {
  topicsPrefix = ''
}

/**
 * Kafka topic names
 */
export const KafkaTopics = {
  COMMANDS: `${topicsPrefix}chaingraph.execution.commands`,
  EVENTS: `${topicsPrefix}chaingraph.execution.events`,
  TASKS: `${topicsPrefix}chaingraph.execution.tasks`,
} as const

export type KafkaTopicName = typeof KafkaTopics[keyof typeof KafkaTopics]
