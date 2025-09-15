/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IFlowStore, Session } from '@badaitech/chaingraph-trpc/server'
import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone'
import type { IExecutionService } from '../../server/services/IExecutionService'
import type { IEventBus, ITaskQueue } from '../interfaces'
import type { IExecutionStore } from '../stores/interfaces/IExecutionStore'
import { authService } from '@badaitech/chaingraph-trpc/server'
import { getAuthToken } from '@badaitech/chaingraph-trpc/server'
import { getServices } from '../services/ServiceFactory'
import { createLogger } from '../utils/logger'

const logger = createLogger('trpc-context')

export interface ExecutorContext {
  session: Session
  executionService: IExecutionService
  executionStore: IExecutionStore
  eventBus: IEventBus
  taskQueue: ITaskQueue
  flowStore: IFlowStore
}

/**
 * Creates context for tRPC procedures in the message bus
 * Uses the ServiceFactory to get service instances
 */
export async function createContext(opts: CreateHTTPContextOptions): Promise<ExecutorContext> {
  const services = getServices()

  if (!services) {
    logger.error('Services not initialized. Call createServices first.')
    throw new Error('Services not initialized')
  }

  // Get token from request headers or websocket
  const token = getAuthToken(opts)

  // Validate session
  const session = await authService.validateSession(token)
  const user = await authService.getUserFromSession(session)

  return {
    session: {
      user: user ?? undefined,
      session: session ?? undefined,
      isAuthenticated: !!user && !!session,
    },
    executionService: services.executionService,
    executionStore: services.executionStore,
    flowStore: services.flowStore,
    eventBus: services.eventBus,
    taskQueue: services.taskQueue,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
