/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  EventQueue,
  ExecutionEventData,
  Flow,
} from '@badaitech/chaingraph-types'
import type { ExecutionEvent } from '@badaitech/chaingraph-types'
import * as console from 'node:console'
import { ExecutionEventEnum, ExecutionEventImpl } from '@badaitech/chaingraph-types'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { zAsyncIterable } from '../../procedures/subscriptions/utils/zAsyncIterable'
import { executionContextProcedure, flowContextProcedure, router } from '../../trpc'
import { debugRouter } from './debug-router'

// Integration schemas
const archAIContextSchema = z.object({
  agentSession: z.string().optional(),
  agentID: z.string().optional(),
  chatID: z.string().optional(),
  messageID: z.number().optional(),
})

const walletContextSchema = z.object({
  isConnected: z.boolean(),
  address: z.string().optional(),
  chainId: z.number().optional(),
  providerType: z.string().optional(),
  ensName: z.string().optional(),
  capabilities: z.object({
    supportsBatchTransactions: z.boolean().optional(),
    supportsEIP1559: z.boolean().optional(),
    supportsEIP712: z.boolean().optional(),
  }).optional(),
  lastUpdated: z.number().optional(),
  rpcUrl: z.string().optional(),
})

const integrationContextSchema = z.object({
  archai: archAIContextSchema.optional(),
  wallet: walletContextSchema.optional(),
  // Add other integration contexts as needed
}).passthrough()

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
      integration: integrationContextSchema.optional(),
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
      events: z.array(z.object({
        type: z.string(),
        data: z.record(z.any()).optional(),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const instance = await ctx.executionService.getInstance(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      await ctx.executionService.startExecution(input.executionId, input.events)
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
        }),
      )
      return childStates
    }),

  // Get execution tree - returns the full tree structure for the frontend
  getExecutionTree: flowContextProcedure
    .input(z.object({
      flowId: z.string(), // Filter by flow ID
      status: z.enum(['all', 'created', 'running', 'completed', 'failed', 'stopped', 'paused']).optional(),
      limit: z.number().min(1).max(500).default(50),
    }))
    .query(async ({ input, ctx }) => {
      // Get all executions from the store
      const allExecutions = await ctx.executionStore.list()

      // Filter executions
      let filteredExecutions = allExecutions

      // Filter by flow ID if provided
      if (input.flowId) {
        filteredExecutions = filteredExecutions.filter(exec => exec.flow.id === input.flowId)
      }

      // Filter by status if provided
      if (input.status && input.status !== 'all') {
        filteredExecutions = filteredExecutions.filter(exec => exec.status.toLowerCase() === input.status)
      }

      // Sort by execution depth first (root executions first), then by creation time (newest first)
      filteredExecutions.sort((a, b) => {
        // First sort by depth (lower depth = higher priority)
        const depthDiff = (a.executionDepth || 0) - (b.executionDepth || 0)
        if (depthDiff !== 0)
          return depthDiff

        // If same depth, sort by creation time (newest first)
        return b.createdAt.getTime() - a.createdAt.getTime()
      })

      // Limit results
      filteredExecutions = filteredExecutions.slice(0, input.limit)

      // Build execution tree data

      // Build a map of parent->children for efficient lookup
      const childrenMap = new Map<string, number>()
      allExecutions.forEach((exec) => {
        if (exec.parentExecutionId) {
          const count = childrenMap.get(exec.parentExecutionId) || 0
          childrenMap.set(exec.parentExecutionId, count + 1)
        }
      })

      const result = await Promise.all(
        filteredExecutions.map(async (exec) => {
          const childCount = childrenMap.get(exec.id) || 0

          return {
            id: exec.id,
            flowId: exec.flow.id || '',
            flowName: exec.flow.metadata?.name || 'Unnamed Flow',
            status: exec.status as any,
            parentExecutionId: exec.parentExecutionId,
            executionDepth: exec.executionDepth || 0,
            createdAt: exec.createdAt,
            startedAt: exec.startedAt,
            completedAt: exec.completedAt,
            error: exec.error,
            triggeredByEvent: exec.context.eventData
              ? {
                  eventName: exec.context.eventData.eventName,
                  payload: exec.context.eventData.payload,
                }
              : exec.externalEvents && exec.externalEvents.length > 0
                ? {
                    eventName: exec.externalEvents.map(e => e.type).join(', '),
                    payload: {
                      count: exec.externalEvents.length,
                      source: 'external',
                      events: exec.externalEvents,
                    },
                  }
                : undefined,
            childCount,
          }
        }),
      )

      return result
    }),

  // Get execution details - for the detail panel
  getExecutionDetails: executionContextProcedure
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
      const childIds = await ctx.executionService.getChildExecutions(input.executionId)

      return {
        id: instance.id,
        flowId: instance.flow.id || '',
        flowName: instance.flow.metadata?.name || 'Unnamed Flow',
        status: state.status,
        parentExecutionId: instance.parentExecutionId,
        executionDepth: instance.executionDepth || 0,
        createdAt: instance.createdAt,
        startedAt: state.startTime,
        completedAt: state.endTime,
        error: state.error,
        triggeredByEvent: instance.context.eventData
          ? {
              eventName: instance.context.eventData.eventName,
              payload: instance.context.eventData.payload,
            }
          : instance.externalEvents && instance.externalEvents.length > 0
            ? {
                eventName: instance.externalEvents.map(e => e.type).join(', '),
                payload: {
                  count: instance.externalEvents.length,
                  source: 'external',
                  events: instance.externalEvents,
                },
              }
            : undefined,
        childCount: childIds.length,
        // Additional details
        integrations: instance.context.integrations,
        options: instance.engine?.getOptions() || {},
        abortSignal: instance.context.abortController?.signal.aborted || false,
      }
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

      // Send initial state event
      yield new ExecutionEventImpl(
        -1,
        ExecutionEventEnum.FLOW_SUBSCRIBED,
        new Date(),
        {
          flow: instance.flow,
        } as ExecutionEventData[ExecutionEventEnum.FLOW_SUBSCRIBED],
      )

      // Try to get the service's event queue for this execution
      let serviceEventQueue: EventQueue<ExecutionEvent> | undefined
      try {
        serviceEventQueue = ctx.executionService.getEventQueue(input.executionId)
      } catch (error) {
        // Event queue doesn't exist - execution already finished
        console.log(`Event queue not found for execution ${input.executionId}, loading from history`)
      }

      // Create async iterator for the service's event queue
      const iterator = serviceEventQueue ? serviceEventQueue.createIterator() : null

      // If we have an event store and need to load historical events
      const eventStore = (ctx.executionService as any).eventStore
      if (eventStore) {
        try {
          // Load historical events from the database
          const historicalEvents = await eventStore.getEvents(
            input.executionId,
            eventIndex > 0 ? eventIndex + 1 : 0, // Start from next event if reconnecting
            10000, // Limit to 10000 events for performance
          )

          // Yield historical events
          for (const event of historicalEvents) {
            // Reconstruct ExecutionEventImpl from stored data
            const eventImpl = new ExecutionEventImpl(
              event.index,
              event.type,
              event.timestamp,
              event.data,
            )

            // Filter by event types if specified
            if (!isAcceptedEventType(input.eventTypes, eventImpl.type)) {
              continue
            }
            yield eventImpl
          }

          console.log(`Streamed ${historicalEvents.length} historical events for execution ${input.executionId}`)
        } catch (error) {
          console.error('Error loading historical events:', error)
        }
      }

      // If execution is still running and we have an event queue, stream live events
      if (serviceEventQueue && iterator) {
        try {
          for await (const event of iterator) {
            // Skip events we've already sent from history
            if (event.index <= eventIndex) {
              continue
            }

            // Filter by event types if specified
            if (!isAcceptedEventType(input.eventTypes, event.type)) {
              continue
            }
            yield event
          }
        } catch (error) {
          console.error('Error handling live execution events:', error)
        }
      } else {
        // No event queue means execution is finished
        console.log(`Execution ${input.executionId} is complete, closing subscription`)
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
