/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeStatus } from './types'

/**
 * Edge event types
 */
export type EdgeEventType
  = | 'status-change'
    | 'transfer-start'
    | 'transfer-complete'
    | 'error'
    | 'validation'

/**
 * Base edge event interface
 */
export interface EdgeEvent {
  type: EdgeEventType
  edgeId: string
  timestamp: Date
}

/**
 * Status change event
 */
export interface EdgeStatusChangeEvent extends EdgeEvent {
  type: 'status-change'
  oldStatus: EdgeStatus
  newStatus: EdgeStatus
}

/**
 * Data transfer event
 */
export interface EdgeTransferEvent extends EdgeEvent {
  type: 'transfer-start' | 'transfer-complete'
  sourceNodeId: string
  targetNodeId: string
  dataSnapshot?: unknown
}

/**
 * Edge error event
 */
export interface EdgeErrorEvent extends EdgeEvent {
  type: 'error'
  error: Error
  context?: Record<string, unknown>
}

/**
 * Edge validation event
 */
export interface EdgeValidationEvent extends EdgeEvent {
  type: 'validation'
  isValid: boolean
  messages: string[]
}

/**
 * Union of all edge events
 */
export type EdgeEvents
  = | EdgeStatusChangeEvent
    | EdgeTransferEvent
    | EdgeErrorEvent
    | EdgeValidationEvent
