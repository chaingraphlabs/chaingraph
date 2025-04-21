/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { FlowMetadata } from '@badaitech/chaingraph-types'
import type { FlowSubscriptionError, FlowSubscriptionStatus } from './types'
import { flowDomain } from '../domains'

// Flow list events
export const loadFlowsList = flowDomain.createEvent()
export const setFlowsList = flowDomain.createEvent<FlowMetadata[]>()
export const setFlowsLoading = flowDomain.createEvent<boolean>()
export const setFlowsError = flowDomain.createEvent<Error | null>()
export const setFlowMetadata = flowDomain.createEvent<FlowMetadata>()
export const setFlowLoaded = flowDomain.createEvent<string>()

// Active flow events
export const setActiveFlowId = flowDomain.createEvent<string>()
export const clearActiveFlow = flowDomain.createEvent()

// Flow CRUD events
export const createFlow = flowDomain.createEvent<CreateFlowEvent>()
export const updateFlow = flowDomain.createEvent<UpdateFlowEvent>()
export const deleteFlow = flowDomain.createEvent<string>()

// Subscription events
export const setFlowSubscriptionStatus = flowDomain.createEvent<FlowSubscriptionStatus>()
export const setFlowSubscriptionError = flowDomain.createEvent<FlowSubscriptionError | null>()
export const resetFlowSubscription = flowDomain.createEvent()

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
