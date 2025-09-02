/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone'
import type { IEventBus, ITaskQueue } from '../interfaces'
import type { ExecutionService } from '../services/ExecutionService'
import type { IExecutionStore } from '../stores/interfaces/IExecutionStore'
import { getServices } from '../services/ServiceFactory'
import { createLogger } from '../utils/logger'

const logger = createLogger('trpc-context')

export interface MessageBusContext {
  executionService: ExecutionService
  executionStore: IExecutionStore
  eventBus: IEventBus
  taskQueue: ITaskQueue
}

/**
 * Creates context for tRPC procedures in the message bus
 * Uses the ServiceFactory to get service instances
 */
export async function createContext(opts: CreateHTTPContextOptions): Promise<MessageBusContext> {
  const services = getServices()

  if (!services) {
    logger.error('Services not initialized. Call createServices first.')
    throw new Error('Services not initialized')
  }

  // For distributed execution, we need to create ExecutionService here
  // since it's not part of the ServiceFactory yet
  const { ExecutionService } = await import('../services/ExecutionService')

  const executionService = new ExecutionService(
    services.executionStore,
    services.eventBus,
    services.taskQueue,
  )

  return {
    executionService,
    executionStore: services.executionStore,
    eventBus: services.eventBus,
    taskQueue: services.taskQueue,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
