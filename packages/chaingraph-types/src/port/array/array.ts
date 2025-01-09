import type {
  ArrayPortConfig,
  IPort,
  PortConfig,
  PortValueFromConfig,
} from '../types'
import { PortBase } from '../types'

export class ArrayPort<E extends PortConfig> extends PortBase<ArrayPortConfig<E>> {
  readonly config: ArrayPortConfig<E>
  value: Array<PortValueFromConfig<E>>

  constructor(config: ArrayPortConfig<E>) {
    super()
    this.config = config
    this.value = config.defaultValue ?? []
  }

  getValue(): Array<PortValueFromConfig<E>> {
    return this.value
  }

  setValue(value: Array<PortValueFromConfig<E>>): void {
    this.value = value
  }

  async validate(): Promise<boolean> {
    // Implement your validation logic here, possibly validating each element
    return true
  }

  reset(): void {
    this.value = this.config.defaultValue ?? []
  }

  hasValue(): boolean {
    return this.value.length > 0
  }

  clone(): IPort<ArrayPortConfig<E>> {
    return new ArrayPort({ ...this.config, defaultValue: this.value })
  }

  // createElementPort(): PortFromConfig<E> {
  //   return PortFactory.create(this.config.elementConfig)
  // }
}
