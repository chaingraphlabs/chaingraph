import type { FlowSubscriptionError, FlowSubscriptionStatus } from '@/store'
import type { FlowMetadata } from '@chaingraph/types'
import { createEvent } from 'effector'

// Flow list events
export const loadFlowsList = createEvent()
export const setFlowsList = createEvent<FlowMetadata[]>()
export const setFlowsLoading = createEvent<boolean>()
export const setFlowsError = createEvent<Error | null>()
export const setFlowMetadata = createEvent<FlowMetadata>()

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
