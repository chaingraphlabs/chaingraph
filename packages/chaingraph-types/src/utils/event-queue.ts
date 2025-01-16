interface Subscriber<T> {
  id: string
  position: number
  handler: (event: T) => void | Promise<void>
  onError?: (error: any) => void
  processing: boolean // Flag to prevent re-entrancy
}

export class EventQueue<T> {
  private readonly buffer: T[] = []
  private readonly subscribers: Map<string, Subscriber<T>> = new Map()
  private readonly maxBufferSize: number
  private currentPosition: number = 0
  private closingPromise: Promise<void> | null = null
  private isClosed: boolean = false // Indicates whether the queue is closed

  constructor(maxBufferSize: number = 1000) {
    this.maxBufferSize = maxBufferSize
  }

  /**
   * Subscribe to events starting from the current position (only new events).
   * Returns an unsubscribe function.
   * @param handler - The function to handle incoming events.
   * @param onError - Optional function to handle errors, such as missed events or queue closure.
   */
  subscribe(
    handler: (event: T) => void | Promise<void>,
    onError?: (error: any) => void,
  ): () => void {
    if (this.isClosed) {
      // If the queue is already closed, immediately notify the subscriber
      if (onError) {
        onError(new Error('EventQueue is closed.'))
      }
      return () => {
        // No action needed; already closed
      }
    }

    const id = this.generateId()
    const subscriber: Subscriber<T> = {
      id,
      position: this.currentPosition,
      handler,
      onError,
      processing: false,
    }

    this.subscribers.set(id, subscriber)

    // Start processing events for this subscriber asynchronously
    this.processSubscriberEvents(subscriber)

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(id)
    }
  }

  /**
   * Publish a new event to the queue.
   * @param event - The event to publish.
   * @returns A Promise that resolves when all subscribers have processed the event.
   *
   * Note: Awaiting this Promise is optional. You may choose to await it if you need
   * to know when all subscribers have finished processing the event, for example,
   * in testing scenarios or when sequential processing is critical.
   * In most cases, especially in production code where performance is important,
   * you might not want to await this Promise to avoid blocking the publishing thread.
   */
  publish(event: T): Promise<void> {
    if (this.isClosed) {
      // Do not accept new events if the queue is closed
      return Promise.reject(new Error('Cannot publish to a closed EventQueue.'))
    }

    // Add to buffer
    this.buffer.push(event)
    this.currentPosition++

    // Prepare an array to collect subscriber processing promises
    const subscriberPromises: Promise<void>[] = []

    // Asynchronously notify subscribers
    this.subscribers.forEach((subscriber) => {
      subscriberPromises.push(
        this.processSubscriberEvents(subscriber),
      )
    })

    // Clean up old events if buffer is too large
    this.cleanupBuffer()

    // Return a Promise that resolves when all subscribers have processed the event
    return Promise.all(subscriberPromises).then(() => {})
  }

  /**
   * Clean up the buffer by removing events that have been processed by all subscribers.
   */
  private cleanupBuffer(): void {
    // Find the minimum position among subscribers
    let minPosition = this.currentPosition
    this.subscribers.forEach((subscriber) => {
      if (subscriber.position < minPosition) {
        minPosition = subscriber.position
      }
    })

    const firstPositionInBuffer = this.currentPosition - this.buffer.length
    const eventsToRemove = minPosition - firstPositionInBuffer

    if (eventsToRemove > 0) {
      this.buffer.splice(0, eventsToRemove)
    }

    // Enforce max buffer size
    if (this.buffer.length > this.maxBufferSize) {
      const removeCount = this.buffer.length - this.maxBufferSize
      this.buffer.splice(0, removeCount)
    }
  }

  /**
   * Process events for a specific subscriber.
   * @param subscriber - The subscriber to process events for.
   */
  private async processSubscriberEvents(subscriber: Subscriber<T>): Promise<void> {
    if (subscriber.processing) {
      // Already processing; prevent re-entrancy
      return
    }
    subscriber.processing = true

    try {
      while (subscriber.position < this.currentPosition) {
        const firstPositionInBuffer = this.currentPosition - this.buffer.length

        if (subscriber.position < firstPositionInBuffer) {
          // Subscriber is behind and has missed events
          // Notify subscriber and unsubscribe
          const error = new Error('Subscriber missed events and has been unsubscribed.')
          if (subscriber.onError) {
            subscriber.onError(error)
          }
          // Unsubscribe the subscriber
          this.subscribers.delete(subscriber.id)
          return
        }

        const bufferIndex = subscriber.position - firstPositionInBuffer
        const event = this.buffer[bufferIndex]

        try {
          await subscriber.handler(event)
        } catch (error) {
          // console.error(`Error processing event for subscriber ${subscriber.id}:`, error)
        }
        subscriber.position++
      }

      // Do not unsubscribe the subscriber here; allow them to stay subscribed
      // until `close` has notified them after processing all events
    } finally {
      subscriber.processing = false
    }
  }

  /**
   * Close the queue and notify all subscribers.
   * @returns A Promise that resolves when all subscribers have finished processing.
   */
  close(): Promise<void> {
    if (this.isClosed) {
      // Already closed; return existing closing promise or resolve immediately
      return this.closingPromise || Promise.resolve()
    }

    this.isClosed = true

    // Collect promises for subscriber processing
    const subscriberPromises: Promise<void>[] = []

    this.subscribers.forEach((subscriber) => {
      subscriberPromises.push(
        this.processSubscriberEvents(subscriber),
      )
    })

    // After all subscribers have processed events, notify them and clear subscribers
    this.closingPromise = Promise.all(subscriberPromises).then(() => {
      this.subscribers.forEach((subscriber) => {
        if (subscriber.onError) {
          subscriber.onError(new Error('EventQueue is closed.'))
        }
      })
      this.subscribers.clear()

      // Optional: Clear the buffer as well
      this.buffer.length = 0
    })

    return this.closingPromise
  }

  /**
   * Generate a unique identifier for subscribers.
   * @returns A unique string identifier.
   */
  private generateId(): string {
    // Simple ID generator (can be replaced with a more robust method)
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  /**
   * Get current queue statistics.
   * @returns An object containing statistics about the queue.
   */
  getStats() {
    return {
      bufferSize: this.buffer.length,
      subscriberCount: this.subscribers.size,
      currentPosition: this.currentPosition,
      isClosed: this.isClosed,
      subscribers: Array.from(this.subscribers.values()).map(s => ({
        id: s.id,
        position: s.position,
        behind: this.currentPosition - s.position,
      })),
    }
  }
}

