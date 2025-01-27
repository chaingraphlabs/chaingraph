import type { ExecutionEvent } from '@chaingraph/types'
import { debugRouter } from '@chaingraph/backend/execution/routes/debug-router'
import { publicProcedure, router } from '@chaingraph/backend/trpc'
import { ExecutionEventEnum } from '@chaingraph/types'
import { EventQueue } from '@chaingraph/types/utils/event-queue'
import { tracked, TRPCError } from '@trpc/server'
import { z } from 'zod'

export const executionRouter = router({
  // Create execution instance
  create: publicProcedure
    .input(z.object({
      flowId: z.string(),
      options: z.object({
        execution: z.object({
          maxConcurrency: z.number().optional(),
          nodeTimeoutMs: z.number().optional(),
          flowTimeoutMs: z.number().optional(),
        }).optional(),
        debug: z.boolean().optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const flow = await ctx.flowStore.getFlow(input.flowId)
      if (!flow) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Flow with id ${input.flowId} not found`,
        })
      }

      const instance = await ctx.executionService.createExecution(flow, input.options)
      return {
        executionId: instance.id,
      }
    }),

  // Start execution
  start: publicProcedure
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
  stop: publicProcedure
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
  pause: publicProcedure
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
  resume: publicProcedure
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
  getState: publicProcedure
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

      return ctx.executionService.getExecutionState(input.executionId)
    }),

  // Subscribe to execution events
  subscribeToEvents: publicProcedure
    .input(z.object({
      executionId: z.string(),
      eventTypes: z.array(z.nativeEnum(ExecutionEventEnum)).optional(),
      lastEventId: z.string().nullish(),
    }))
    .subscription(async function* ({ input, ctx }) {
      const instance = await ctx.executionService.getInstance(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      let eventIndex = input.lastEventId ? Number(input.lastEventId) : 0
      const eventQueue = new EventQueue<ExecutionEvent>(200)

      try {
        // Subscribe to engine events
        const unsubscribe = instance.engine.onAll((event) => {
          // Filter by event types if specified
          if (!isAcceptedEventType(input.eventTypes, event.type)) {
            return
          }
          eventQueue.publish(event)
        })

        // Send initial state event
        if (isAcceptedEventType(input.eventTypes, ExecutionEventEnum.FLOW_STARTED)) {
          yield tracked(String(eventIndex++), {
            type: ExecutionEventEnum.FLOW_STARTED,
            timestamp: new Date(),
            context: instance.context,
            data: {
              flow: instance.flow,
            },
            index: eventIndex,
          })
        }

        try {
          // Create async iterator for event queue
          const iterator = eventQueue.createIterator()
          for await (const event of iterator) {
            yield tracked(String(eventIndex++), event)

            // Check if execution is completed or failed
            if (
              event.type === ExecutionEventEnum.FLOW_COMPLETED
              || event.type === ExecutionEventEnum.FLOW_FAILED
              || event.type === ExecutionEventEnum.FLOW_CANCELLED
            ) {
              break
            }
          }
        } finally {
          unsubscribe()
        }
      } finally {
        await eventQueue.close()
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
