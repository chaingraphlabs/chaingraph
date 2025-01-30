interface Subscriber<T> {
  id: string
  position: number
  handler: (event: T) => void | Promise<void>
  onError?: (error: any) => void
  processing: boolean
}

export class EventQueue<T> {
  private readonly buffer: T[] = []
  private readonly subscribers: Map<string, Subscriber<T>> = new Map()
  private closeHandlers: Array<() => void | Promise<void>> = []
  private readonly maxBufferSize: number
  private currentPosition: number = 0
  private closingPromise: Promise<void> | null = null
  private isClosed: boolean = false

  constructor(maxBufferSize: number = 1000) {
    this.maxBufferSize = maxBufferSize
  }

  subscribe(
    handler: (event: T) => void | Promise<void>,
    onError?: (error: any) => void,
  ): () => void {
    if (this.isClosed) {
      if (onError) {
        onError(new Error('EventQueue is closed.'))
      }
      return () => {}
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

    this.processSubscriberEvents(subscriber).catch((error) => {
      if (onError)
        onError(error)
    })

    return () => {
      this.subscribers.delete(id)
    }
  }

  async publish(event: T): Promise<void> {
    if (this.isClosed) {
      return Promise.resolve()
    }

    this.buffer.push(event)
    this.currentPosition++

    const promises: Promise<void>[] = []

    for (const subscriber of this.subscribers.values()) {
      if (!subscriber.processing) {
        promises.push(this.processSubscriberEvents(subscriber))
      }
    }

    // Cleanup buffer if it's too large
    if (this.buffer.length > this.maxBufferSize) {
      this.cleanupBuffer()
    }

    // Wait for all subscribers to process the event
    return Promise.all(promises).then(() => {})
  }

  private async processSubscriberEvents(subscriber: Subscriber<T>): Promise<void> {
    if (subscriber.processing)
      return

    subscriber.processing = true
    try {
      while (subscriber.position < this.currentPosition) {
        const firstPositionInBuffer = this.currentPosition - this.buffer.length

        if (subscriber.position < firstPositionInBuffer) {
          const error = new Error('Subscriber missed events and has been unsubscribed.')
          if (subscriber.onError) {
            subscriber.onError(error)
          }
          this.subscribers.delete(subscriber.id)
          return
        }

        const bufferIndex = subscriber.position - firstPositionInBuffer
        const event = this.buffer[bufferIndex]

        try {
          await subscriber.handler(event)
        } catch (error) {
          if (subscriber.onError) {
            subscriber.onError(error)
          }
        }
        subscriber.position++
      }
    } finally {
      subscriber.processing = false
    }
  }

  private cleanupBuffer(): void {
    let minPosition = this.currentPosition
    for (const subscriber of this.subscribers.values()) {
      minPosition = Math.min(minPosition, subscriber.position)
    }

    const firstPositionInBuffer = this.currentPosition - this.buffer.length
    const eventsToRemove = minPosition - firstPositionInBuffer

    if (eventsToRemove > 0) {
      this.buffer.splice(0, eventsToRemove)
    }

    if (this.buffer.length > this.maxBufferSize) {
      const removeCount = this.buffer.length - this.maxBufferSize
      this.buffer.splice(0, removeCount)
    }
  }

  async close(): Promise<void> {
    if (this.isClosed) {
      return this.closingPromise || Promise.resolve()
    }

    this.isClosed = true

    const promises: Promise<void>[] = []

    // Process remaining events for subscribers
    for (const subscriber of this.subscribers.values()) {
      promises.push(this.processSubscriberEvents(subscriber))
    }

    // Execute close handlers
    for (const handler of this.closeHandlers) {
      promises.push(Promise.resolve(handler()))
    }

    this.closingPromise = Promise.all(promises).then(() => {
      // Notify subscribers about closure
      for (const subscriber of this.subscribers.values()) {
        if (subscriber.onError) {
          subscriber.onError(new Error('EventQueue is closed.'))
        }
      }

      // Clear everything
      this.subscribers.clear()
      this.buffer.length = 0
      this.closeHandlers = []
    })

    return this.closingPromise
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

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

  createIterator(signal?: AbortSignal): AsyncIterableIterator<T> {
    return createQueueIterator(this, signal)
  }

  /**
   * Register a handler to be called when the queue is closed
   * @param handler Function to be called on queue close
   * @returns Function to unregister the handler
   */
  onClose(handler: () => void | Promise<void>): () => void {
    this.closeHandlers.push(handler)
    return () => {
      const index = this.closeHandlers.indexOf(handler)
      if (index !== -1) {
        this.closeHandlers.splice(index, 1)
      }
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
