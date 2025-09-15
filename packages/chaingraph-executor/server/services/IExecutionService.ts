/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Flow } from '@badaitech/chaingraph-types'
import type { ExecutionRow } from '../../server/stores/postgres/schema'
import type { ExecutionInstance, ExecutionTask } from '../../types'

export interface CreateExecutionParams {
  task: ExecutionTask
  flow: Flow
  executionRow: ExecutionRow
  abortController: AbortController

  // executionId?: string
  // rootExecutionId?: string
  // parentExecutionId?: string
  // options?: ExecutionOptions
  // integrations?: IntegrationContext
  // eventData?: EmittedEventContext
  // parentDepth?: number
}

export interface IExecutionService {
  createExecutionInstance: (params: CreateExecutionParams) => Promise<ExecutionInstance>

  // getInstance: (id: string) => Promise<ExecutionInstance | null>
  //
  // startExecution: (id: string, events?: Array<{ type: string, data?: any }>) => Promise<void>
  //
  // stopExecution: (id: string, reason?: string) => Promise<void>
  //
  // pauseExecution: (id: string, reason?: string) => Promise<void>
  //
  // resumeExecution: (id: string) => Promise<void>
  //
  // getExecutionState: (id: string) => Promise<ExecutionState>
  //
  // addBreakpoint: (executionId: string, nodeId: string) => Promise<void>
  //
  // removeBreakpoint: (executionId: string, nodeId: string) => Promise<void>
  //
  // stepExecution: (executionId: string) => Promise<void>
  //
  // getBreakpoints: (executionId: string) => Promise<string[]>
  //
  // processEmittedEvents: (instance: ExecutionInstance) => Promise<void>
  //
  // getChildExecutions: (parentId: string) => Promise<string[]>
  //
  // dispose: (id: string) => Promise<void>
  //
  // shutdown: () => Promise<void>
}
