import type { MultiChannel } from '../channel/multi-channel'
import type { IPort, StreamInputPortConfig } from '../types'

export class StreamInputPort<T> implements IPort<StreamInputPortConfig<T>> {
  readonly config: StreamInputPortConfig<T>
  value: MultiChannel<T> | null = null

  constructor(config: StreamInputPortConfig<T>) {
    this.config = config
  }

  getValue(): MultiChannel<T> | null {
    return this.value
  }

  setValue(value: MultiChannel<T> | null): void {
    this.value = value
  }

  async *receive(): AsyncIterableIterator<T> {
    if (!this.value) {
      throw new Error('No channel connected to StreamInputPort.')
    }
    for await (const data of this.value) {
      yield data
    }
  }

  hasValue(): boolean {
    return this.value !== null
  }

  reset(): void {
    this.value = null
  }

  async validate(): Promise<boolean> {
    // Implement any validation logic here
    return true
  }

  clone(): IPort<StreamInputPortConfig<T>> {
    return new StreamInputPort({ ...this.config })
  }
}
