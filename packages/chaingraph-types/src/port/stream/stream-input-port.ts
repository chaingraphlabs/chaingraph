import type {
  StreamInputPortConfig,
} from '@chaingraph/types/port/types/port-config'
import type { JSONValue } from 'superjson/dist/types'
import type { MultiChannel } from '../channel/multi-channel'
import type { IPort } from '../types/port-interface'
import { PortFactory } from '@chaingraph/types/port'
import { registerPort } from '@chaingraph/types/port/registry/port-registry'
import { PortBase } from '@chaingraph/types/port/types/port-base'
import { PortDirectionEnum } from '@chaingraph/types/port/types/port-direction'
import { PortKindEnum } from '@chaingraph/types/port/types/port-kind-enum'
import superjson from 'superjson'

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

  validate(): boolean {
    // Implement any validation logic here
    return true
  }

  clone(): IPort<StreamInputPortConfig<T>> {
    return new StreamInputPort({ ...this.config })
  }

  static isStreamInputPortConfig<T>(config: any): config is StreamInputPortConfig<T> {
    return config.kind === PortKindEnum.StreamInput
  }

  deserialize(v: JSONValue): IPort<StreamInputPortConfig<T>> {
    if (!v || typeof v !== 'object' || !('config' in v)) {
      throw new Error('StreamOutputPortConfig deserialization failed. Invalid input, expected object with "config" key.')
    }

    const port = PortFactory.create((v.config as any) as StreamInputPortConfig<T>)

    const value = ('value' in v && v.value) ? v.value : null
    if (value && typeof value === 'object' && 'type' in value && value.type === 'MultiChannel') {
      const chan = superjson.deserialize({
        json: value,
        meta: { values: [['custom', 'MultiChannel']] },
      })

      port.setValue(chan as never)
    }

    return port
  }

  serialize(v: IPort<StreamInputPortConfig<T>>): JSONValue {
    return {
      config: superjson.serialize(v.config).json,
      value: v.getValue() ? superjson.serialize(v.getValue()).json : null,
    }
  }
}
