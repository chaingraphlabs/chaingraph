import type { PortConfig, PortValueFromConfig } from '@chaingraph/types/port/types/port-composite-types'
import type { ArrayPortConfig } from '@chaingraph/types/port/types/port-config'
import type { IPort } from '../types/port-interface'
import { PortFactory } from '@chaingraph/types/port/registry/port-factory'
import { registerPort } from '@chaingraph/types/port/registry/port-registry'
import { PortBase } from '@chaingraph/types/port/types/port-base'
import { PortKindEnum } from '@chaingraph/types/port/types/port-kind-enum'

@registerPort<ArrayPortConfig<any>>(PortKindEnum.Array)
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
    const element = PortFactory.create(this.config.elementConfig)

    // Set the value of the element and push it to the new value array
    // This is necessary to ensure that the value is properly validated
    const newValue = []
    for (const val of value) {
      element.setValue(val as never)
      newValue.push(element.getValue())
    }

    this.value = newValue
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

  static isArrayPortConfig<E extends PortConfig>(config: any): config is ArrayPortConfig<E> {
    return config.kind === PortKindEnum.Array
  }
}
