import type {
  PortValue,
} from '@chaingraph/types/port.new2/newnewnew/zod-port-values'
import type { JSONSerializable, JSONValue } from '../json'
import {
  PortValueUnionSchema,
} from '@chaingraph/types/port.new2/newnewnew/zod-port-values'
import { z } from 'zod'

/**
 * Schema for MultiChannel serialization
 */
export const MultiChannelSchema = z.object({
  buffer: z.array(PortValueUnionSchema),
  isClosed: z.boolean(),
})

/**
 * Type for serialized MultiChannel data
 */
export type MultiChannelData = z.infer<typeof MultiChannelSchema>

/**
 * A channel that can have multiple subscribers and supports serialization.
 * It now implements JSONSerializable so that it integrates with our system.
 */
export class MultiChannel<T extends PortValue> implements JSONSerializable<MultiChannel<T>> {
  private buffer: T[] = []
  private isClosed = false
  private subscribers: Set<Subscriber<T>> = new Set()

  // Existing send, sendBatch, close, etc.

  public send(value: T): void {
    if (this.isClosed) {
      throw new Error('Cannot send to a closed channel.')
    }
    this.buffer.push(value)
    for (const subscriber of this.subscribers) {
      subscriber.notify()
    }
  }

  public sendBatch(values: T[]): void {
    if (this.isClosed) {
      throw new Error('Cannot send to a closed channel.')
    }
    this.buffer.push(...values)
    for (const subscriber of this.subscribers) {
      subscriber.notify()
    }
  }

  public close(): void {
    if (!this.isClosed) {
      this.isClosed = true
      for (const subscriber of this.subscribers) {
        subscriber.notify()
      }
    }
  }

  public [Symbol.asyncIterator](): AsyncIterator<T> & AsyncIterable<T> {
    const subscriber = new Subscriber<T>(this)
    this.subscribers.add(subscriber)
    return subscriber
  }

  public removeSubscriber(subscriber: Subscriber<T>): void {
    this.subscribers.delete(subscriber)
  }

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
   * Serialize the channel state.
   */
  public serialize(): JSONValue {
    return {
      buffer: this.getBuffer(),
      isClosed: this.isChannelClosed(),
    } as MultiChannelData
  }

  /**
   * Instance deserialize method.
   * For JSONSerializable, we add an instance-level method that simply calls the static method.
   */
  public deserialize(value: JSONValue): MultiChannel<T> {
    return MultiChannel.deserialize(value)
  }

  /**
   * Deserialize a channel from serialized data.
   */
  public static deserialize<T>(data: JSONValue): MultiChannel<T> {
    const parsed = MultiChannelSchema.parse(data)
    const channel = new MultiChannel<T>()
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
      this.resolve()
      this.resolve = null
    }
    return { value: undefined, done: true }
  }

  public async throw(error?: any): Promise<IteratorResult<T>> {
    this.isDone = true
    this.channel.removeSubscriber(this)
    if (this.resolve) {
      this.resolve()
      this.resolve = null
    }
    throw error
  }

  public notify(): void {
    if (this.resolve) {
      const r = this.resolve
      this.resolve = null
      r()
    }
  }
}
