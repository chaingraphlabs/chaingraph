import type { FlowEvent } from '@chaingraph/types/flow/events'
import { zAsyncIterable } from '@chaingraph/backend/procedures/subscriptions/utils/zAsyncIterable'
import { publicProcedure } from '@chaingraph/backend/trpc'
import { FlowEventType } from '@chaingraph/types/flow/events'
import { createQueueIterator, EventQueue } from '@chaingraph/types/utils/event-queue'
import { tracked } from '@trpc/server'
import { z } from 'zod'

export const subscribeToEvents = publicProcedure
  .input(
    z.object({
      flowId: z.string(),
      eventTypes: z.array(z.nativeEnum(FlowEventType)).optional(),
      lastEventId: z.string().nullish(),
    }),
  )
  .output(
    zAsyncIterable({
      yield: z.custom<FlowEvent>(),
      tracked: true,
    }),
  )
  .subscription(async function* ({ input, ctx }) {
    const { flowId, eventTypes, lastEventId } = input
    const flow = await ctx.flowStore.getFlow(flowId)

    if (!flow) {
      throw new Error(`Flow with ID ${flowId} not found`)
    }

    const eventIndex = Number(lastEventId) || 0
    const eventQueue = new EventQueue<FlowEvent>(100)
    const unsubscribe = flow.onEvent((event) => {
      eventQueue.publish(event)
    })

    try {
      const iterator = createQueueIterator(eventQueue)

      for await (const event of iterator) {
        yield tracked(String(eventIndex), event)
      }
    } finally {
      unsubscribe()
      await eventQueue.close()
    }
  })
