/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

export enum FlowSubscriptionStatus {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  SUBSCRIBED = 'SUBSCRIBED',
  ERROR = 'ERROR',
  DISCONNECTED = 'DISCONNECTED',
}

export interface FlowSubscriptionError {
  message: string
  code?: string
  timestamp: Date
}

export interface FlowMetadataEvent {
  name: string
  description?: string
  tags?: string[]
}

export interface CreateFlowEvent {
  metadata: FlowMetadataEvent
}

export interface UpdateFlowEvent {
  id: string
  metadata: FlowMetadataEvent
}