// Helper for creating async iterators from the queue
export function createQueueIterator<T>(
  queue: EventQueue<T>,
  signal?: AbortSignal,
): AsyncIterableIterator<T> {
  let resolveNext: ((value: IteratorResult<T>) => void) | null = null
  let rejectNext: ((reason?: any) => void) | null = null
  let done = false

  let unsubscribe: () => void

  const eventQueue: T[] = []
  let ended = false // Indicates if the queue has been closed

  const onError = (error: any) => {
    if (error.message === 'EventQueue is closed.') {
      ended = true
      if (eventQueue.length === 0 && resolveNext) {
        done = true
        resolveNext({ value: undefined, done: true })
        resolveNext = null
      }
      // Don't unsubscribe here; let the iterator process all events
    } else {
      // Handle other errors
      done = true
      if (rejectNext) {
        rejectNext(error)
        rejectNext = null
      } else if (resolveNext) {
        resolveNext({ value: undefined, done: true })
        resolveNext = null
      }
      unsubscribe()
    }
  }

  unsubscribe = queue.subscribe(
    async (event) => {
      if (done) {
        return
      }
      if (resolveNext) {
        // If a consumer is waiting, deliver the event immediately
        resolveNext({ value: event, done: false })
        resolveNext = null
      } else {
        // Otherwise, queue the event
        eventQueue.push(event)
      }
    },
    onError,
  )

  if (signal) {
    signal.addEventListener('abort', () => {
      done = true
      if (resolveNext) {
        resolveNext({ value: undefined, done: true })
        resolveNext = null
      }
      unsubscribe()
    })
  }

  const iterator: AsyncIterableIterator<T> = {
    async next(): Promise<IteratorResult<T>> {
      if (done) {
        return { value: undefined, done: true }
      }
      if (eventQueue.length > 0) {
        // Return the next queued event
        const value = eventQueue.shift()!
        return { value, done: false }
      }
      if (ended) {
        // No more events will arrive; iterator is done
        done = true
        unsubscribe()
        return { value: undefined, done: true }
      }
      return new Promise<IteratorResult<T>>((resolve, reject) => {
        // Wait for next event
        resolveNext = resolve
        rejectNext = reject
      })
    },
    async return(): Promise<IteratorResult<T>> {
      done = true
      unsubscribe()
      return { value: undefined, done: true }
    },
    async throw(error): Promise<IteratorResult<T>> {
      done = true
      unsubscribe()
      return Promise.reject(error)
    },
    [Symbol.asyncIterator]() {
      return this
    },
  }

  return iterator
}
