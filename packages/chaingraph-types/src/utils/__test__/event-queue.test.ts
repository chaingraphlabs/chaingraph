import { createQueueIterator, EventQueue } from '@chaingraph/types/utils/event-queue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Define a test event interface
interface TestEvent {
  type: string
}

describe('eventQueue', () => {
  let queue: EventQueue<TestEvent>

  beforeEach(() => {
    // Initialize a new EventQueue before each test
    queue = new EventQueue<TestEvent>()
  })

  it('should allow subscribers to receive published events', async () => {
    const events: TestEvent[] = [
      { type: 'event1' },
      { type: 'event2' },
      { type: 'event3' },
    ]
    const receivedEvents: TestEvent[] = []

    // Subscribe to the queue
    const unsubscribe = queue.subscribe((event) => {
      receivedEvents.push(event)
    })

    // Publish events
    for (const event of events) {
      await queue.publish(event)
    }

    // Wait a short time to ensure events are processed
    await new Promise(resolve => setTimeout(resolve, 10))

    // Verify that the subscriber received all events
    expect(receivedEvents).toEqual(events)

    // Cleanup
    unsubscribe()
  })

  it('should allow multiple subscribers to receive events', async () => {
    const events: TestEvent[] = [
      { type: 'event1' },
      { type: 'event2' },
    ]
    const receivedEvents1: TestEvent[] = []
    const receivedEvents2: TestEvent[] = []

    // Subscribe to the queue with two subscribers
    const unsubscribe1 = queue.subscribe((event) => {
      receivedEvents1.push(event)
    })

    const unsubscribe2 = queue.subscribe((event) => {
      receivedEvents2.push(event)
    })

    // Publish events
    for (const event of events) {
      await queue.publish(event)
    }

    // Wait to ensure events are processed
    await new Promise(resolve => setTimeout(resolve, 10))

    // Verify that both subscribers received all events
    expect(receivedEvents1).toEqual(events)
    expect(receivedEvents2).toEqual(events)

    // Cleanup
    unsubscribe1()
    unsubscribe2()
  })

  it('should not send events to unsubscribed subscribers', async () => {
    const events: TestEvent[] = [
      { type: 'event1' },
      { type: 'event2' },
      { type: 'event3' },
    ]
    const receivedEvents: TestEvent[] = []

    // Subscribe to the queue
    const unsubscribe = queue.subscribe((event) => {
      receivedEvents.push(event)
    })

    // Publish the first event
    await queue.publish(events[0])

    // Unsubscribe
    unsubscribe()

    // Publish the remaining events
    await queue.publish(events[1])
    await queue.publish(events[2])

    // Wait to ensure events are processed
    await new Promise(resolve => setTimeout(resolve, 10))

    // Verify that the subscriber only received the first event
    expect(receivedEvents).toEqual([events[0]])
  })

  it('should allow publishing events before subscribing', async () => {
    const events: TestEvent[] = [
      { type: 'event1' },
      { type: 'event2' },
    ]
    const receivedEvents: TestEvent[] = []

    // Publish events before subscribing
    for (const event of events) {
      await queue.publish(event)
    }

    // Subscribe to the queue
    queue.subscribe((event) => {
      receivedEvents.push(event)
    })

    // Publish another event
    await queue.publish({ type: 'event3' })

    // Wait to ensure events are processed
    await new Promise(resolve => setTimeout(resolve, 10))

    // Verify that the subscriber only received events published after subscribing
    expect(receivedEvents).toEqual([{ type: 'event3' }])
  })

  // TODO: consider to enable throwing error when publishing to a closed queue, for now it's disabled
  // it('should prevent publishing events after the queue is closed', async () => {
  //   // Close the queue
  //   await queue.close()
  //
  //   // Attempt to publish an event
  //   await expect(queue.publish({ type: 'event1' })).rejects.toThrowError('Cannot publish to a closed EventQueue.')
  // })

  it('should notify subscribers when the queue is closed', async () => {
    const onErrorMock = vi.fn()

    // Subscribe to the queue
    queue.subscribe(
      (event) => {
        // Do nothing
      },
      (error) => {
        onErrorMock(error)
      },
    )

    // Close the queue
    await queue.close()

    // Wait to ensure onError is called
    await new Promise(resolve => setTimeout(resolve, 10))

    // Verify that the subscriber's onError was called with the correct error
    expect(onErrorMock).toHaveBeenCalledTimes(1)
    expect(onErrorMock.mock.calls[0][0].message).toBe('EventQueue is closed.')
  })

  it('should allow subscribers to finish processing events before closing', async () => {
    const events: TestEvent[] = [
      { type: 'event1' },
      { type: 'event2' },
      { type: 'event3' },
    ]
    const receivedEvents: TestEvent[] = []

    // Subscribe to the queue
    queue.subscribe((event) => {
      receivedEvents.push(event)
    })

    // Publish events
    for (const event of events) {
      await queue.publish(event)
    }

    // Close the queue
    await queue.close()

    // Wait to ensure events are processed
    await new Promise(resolve => setTimeout(resolve, 10))

    // Verify that the subscriber received all events
    expect(receivedEvents).toEqual(events)
  })

  it('should handle subscribers missing events due to buffer cleanup', async () => {
    const receivedEvents: TestEvent[] = []
    const onErrorMock = vi.fn()

    // Set a small maxBufferSize for the test
    queue = new EventQueue<TestEvent>(2) // Max buffer size is 2

    // Subscribe with a slow handler
    queue.subscribe(
      async (event) => {
        // Simulate slow processing
        await new Promise(resolve => setTimeout(resolve, 50))
        receivedEvents.push(event)
      },
      (error) => {
        onErrorMock(error)
      },
    )

    // Publish events faster than subscriber can process them
    for (let i = 1; i <= 5; i++) {
      queue.publish({ type: `event${i}` })
      // Wait a short time before publishing the next event
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    // Wait to ensure onError is called
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify that onError was called due to missing events
    expect(onErrorMock).toHaveBeenCalledTimes(1)
    expect(onErrorMock.mock.calls[0][0].message).toBe('Subscriber missed events and has been unsubscribed.')

    // The subscriber may have processed some events before missing events
    expect(receivedEvents.length).toBeLessThan(5)
  }, { timeout: 10000 })

  it('should allow creating an async iterator and receive events', async () => {
    const events: TestEvent[] = [
      { type: 'event1' },
      { type: 'event2' },
      { type: 'event3' },
    ]
    const receivedEvents: TestEvent[] = []

    // Create an iterator
    const iterator = createQueueIterator(queue)

    // Publish events
    for (const event of events) {
      await queue.publish(event)
    }

    // Close the queue
    await queue.close()

    // Consume events from the iterator
    for await (const event of iterator) {
      receivedEvents.push(event)
    }

    // Verify that all events were received
    expect(receivedEvents).toEqual(events)
  })

  it('should allow the async iterator to handle queue closure gracefully', async () => {
    const events: TestEvent[] = [
      { type: 'event1' },
      { type: 'event2' },
    ]
    const receivedEvents: TestEvent[] = []

    // Create an iterator
    const iterator = createQueueIterator(queue)

    // Publish events
    for (const event of events) {
      await queue.publish(event)
    }

    // Close the queue
    await queue.close()

    // Consume events from the iterator
    for await (const event of iterator) {
      receivedEvents.push(event)
    }

    // Verify that all events were received
    expect(receivedEvents).toEqual(events)
  })

  it('should handle publishing events during iteration', async () => {
    const events: TestEvent[] = []
    const receivedEvents: TestEvent[] = []

    // Create an iterator
    const iterator = createQueueIterator(queue)

    // Function to publish events asynchronously
    const publishEvents = async () => {
      for (let i = 1; i <= 5; i++) {
        const event = { type: `event${i}` }
        events.push(event)
        await queue.publish(event)
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      // Close the queue after publishing all events
      await queue.close()
    }

    // Start publishing events
    publishEvents()

    // Consume events from the iterator
    for await (const event of iterator) {
      receivedEvents.push(event)
    }

    // Verify that all events were received
    expect(receivedEvents).toEqual(events)
  })

  it('should handle subscriber errors gracefully', async () => {
    const events: TestEvent[] = [
      { type: 'event1' },
      { type: 'error' }, // This event will cause an error
      { type: 'event3' },
    ]
    const receivedEvents: TestEvent[] = []

    // Subscribe with a handler that throws an error on a specific event
    const onErrorMock = vi.fn()
    queue.subscribe(
      async (event) => {
        if (event.type === 'error') {
          throw new Error('Test error')
        }
        receivedEvents.push(event)
      },
      onErrorMock,
    )

    // Publish events
    for (const event of events) {
      await queue.publish(event)
    }

    // Wait to ensure events are processed
    await new Promise(resolve => setTimeout(resolve, 10))

    // Verify that subscriber received events and errors are handled
    expect(receivedEvents).toEqual([{ type: 'event1' }, { type: 'event3' }])
    // The error should not cause onError to be called, as it's handled internally
    expect(onErrorMock).not.toHaveBeenCalled()
  })

  it('should support unsubscribing within the event handler', async () => {
    const events: TestEvent[] = [
      { type: 'event1' },
      { type: 'event2' },
      { type: 'event3' },
    ]
    const receivedEvents: TestEvent[] = []

    // Subscribe and unsubscribe after the first event is received
    const unsubscribe = queue.subscribe((event) => {
      receivedEvents.push(event)
      if (event.type === 'event1' && unsubscribe) {
        unsubscribe()
      }
    })

    // Publish events
    for (const event of events) {
      await queue.publish(event)
    }

    // Wait to ensure events are processed
    await new Promise(resolve => setTimeout(resolve, 10))

    // Verify that only the first event was received
    expect(receivedEvents).toEqual([{ type: 'event1' }])
  })

  it('should properly handle AbortSignal in createQueueIterator', async () => {
    const events: TestEvent[] = []
    const receivedEvents: TestEvent[] = []

    // Create an AbortController
    const controller = new AbortController()
    const { signal } = controller

    // Create an iterator with the AbortSignal
    const iterator = createQueueIterator(queue, signal)

    // Function to publish events asynchronously
    const publishEvents = async () => {
      for (let i = 1; i <= 3; i++) {
        const event = { type: `event${i}` }
        events.push(event)
        await queue.publish(event)
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      // Close the queue after publishing all events
      await queue.close()
    }

    // Start publishing events
    publishEvents()

    // Consume events from the iterator
    for await (const event of iterator) {
      receivedEvents.push(event)
    }

    // Verify that only the first 3 events were received
    expect(receivedEvents).toEqual(events.slice(0, 3))
  })

  it('should throw an error when subscribing to a closed queue', async () => {
    // Close the queue
    await queue.close()

    const onErrorMock = vi.fn()

    // Attempt to subscribe
    const unsubscribe = queue.subscribe(
      (event) => {
        // Should not be called
      },
      (error) => {
        onErrorMock(error)
      },
    )

    // Wait to ensure onError is called
    await new Promise(resolve => setTimeout(resolve, 10))

    // Verify that onError was called with the correct error
    expect(onErrorMock).toHaveBeenCalledTimes(1)
    expect(onErrorMock.mock.calls[0][0].message).toBe('EventQueue is closed.')

    // Unsubscribe to clean up
    unsubscribe()
  })

  it('should handle subscribers that throw unhandled exceptions', async () => {
    const onErrorMock = vi.fn()

    // Subscribe with a handler that throws an unhandled exception
    queue.subscribe(
      (event) => {
        throw new Error('Unhandled exception')
      },
      (error) => {
        // Should not be called
        onErrorMock(error)
      },
    )

    // Publish an event
    await queue.publish({ type: 'event1' })

    // Wait to ensure event is processed
    await new Promise(resolve => setTimeout(resolve, 10))

    // Verify that onError was not called
    expect(onErrorMock).not.toHaveBeenCalled()
  })

  it('should not accept new subscribers after the queue is closed', async () => {
    // Close the queue
    await queue.close()

    const onErrorMock = vi.fn()

    // Attempt to subscribe after closure
    const unsubscribe = queue.subscribe(
      (event) => {
        // Should not be called
      },
      (error) => {
        onErrorMock(error)
      },
    )

    // Wait to ensure onError is called
    await new Promise(resolve => setTimeout(resolve, 10))

    // Verify that onError was called
    expect(onErrorMock).toHaveBeenCalledTimes(1)
    expect(onErrorMock.mock.calls[0][0].message).toBe('EventQueue is closed.')

    // Unsubscribe to clean up
    unsubscribe()
  })

  it('should allow subscribers to catch up if they process events quickly enough', async () => {
    const events: TestEvent[] = []
    const receivedEvents: TestEvent[] = []

    // Publish events rapidly
    for (let i = 1; i <= 5; i++) {
      events.push({ type: `event${i}` })
      await queue.publish({ type: `event${i}` })
    }

    // Subscriber that processes events quickly
    queue.subscribe((event) => {
      receivedEvents.push(event)
    })

    // Publish more events
    for (let i = 6; i <= 10; i++) {
      events.push({ type: `event${i}` })
      await queue.publish({ type: `event${i}` })
    }

    // Close the queue
    await queue.close()

    // Wait to ensure events are processed
    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify that subscriber received events from the point of subscription onward
    expect(receivedEvents).toEqual(events.slice(5)) // Received events from event6 to event10
  })
})
