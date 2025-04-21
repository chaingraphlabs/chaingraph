/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventImpl } from '@badaitech/chaingraph-types'
import type {
  CreateExecutionOptions,
  ExecutionError,
  ExecutionStatus,
  ExecutionSubscriptionStatus,
} from './types'
import { executionDomain } from '../domains'

// Control events
export const createExecution = executionDomain.createEvent<CreateExecutionOptions>()
export const startExecution = executionDomain.createEvent<string>() // executionId
export const pauseExecution = executionDomain.createEvent<string>() // executionId
export const resumeExecution = executionDomain.createEvent<string>() // executionId
export const stopExecution = executionDomain.createEvent<string>() // executionId

// Debug events
export const toggleDebugMode = executionDomain.createEvent<boolean>()
export const addBreakpoint = executionDomain.createEvent<{ nodeId: string }>()
export const removeBreakpoint = executionDomain.createEvent<{ nodeId: string }>()
export const stepExecution = executionDomain.createEvent<string>() // executionId

// State events
export const setExecutionError = executionDomain.createEvent<ExecutionError | null>()
export const clearExecutionState = executionDomain.createEvent()

// Subscription events
export const setExecutionSubscriptionStatus = executionDomain.createEvent<ExecutionSubscriptionStatus>()
export const setExecutionSubscriptionError = executionDomain.createEvent<ExecutionError | null>()

export const setExecutionStatus = executionDomain.createEvent<ExecutionStatus>()
export const newExecutionEvent = executionDomain.createEvent<ExecutionEventImpl>()

export const resetAutoStart = executionDomain.createEvent()
export const markStartAttempted = executionDomain.createEvent()

export const setHighlightedNodeId = executionDomain.createEvent<string | string[] | null>()
export const setHighlightedEdgeId = executionDomain.createEvent<string | string[] | null>()
