export class MultiChannel<T> {
  private buffer: T[] = []
  private isClosed = false
  private subscribers: Set<Subscriber<T>> = new Set()

  send(value: T): void {
    if (this.isClosed) {
      throw new Error('Cannot send to a closed channel.')
    }
    this.buffer.push(value)
    for (const subscriber of this.subscribers) {
      subscriber.notify()
    }
  }

  close(): void {
    if (!this.isClosed) {
      this.isClosed = true
      for (const subscriber of this.subscribers) {
        subscriber.notify()
      }
    }
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    const subscriber = new Subscriber<T>(this)
    this.subscribers.add(subscriber)
    return subscriber
  }

  removeSubscriber(subscriber: Subscriber<T>): void {
    this.subscribers.delete(subscriber)
  }

  // Getter methods to access private properties for testing
  public getSubscriberCount(): number {
    return this.subscribers.size
  }

  public isChannelClosed(): boolean {
    return this.isClosed
  }

  public getBuffer(): T[] {
    return this.buffer
  }
}

class Subscriber<T> implements AsyncIterableIterator<T> {
  private channel: MultiChannel<T>
  private position: number = 0
  private resolve: (() => void) | null = null
  private isDone = false

  constructor(channel: MultiChannel<T>) {
    this.channel = channel
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this
  }

  async next(): Promise<IteratorResult<T>> {
    if (this.isDone) {
      return { value: undefined as any, done: true }
    }

    while (true) {
      const buffer = this.channel.getBuffer()
      if (this.position < buffer.length) {
        const value = buffer[this.position++]
        return { value, done: false }
      } else if (this.channel.isChannelClosed()) {
        this.isDone = true
        this.channel.removeSubscriber(this)
        return { value: undefined as any, done: true }
      } else {
        await new Promise<void>((resolve) => {
          this.resolve = resolve
        })
        if (this.isDone) {
          return { value: undefined as any, done: true }
        }
        // After being notified, the loop will check for new data
      }
    }
  }

  async return(): Promise<IteratorResult<T>> {
    // Clean up when the iterator is closed early (e.g., via break)
    this.isDone = true
    this.channel.removeSubscriber(this)
    if (this.resolve) {
      const resolve = this.resolve
      this.resolve = null
      resolve()
    }
    return { value: undefined as any, done: true }
  }

  notify(): void {
    if (this.resolve) {
      const resolve = this.resolve
      this.resolve = null
      resolve() // Resolve the pending promise to proceed in next()
    }
  }
}
