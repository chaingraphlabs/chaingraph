/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

interface QueueResolver<T> {
  resolve: (value: T | null) => void
  signal?: AbortSignal
  abortHandler?: () => void
}

export class AsyncQueue<T> {
  private readonly _queue: T[] = []
  private readonly _resolvers: QueueResolver<T>[] = []
  private _closed = false

  /**
   * Adds an item to the queue.
   * If there are waiting consumers, the item is immediately delivered.
   * Otherwise, it's added to the queue.
   *
   * @throws Error if this queue is closed.
   */
  enqueue(item: T): void {
    if (this._closed)
      throw new Error('Queue is closed')

    if (this._resolvers.length > 0) {
      // Find first non-aborted resolver
      const index = this._resolvers.findIndex(r => !r.signal?.aborted)
      if (index !== -1) {
        const { resolve } = this._resolvers[index]
        this._resolvers.splice(index, 1)
        resolve(item)
        return
      }
    }
    this._queue.push(item)
  }

  /**
   * Dequeues an item from the queue.
   * If the queue is empty, waits for an item to be enqueued.
   * @param signal Optional AbortSignal to cancel the wait
   */
  async dequeue(signal?: AbortSignal): Promise<T | null> {
    // Check if already aborted
    if (signal?.aborted)
      return null

    // If we have items, return immediately
    if (this._queue.length > 0) {
      return this._queue.shift()!
    }

    // If queue is closed, return null
    if (this._closed) {
      return null
    }

    // Wait for new items
    return new Promise<T | null>((resolve) => {
      const resolver: QueueResolver<T> = {
        resolve,
        signal,
      }

      const abortHandler = () => {
        const index = this._resolvers.indexOf(resolver)
        if (index !== -1) {
          this._resolvers.splice(index, 1)
          resolve(null)
        }
        if (signal) {
          signal.removeEventListener('abort', abortHandler)
        }
      }

      resolver.abortHandler = abortHandler

      // Handle abort
      if (signal) {
        signal.addEventListener('abort', abortHandler, { once: true })
      }

      this._resolvers.push(resolver)
    })
  }

  /**
   * Closes the queue. All waiting consumers will receive null.
   * Future attempts to enqueue will throw an error.
   */
  close(): void {
    this._closed = true
    // Resolve all waiting consumers with null
    while (this._resolvers.length > 0) {
      const { resolve } = this._resolvers.shift()!
      resolve(null)
    }
    // Clear the queue
    this._queue.length = 0
  }

  /**
   * Returns true if the queue is empty.
   */
  isEmpty(): boolean {
    return this._queue.length === 0
  }

  /**
   * Returns true if the queue is closed.
   */
  isClosed(): boolean {
    return this._closed
  }

  /**
   * Returns the current size of the queue.
   */
  size(): number {
    return this._queue.length
  }

  /**
   * Returns the number of waiting consumers.
   */
  waitingConsumers(): number {
    return this._resolvers.length
  }

  /**
   * Tries to dequeue an item immediately without waiting.
   * Returns null if the queue is empty.
   */
  tryDequeue(): T | null {
    if (this._queue.length > 0) {
      return this._queue.shift()!
    }
    return null
  }

  /**
   * Clears all items from the queue.
   */
  clear(): void {
    this._queue.length = 0
  }

  /**
   * Returns an async iterator for the queue.
   */
  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    while (!this._closed) {
      const item = await this.dequeue()
      if (item === null)
        break
      yield item
    }
  }
}
