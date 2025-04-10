/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { FlowMetadata } from '@badaitech/chaingraph-types'
import type { FlowSubscriptionError, FlowSubscriptionStatus } from './types'
import { createEvent } from 'effector'

// Flow list events
export const loadFlowsList = createEvent()
export const setFlowsList = createEvent<FlowMetadata[]>()
export const setFlowsLoading = createEvent<boolean>()
export const setFlowsError = createEvent<Error | null>()
export const setFlowMetadata = createEvent<FlowMetadata>()
export const setFlowLoaded = createEvent<string>()

// Active flow events
export const setActiveFlowId = createEvent<string>()
export const clearActiveFlow = createEvent()

// Flow CRUD events
export const createFlow = createEvent<CreateFlowEvent>()
export const updateFlow = createEvent<UpdateFlowEvent>()
export const deleteFlow = createEvent<string>()

// Subscription events
export const setFlowSubscriptionStatus = createEvent<FlowSubscriptionStatus>()
export const setFlowSubscriptionError = createEvent<FlowSubscriptionError | null>()
export const resetFlowSubscription = createEvent()

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
