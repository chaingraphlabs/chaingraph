import type { Serializable, SerializedData } from '../serialization/serializer'
import { z } from 'zod'
import { VERSION } from '../config/constants'

/**
 * Schema for MultiChannel serialization
 */
export const MultiChannelSchema = z.object({
  buffer: z.array(z.unknown()),
  isClosed: z.boolean(),
  version: z.number(),
})

/**
 * Type for serialized MultiChannel data
 */
export type MultiChannelData = z.infer<typeof MultiChannelSchema>

/**
 * A channel that can have multiple subscribers and supports serialization
 */
export class MultiChannel<T> implements Serializable {
  private static readonly CURRENT_VERSION = VERSION.INITIAL
  private buffer: T[] = []
  private isClosed = false
  private subscribers: Set<Subscriber<T>> = new Set()

  /**
   * Send a single value to the channel
   */
  public send(value: T): void {
    if (this.isClosed) {
      throw new Error('Cannot send to a closed channel.')
    }
    this.buffer.push(value)
    for (const subscriber of this.subscribers) {
      subscriber.notify()
    }
  }

  /**
   * Send multiple values to the channel
   */
  public sendBatch(values: T[]): void {
    if (this.isClosed) {
      throw new Error('Cannot send to a closed channel.')
    }
    this.buffer.push(...values)
    for (const subscriber of this.subscribers) {
      subscriber.notify()
    }
  }

  /**
   * Close the channel
   */
  public close(): void {
    if (!this.isClosed) {
      this.isClosed = true
      for (const subscriber of this.subscribers) {
        subscriber.notify()
      }
    }
  }

  /**
   * Make the channel async iterable
   */
  public [Symbol.asyncIterator](): AsyncIterator<T> & AsyncIterable<T> {
    const subscriber = new Subscriber<T>(this)
    this.subscribers.add(subscriber)
    return subscriber
  }

  /**
   * Remove a subscriber from the channel
   */
  public removeSubscriber(subscriber: Subscriber<T>): void {
    this.subscribers.delete(subscriber)
  }

  // Getter methods for internal state
  public getSubscriberCount(): number {
    return this.subscribers.size
  }

  public isChannelClosed(): boolean {
    return this.isClosed
  }

  public getBuffer(): T[] {
    return this.buffer
  }

  /**
   * Serialize the channel state
   */
  public serialize(): SerializedData {
    return {
      __type: 'MultiChannel',
      __version: MultiChannel.CURRENT_VERSION,
      __data: {
        buffer: this.getBuffer(),
        isClosed: this.isChannelClosed(),
        version: MultiChannel.CURRENT_VERSION,
      },
    }
  }

  /**
   * Deserialize a channel from serialized data
   */
  public static deserialize<T>(data: SerializedData): MultiChannel<T> {
    const parsed = MultiChannelSchema.parse(data.__data)
    const channel = new MultiChannel<T>()

    // Apply migrations if needed
    if (parsed.version < MultiChannel.CURRENT_VERSION) {
      // Migration logic would go here
      // For now, we just have the initial version
    }

    if (parsed.buffer.length > 0) {
      channel.sendBatch(parsed.buffer as T[])
    }
    if (parsed.isClosed) {
      channel.close()
    }

    return channel
  }
}

/**
 * Subscriber class for handling async iteration
 */
class Subscriber<T> implements AsyncIterator<T>, AsyncIterable<T> {
  private channel: MultiChannel<T>
  private position: number = 0
  private resolve: (() => void) | null = null
  private isDone = false

  constructor(channel: MultiChannel<T>) {
    this.channel = channel
  }

  public [Symbol.asyncIterator](): AsyncIterator<T> {
    return this
  }

  public async next(): Promise<IteratorResult<T>> {
    if (this.isDone) {
      return { value: undefined, done: true }
    }

    while (true) {
      const buffer = this.channel.getBuffer()
      if (this.position < buffer.length) {
        const value = buffer[this.position++]
        return { value, done: false }
      } else if (this.channel.isChannelClosed()) {
        this.isDone = true
        this.channel.removeSubscriber(this)
        return { value: undefined, done: true }
      } else {
        await new Promise<void>((resolve) => {
          this.resolve = resolve
        })
        if (this.isDone) {
          return { value: undefined, done: true }
        }
      }
    }
  }

  public async return(): Promise<IteratorResult<T>> {
    this.isDone = true
    this.channel.removeSubscriber(this)
    if (this.resolve) {
      const resolve = this.resolve
      this.resolve = null
      resolve()
    }
    return { value: undefined, done: true }
  }

  public async throw(error?: any): Promise<IteratorResult<T>> {
    this.isDone = true
    this.channel.removeSubscriber(this)
    if (this.resolve) {
      const resolve = this.resolve
      this.resolve = null
      resolve()
    }
    throw error
  }

  public notify(): void {
    if (this.resolve) {
      const resolve = this.resolve
      this.resolve = null
      resolve()
    }
  }
}
