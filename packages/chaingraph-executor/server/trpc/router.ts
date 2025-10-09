/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionRow } from '../../server/stores/postgres/schema'
import type { ExecutionCommand, ExecutionTask } from '../../types'
import type { createContext } from './context'
import {
  ExecutionExternalEventSchema,
  IntegrationContextSchema,
} from '@badaitech/chaingraph-types'
import { ExecutionOptionsSchema } from '@badaitech/chaingraph-types'
import { DBOS } from '@dbos-inc/dbos-sdk'
import { initTRPC, TRPCError } from '@trpc/server'
import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'
import SuperJSON from 'superjson'
import { z } from 'zod'
import { publishExecutionCommand } from '../../server/kafka/producers/command-producer'
import { generateExecutionID } from '../../server/services/ExecutionService'
import { config } from '../../server/utils/config'
import {
  ExecutionCommandType,
  ExecutionStatus,
} from '../../types'
import { createLogger } from '../utils/logger'

const logger = createLogger('trpc-router')

const defaultExecutionMaxRetries = 3

// Initialize tRPC
const t = initTRPC.context<typeof createContext>().create({
  transformer: SuperJSON,
  errorFormatter(opts) {
    const { shape, error } = opts
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof z.ZodError
            ? error.cause.flatten()
            : null,
      },
    }
  },
})

// const procedure = t.procedure

export const router = t.router
export const publicProcedure = t.procedure

export const authedProcedure = publicProcedure.use(async (opts) => {
  const { ctx } = opts

  // If auth is globally disabled or in dev mode, allow the request
  if (!config.authConfig.enabled || config.authConfig.devMode) {
    // console.debug('authedProcedure: Auth is disabled or in dev mode, skipping auth check')
    return opts.next()
  }

  // Check if user is authenticated
  if (!ctx.session.isAuthenticated) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return opts.next({
    ctx: {
      ...ctx,
      user: ctx.session.user,
    },
  })
})

export const executionContextProcedure = authedProcedure.use(async (opts) => {
  const rawInput = await opts.getRawInput()
  const executionId: string | null = rawInput
    && typeof rawInput === 'object'
    && 'executionId' in rawInput
    && typeof rawInput.executionId === 'string'
    ? rawInput.executionId
    : null

  if (!executionId) {
    throw new Error('Parameter executionId is required for this procedure')
  }

  // Check if user has access to the flow
  const { ctx } = opts

  if (!ctx.session.user?.id) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'User not authenticated',
    })
  }

  if (ctx.session.user.role === 'admin') {
    // Admins have access to all flows
    return opts.next(opts)
  }

  // TODO: make sure that we read from the cache when persistent storage is implemented
  const execution = await ctx.executionStore.get(executionId)
  if (!execution) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Execution not found',
    })
  }

  if (!await ctx.flowStore.hasAccess(execution.flowId, ctx.session.user.id)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'User does not have access to this flow',
    })
  }

  return opts.next(opts)
})

