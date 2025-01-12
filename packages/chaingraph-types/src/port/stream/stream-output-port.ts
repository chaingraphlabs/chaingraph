import type {
  StreamInputPortConfig,
  StreamOutputPortConfig,
} from '@chaingraph/types/port/types/port-config'
import type { IPort } from '@chaingraph/types/port/types/port-interface'
import type { JSONValue } from 'superjson/dist/types'
import { MultiChannel, PortFactory } from '@chaingraph/types/port'
import { registerPort } from '@chaingraph/types/port/registry/port-registry'
import { PortBase } from '@chaingraph/types/port/types/port-base'

import { PortDirectionEnum } from '@chaingraph/types/port/types/port-direction'
import { PortKindEnum } from '@chaingraph/types/port/types/port-kind-enum'
import superjson from 'superjson'

@registerPort<StreamOutputPortConfig<any>>(PortKindEnum.StreamOutput)
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

  setValue(value: MultiChannel<T>): void {
    this.value = value
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

  validate(): boolean {
    // Implement any validation logic here
    return true
  }

  clone(): IPort<StreamOutputPortConfig<T>> {
    return new StreamOutputPort({ ...this.config })
  }

  static isStreamOutputPortConfig<T>(config: any): config is StreamInputPortConfig<T> {
    return config.kind === PortKindEnum.StreamOutput
  }

  deserialize(v: JSONValue): IPort<StreamOutputPortConfig<T>> {
    if (!v || typeof v !== 'object' || !('config' in v)) {
      throw new Error('StreamOutputPortConfig deserialization failed. Invalid input, expected object with "config" key.')
    }

    const port = PortFactory.create((v.config as any) as StreamOutputPortConfig<T>)

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

  serialize(v: IPort<StreamOutputPortConfig<T>>): JSONValue {
    return {
      config: superjson.serialize(v.config).json,
      value: v.getValue() ? superjson.serialize(v.getValue()).json : null,
    }
  }
}
