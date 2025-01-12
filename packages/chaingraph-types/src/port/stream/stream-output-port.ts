import type {
  StreamInputPortConfig,
  StreamOutputPortConfig,
} from '@chaingraph/types/port/types/port-config'
import type { IPort } from '@chaingraph/types/port/types/port-interface'
import { MultiChannel } from '@chaingraph/types/port'
import { registerPort } from '@chaingraph/types/port/registry/port-registry'
import { PortBase } from '@chaingraph/types/port/types/port-base'
import { PortDirectionEnum } from '@chaingraph/types/port/types/port-direction'
import { PortKindEnum } from '@chaingraph/types/port/types/port-kind-enum'

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

  static isStreamOutputPortConfig<T>(config: any): config is StreamInputPortConfig<T> {
    return config.kind === PortKindEnum.StreamOutput
  }
}
