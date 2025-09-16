/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

interface Subscriber<T> {
  id: string
  position: number
  handler: (event: T) => void | Promise<void>
  onError?: (error: Error) => void
  onComplete?: () => void | Promise<void>
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
  private isClosing: boolean = false

  constructor(maxBufferSize: number = 1000) {
    this.maxBufferSize = maxBufferSize
  }

  subscribe(
    handler: (event: T) => void | Promise<void>,
    onError?: (error: Error) => void,
    onComplete?: () => void | Promise<void>,
  ): () => void {
    if (this.isClosed || this.isClosing) {
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
      onComplete,
      processing: false,
    }

    this.subscribers.set(id, subscriber)

    this.processSubscriberEvents(subscriber).catch((error) => {
      if (onError)
        onError(error as Error)
    })

    return () => {
      this.subscribers.delete(id)
    }
  }

  async publish(event: T): Promise<void> {
    if (this.isClosed) {
      console.warn('Attempted to publish to closed EventQueue - event dropped')
      return Promise.resolve()
    }

    if (this.isClosing) {
      // During closing, we can still accept events but log for debugging
      console.debug('Publishing to closing EventQueue - event will be processed')
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
          const res = subscriber.handler(event)
          if (res instanceof Promise) {
            await res
          }
        } catch (error) {
          if (subscriber.onError) {
            subscriber.onError(error as Error)
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

    if (this.isClosing) {
      return this.closingPromise || Promise.resolve()
    }

    // Step 1: Mark as closing (not closed yet!) - this prevents new subscriptions
    // but allows pending publishes to complete
    this.isClosing = true

    const promises: Promise<void>[] = []

    // Step 2: Process remaining events for all subscribers
    for (const subscriber of this.subscribers.values()) {
      promises.push(this.processSubscriberEvents(subscriber))
    }

    // Step 3: Execute close handlers
    for (const handler of this.closeHandlers) {
      promises.push(Promise.resolve(handler()))
    }

    // Step 4: Create closing promise that waits for everything
    this.closingPromise = Promise.all(promises).then(async () => {
      // Step 5: Wait for all subscribers to acknowledge completion
      // Give subscribers time to process their local buffers
      const subscriberCompletions: Promise<void>[] = []

      for (const subscriber of this.subscribers.values()) {
        // Instead of sending error, send a completion signal
        if (subscriber.onComplete) {
          subscriberCompletions.push(Promise.resolve(subscriber.onComplete()))
        }
      }

      await Promise.all(subscriberCompletions)

      // Step 6: NOW we can mark as fully closed and clear resources
      this.isClosed = true
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
  let rejectNext: ((reason?: Error) => void) | null = null
  let done = false

  let unsubscribe: () => void

  const eventQueue: T[] = []
  let ended = false // Indicates if the queue has been closed

  const onComplete = async () => {
    // Graceful completion - no error!
    ended = true

    // Drain any remaining events in local buffer
    if (eventQueue.length === 0 && resolveNext) {
      done = true
      resolveNext({ value: undefined, done: true })
      resolveNext = null
    }
  }

  const onError = (error: Error) => {
    // Only treat actual errors as errors, not queue closure
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
    onComplete,
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
