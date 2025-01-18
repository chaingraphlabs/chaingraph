import type { FlowEvent } from '@chaingraph/types/flow/events'
import { zAsyncIterable } from '@chaingraph/backend/procedures/subscriptions/utils/zAsyncIterable'
import { publicProcedure } from '@chaingraph/backend/trpc'
import { FlowEventType, newEvent } from '@chaingraph/types/flow/events'
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

    let eventIndex = Number(lastEventId) || 0
    const eventQueue = new EventQueue<FlowEvent>(100)

    try {
      // Send initial state events
      // 1. Metadata
      yield tracked(String(eventIndex++), newEvent(eventIndex, flowId, FlowEventType.MetadataUpdated, {
        oldMetadata: undefined,
        newMetadata: flow.metadata,
      }))

      // 2. Existing nodes
      for (const node of flow.nodes.values()) {
        yield tracked(String(eventIndex++), newEvent(eventIndex, flowId, FlowEventType.NodeAdded, { node }))
      }

      // 3. Existing edges
      for (const edge of flow.edges.values()) {
        yield tracked(String(eventIndex++), newEvent(eventIndex, flowId, FlowEventType.EdgeAdded, { edge }))
      }

      // Subscribe to future events
      const unsubscribe = flow.onEvent((event) => {
        // Filter by event types if specified
        if (eventTypes && !eventTypes.includes(event.type)) {
          return
        }
        eventQueue.publish(event)
      })

      try {
        const iterator = createQueueIterator(eventQueue)
        for await (const event of iterator) {
          yield tracked(String(eventIndex++), event)
        }
      } finally {
        unsubscribe()
      }
    } finally {
      await eventQueue.close()
    }
  })
