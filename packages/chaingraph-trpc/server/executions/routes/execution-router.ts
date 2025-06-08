/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventData, Flow } from '@badaitech/chaingraph-types'
import * as console from 'node:console'
import { EventQueue, ExecutionEventEnum, ExecutionEventImpl } from '@badaitech/chaingraph-types'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { zAsyncIterable } from '../../procedures/subscriptions/utils/zAsyncIterable'
import { executionContextProcedure, flowContextProcedure, router } from '../../trpc'
import { debugRouter } from './debug-router'

export const executionRouter = router({
  // Create execution instance
  create: flowContextProcedure
    .input(z.object({
      flowId: z.string(),
      options: z.object({
        execution: z.object({
          maxConcurrency: z.number().optional(),
          nodeTimeoutMs: z.number().optional(),
          flowTimeoutMs: z.number().optional(),
        }).optional(),
        debug: z.boolean().optional(),
        breakpoints: z.array(z.string()).optional(),
      }).optional(),
      integration: z.record(z.string(),
        // For each integration type key, we accept any valid object
        z.object({}).catchall(z.unknown())).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const flow = await ctx.flowStore.getFlow(input.flowId)
      if (!flow) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Flow with id ${input.flowId} not found`,
        })
      }

      const instance = await ctx.executionService.createExecution(
        flow as Flow,
        input.options,
        input.integration,
      )
      if (input.options?.breakpoints) {
        for (const nodeId of input.options.breakpoints) {
          await ctx.executionService.addBreakpoint(instance.id, nodeId)
        }
      }

      return {
        executionId: instance.id,
      }
    }),

  // Start execution
  start: executionContextProcedure
    .input(z.object({
      executionId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const instance = await ctx.executionService.getInstance(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      await ctx.executionService.startExecution(input.executionId)
      return { success: true }
    }),

  // Stop execution
  stop: executionContextProcedure
    .input(z.object({
      executionId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const instance = await ctx.executionService.getInstance(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      await ctx.executionService.stopExecution(input.executionId)
      return { success: true }
    }),

  // Pause execution
  pause: executionContextProcedure
    .input(z.object({
      executionId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const instance = await ctx.executionService.getInstance(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      await ctx.executionService.pauseExecution(input.executionId)
      return { success: true }
    }),

  // Resume execution
  resume: executionContextProcedure
    .input(z.object({
      executionId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const instance = await ctx.executionService.getInstance(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      await ctx.executionService.resumeExecution(input.executionId)
      return { success: true }
    }),

  // Get execution state
  getState: executionContextProcedure
    .input(z.object({
      executionId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const instance = await ctx.executionService.getInstance(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      const state = await ctx.executionService.getExecutionState(input.executionId)
      const childExecutions = await ctx.executionService.getChildExecutions(input.executionId)
      
      return {
        ...state,
        parentExecutionId: instance.parentExecutionId,
        childExecutionIds: childExecutions,
      }
    }),

  // Get child executions
  getChildExecutions: executionContextProcedure
    .input(z.object({
      executionId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const childIds = await ctx.executionService.getChildExecutions(input.executionId)
      const childStates = await Promise.all(
        childIds.map(async (childId) => {
          const state = await ctx.executionService.getExecutionState(childId)
          const instance = await ctx.executionService.getInstance(childId)
          return {
            ...state,
            eventData: instance?.context.eventData,
          }
        })
      )
      return childStates
    }),

  // Subscribe to execution events
  subscribeToEvents: executionContextProcedure
    .input(z.object({
      executionId: z.string(),
      eventTypes: z.array(z.nativeEnum(ExecutionEventEnum)).optional(),
      lastEventId: z.string().nullish(),
    }))
    .output(
      zAsyncIterable({
        yield: z.custom<ExecutionEventImpl>(),
        tracked: false,
      }),
    )
    .subscription(async function* ({ input, ctx }) {
      const instance = await ctx.executionService.getInstance(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      const eventIndex = input.lastEventId ? Number(input.lastEventId) : 0
      
      // Get the service's event queue for this execution
      const serviceEventQueue = ctx.executionService.getEventQueue(input.executionId)
      if (!serviceEventQueue) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Event queue not found for execution',
        })
      }

      // Send initial state event
      yield new ExecutionEventImpl(
        -1,
        ExecutionEventEnum.FLOW_SUBSCRIBED,
        new Date(),
        {
          flow: instance.flow,
        } as ExecutionEventData[ExecutionEventEnum.FLOW_SUBSCRIBED],
      )

      try {
        // Create async iterator for the service's event queue
        const iterator = serviceEventQueue.createIterator()
        for await (const event of iterator) {
          // Filter by event types if specified
          if (!isAcceptedEventType(input.eventTypes, event.type)) {
            continue
          }
          yield event
        }
      } catch (error) {
        console.error('Error handling execution events:', error)
      }
    }),

  debug: debugRouter,
})

/**
 * Checks if an event type should be included based on the filter
 * @param eventTypes - Array of event types to filter by, if undefined or empty all events are accepted
 * @param type - The event type to check
 * @returns boolean indicating if the event type should be included
 */
function isAcceptedEventType(
  eventTypes: ExecutionEventEnum[] | undefined,
  type: ExecutionEventEnum,
): boolean {
  return !eventTypes || eventTypes.length === 0 || eventTypes.includes(type)
}
