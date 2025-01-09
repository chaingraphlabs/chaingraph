import type { IPort, StreamOutputPortConfig } from '../types'
import { MultiChannel } from '../channel/multi-channel'
import { PortBase, PortDirectionEnum } from '../types'

export class StreamOutputPort<T> extends PortBase<StreamOutputPortConfig<T>> {
  readonly config: StreamOutputPortConfig<T>
  value: MultiChannel<T>

  constructor(config: StreamOutputPortConfig<T>) {
    super()

    if (config.direction !== PortDirectionEnum.Output) {
      throw new Error('StreamOutputPort must have direction set to "output".')
    }

    this.config = config
    this.value = new MultiChannel<T>()
  }

  getValue(): MultiChannel<T> {
    return this.value
  }

  setValue(): void {
    throw new Error('Cannot set value of StreamOutputPort.')
  }

  send(data: T): void {
    this.value.send(data)
  }

  close(): void {
    this.value.close()
  }

  hasValue(): boolean {
    return true
  }

  reset(): void {
    this.value = new MultiChannel<T>()
  }

  async validate(): Promise<boolean> {
    // Implement any validation logic here
    return true
  }

  clone(): IPort<StreamOutputPortConfig<T>> {
    return new StreamOutputPort({ ...this.config })
  }
}
