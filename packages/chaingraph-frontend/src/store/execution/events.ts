import type { ExecutionEventImpl } from '@chaingraph/types'
import type {
  CreateExecutionOptions,
  ExecutionError,
  ExecutionStatus,
  ExecutionSubscriptionStatus,
} from './types'
import { createEvent } from 'effector'

// Control events
export const createExecution = createEvent<CreateExecutionOptions>()
export const startExecution = createEvent<string>() // executionId
export const pauseExecution = createEvent<string>() // executionId
export const resumeExecution = createEvent<string>() // executionId
export const stopExecution = createEvent<string>() // executionId

// Debug events
export const toggleDebugMode = createEvent<boolean>()
export const addBreakpoint = createEvent<{ nodeId: string }>()
export const removeBreakpoint = createEvent<{ nodeId: string }>()
export const stepExecution = createEvent<string>() // executionId

// State events
export const setExecutionError = createEvent<ExecutionError | null>()
export const clearExecutionState = createEvent()

// Subscription events
export const setExecutionSubscriptionStatus = createEvent<ExecutionSubscriptionStatus>()
export const setExecutionSubscriptionError = createEvent<ExecutionError | null>()

export const setExecutionStatus = createEvent<ExecutionStatus>()
export const newExecutionEvent = createEvent<ExecutionEventImpl>()

export const resetAutoStart = createEvent()
export const markStartAttempted = createEvent()
