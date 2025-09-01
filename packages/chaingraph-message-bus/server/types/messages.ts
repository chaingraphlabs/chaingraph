/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionEventImpl,
  ExecutionOptions,
  IntegrationContext,
} from '@badaitech/chaingraph-types'

/**
 * Event data context for child executions
 */
export interface EmittedEventContext {
  eventName: string
  payload: any
  emittedBy: string
}

/**
 * Command to control execution lifecycle
 */
export interface ExecutionCommand {
  id: string // Command ID for idempotency
  executionId?: string // Target execution ID
  command: 'CREATE' | 'START' | 'STOP' | 'PAUSE' | 'RESUME'
  payload: {
    flowId: string // Just the ID, not the flow!
    options?: ExecutionOptions
    integrations?: IntegrationContext
    parentExecutionId?: string
    eventData?: EmittedEventContext
    externalEvents?: Array<{ type: string, data: any }>
    executionDepth?: number
  }
  timestamp: number
  requestId: string
}

/**
 * Task to execute a flow
 */
export interface ExecutionTask {
  executionId: string
  flowId: string // Just the ID!
  context: {
    integrations?: IntegrationContext
    parentExecutionId?: string
    eventData?: EmittedEventContext
    executionDepth: number
  }
  options: ExecutionOptions
  priority: number
  timestamp: number
}

/**
 * Event message published to Kafka
 */
export interface ExecutionEventMessage {
  executionId: string
  event: ExecutionEventImpl // Existing ExecutionEvent type
  // event: any // TODO: fix
  timestamp: number
  workerId: string // Which worker produced this
}

/**
 * Kafka topic names
 */
export const KafkaTopics = {
  COMMANDS: 'chaingraph.execution.commands',
  EVENTS: 'chaingraph.execution.events',
  TASKS: 'chaingraph.execution.tasks',
} as const

export type KafkaTopicName = typeof KafkaTopics[keyof typeof KafkaTopics]
