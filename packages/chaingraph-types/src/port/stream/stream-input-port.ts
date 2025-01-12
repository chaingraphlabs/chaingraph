import type { StreamInputPortConfig } from '@chaingraph/types/port/types/port-config'
import type { MultiChannel } from '../channel/multi-channel'
import type { IPort } from '../types/port-interface'
import { registerPort } from '@chaingraph/types/port/registry/port-registry'
import { PortBase } from '@chaingraph/types/port/types/port-base'
import { PortDirectionEnum } from '@chaingraph/types/port/types/port-direction'
import { PortKindEnum } from '@chaingraph/types/port/types/port-kind-enum'

@registerPort<StreamInputPortConfig<any>>(PortKindEnum.StreamInput)
export class StreamInputPort<T> extends PortBase<StreamInputPortConfig<T>> {
  readonly config: StreamInputPortConfig<T>
  value: MultiChannel<T> | null = null

  constructor(config: StreamInputPortConfig<T>) {
    super()
    if (config.direction !== PortDirectionEnum.Input) {
      throw new Error('StreamInputPort must have direction set to "input".')
    }

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

  static isStreamInputPortConfig<T>(config: any): config is StreamInputPortConfig<T> {
    return config.kind === PortKindEnum.StreamInput
  }
}