export const executionRouter = router({
  // Create execution record in store
  create: authedProcedure
    .input(z.object({
      flowId: z.string(),
      options: ExecutionOptionsSchema.optional(),
      integration: IntegrationContextSchema.optional(),
      events: z.array(ExecutionExternalEventSchema).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { executionStore, flowStore, taskQueue } = ctx

      const flowMetadata = await flowStore.getFlowMetadata(input.flowId)
      if (!flowMetadata) {
        logger.warn({ flowId: input.flowId }, 'Flow not found when creating execution')
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Flow with id ${input.flowId} not found`,
        })
      }

      if (!flowMetadata.id) {
        logger.error({ flowMetadata }, 'Flow metadata is missing ID')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Flow metadata is missing ID`,
        })
      }

      if (!flowMetadata.ownerID) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Flow metadata is missing ownerID`,
        })
      }

      if (ctx.session.user?.id !== flowMetadata.ownerID) {
        if (ctx.session.user?.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'User does not own the flow',
          })
        }
      }

      // Create execution record

      const executionId = generateExecutionID()

      const executionRow: ExecutionRow = {
        id: executionId,
        flowId: flowMetadata.id!,
        ownerId: flowMetadata.ownerID,
        rootExecutionId: executionId,
        parentExecutionId: null,
        status: ExecutionStatus.Created,
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: null,
        completedAt: null,
        errorMessage: null,
        errorNodeId: null,
        executionDepth: 0,
        options: input.options || {},
        integration: input.integration || {},
        externalEvents: input.events || [],
        // Failure tracking and recovery fields
        failureCount: 0,
        lastFailureReason: null,
        lastFailureAt: null,
        processingStartedAt: null,
        processingWorkerId: null,
      }

      try {
        await executionStore.create(executionRow)
      } catch (error) {
        logger.error({ error, executionId }, 'Failed to create execution record')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create execution record',
        })
      }

      // 🚀 Start workflow IMMEDIATELY (using signal pattern)
      // The workflow will:
      // 1. Write EXECUTION_CREATED event (initializes stream)
      // 2. Wait for START_SIGNAL (blocks until client calls start endpoint)
      // 3. Execute flow (after signal received)
      //
      // This ensures the event stream exists before clients subscribe
      const executionTask: ExecutionTask = {
        executionId,
        flowId: executionRow.flowId,
        timestamp: Date.now(),
        maxRetries: defaultExecutionMaxRetries,
      }

      try {
        await taskQueue.publishTask(executionTask)
        logger.info({ executionId }, 'Execution workflow started (waiting for START_SIGNAL)')
      } catch (error) {
        logger.error({ error, executionId }, 'Failed to start execution workflow')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to start execution workflow',
        })
      }

      return {
        executionId,
      }
    }),

  // Start execution
  start: executionContextProcedure
    .input(z.object({
      executionId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { executionStore } = ctx

      const executionRow = await executionStore.get(input.executionId)
      if (!executionRow) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found, create it first`,
        })
      }

      // Validate execution can be started
      if (executionRow.status !== ExecutionStatus.Created) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot start execution in status ${executionRow.status}. Execution must be in 'created' status.`,
        })
      }

      // 📨 Send START_SIGNAL to waiting workflow
      // The workflow was started in the 'create' endpoint and is waiting for this signal
      // This triggers Phase 2 of execution (actual flow execution)
      try {
        await DBOS.send(input.executionId, 'GO', 'START_SIGNAL')
        logger.info({ executionId: input.executionId }, 'START_SIGNAL sent to execution workflow')
      } catch (error) {
        logger.error({ error, executionId: input.executionId }, 'Failed to send START_SIGNAL')
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send start signal to execution workflow',
        })
      }

      return { success: true }
    }),

  // Stop execution
  stop: executionContextProcedure
    .input(z.object({
      executionId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { executionStore } = ctx

      const executionRow = await executionStore.get(input.executionId)
      if (!executionRow) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      const deniedStatuses = [
        ExecutionStatus.Completed,
        ExecutionStatus.Failed,
        ExecutionStatus.Stopped,
      ]

      if (deniedStatuses.includes(executionRow.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot stop execution in status ${executionRow.status}`,
        })
      }

      // Create STOP command
      const command: ExecutionCommand = {
        id: `CMD${customAlphabet(nolookalikes, 24)()}`,
        executionId: input.executionId,
        command: ExecutionCommandType.STOP,
        payload: {
          reason: input.reason || 'User requested stop',
        },
        timestamp: Date.now(),
        requestId: `REQ${customAlphabet(nolookalikes, 16)()}`,
        issuedBy: 'user',
      }

      await publishExecutionCommand(command)

      return { success: true }
    }),

  // Pause execution
  pause: executionContextProcedure
    .input(z.object({
      executionId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { executionStore } = ctx

      const executionRow = await executionStore.get(input.executionId)
      if (!executionRow) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      const deniedStatuses = [
        ExecutionStatus.Created,
        ExecutionStatus.Paused,
        ExecutionStatus.Completed,
        ExecutionStatus.Failed,
        ExecutionStatus.Stopped,
      ]

      if (deniedStatuses.includes(executionRow.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot pause execution in status ${executionRow.status}`,
        })
      }

      // Create STOP command
      const command: ExecutionCommand = {
        id: `CMD${customAlphabet(nolookalikes, 24)()}`,
        executionId: input.executionId,
        command: ExecutionCommandType.PAUSE,
        payload: {
          reason: input.reason || 'User requested pause',
        },
        timestamp: Date.now(),
        requestId: `REQ${customAlphabet(nolookalikes, 16)()}`,
        issuedBy: 'user',
      }

      await publishExecutionCommand(command)

      return { success: true }
    }),

  // Resume execution
  resume: executionContextProcedure
    .input(z.object({
      executionId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { executionStore } = ctx

      const executionRow = await executionStore.get(input.executionId)
      if (!executionRow) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      const deniedStatuses = [
        ExecutionStatus.Created,
        ExecutionStatus.Running,
        ExecutionStatus.Completed,
        ExecutionStatus.Failed,
        ExecutionStatus.Stopped,
      ]

      if (deniedStatuses.includes(executionRow.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot resume execution in status ${executionRow.status}`,
        })
      }

      // Create RESUME command
      const command: ExecutionCommand = {
        id: `CMD${customAlphabet(nolookalikes, 24)()}`,
        executionId: input.executionId,
        command: ExecutionCommandType.RESUME,
        payload: {},
        timestamp: Date.now(),
        requestId: `REQ${customAlphabet(nolookalikes, 16)()}`,
        issuedBy: 'user',
      }

      await publishExecutionCommand(command)

      return { success: true }
    }),

  // Get execution details
  getExecutionDetails: executionContextProcedure
    .input(z.object({
      executionId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const { executionStore } = ctx

      const executionRow = await executionStore.get(input.executionId)
      if (!executionRow) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      return executionRow
    }),

  // Get child executions
  getExecutionsTree: executionContextProcedure
    .input(z.object({
      executionId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const { executionStore } = ctx

      const executionTree = await executionStore.getExecutionTree(input.executionId)
      if (!executionTree || executionTree.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution tree with root id ${input.executionId} not found`,
        })
      }

      return executionTree
    }),

  // Get execution tree
  getRootExecutions: authedProcedure
    .input(z.object({
      flowId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      after: z.date().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { executionStore, flowStore } = ctx

      const flowMetadata = await flowStore.getFlowMetadata(input.flowId)
      if (!flowMetadata) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Flow with id ${input.flowId} not found`,
        })
      }

      if (ctx.session.user?.id !== flowMetadata.ownerID) {
        if (ctx.session.user?.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'User does not own the flow',
          })
        }
      }

      // Get all root executions for the flow
      return await executionStore.getRootExecutions(
        input.flowId,
        input.limit,
        input.after || null,
      )
    }),

  // Subscribe to execution events
  subscribeToExecutionEvents: executionContextProcedure
    .input(z.object({
      executionId: z.string(),
      fromIndex: z.number().optional().default(0),
      eventTypes: z.array(z.string()).optional().default([]),
    }))
    .subscription(async function* ({ input, ctx }) {
      const { executionStore, eventBus } = ctx

      const instance = await executionStore.get(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      // Subscribe to events from the event bus
      const iterator = eventBus.subscribeToEvents(
        input.executionId,
        input.fromIndex,
      )

      try {
        for await (const events of iterator) {
          yield events.filter((event) => {
            if (input.eventTypes.length === 0) {
              return true
            }
            return input.eventTypes.includes(event.type)
          })
        }
      } catch (error) {
        logger.error({
          error,
          executionId: input.executionId,
        }, 'Error in event subscription')
        throw error
      } finally {
        logger.info({
          executionId: input.executionId,
        }, 'Event subscription ended')
      }
    }),
})

export type ExecutionRouter = typeof executionRouter
