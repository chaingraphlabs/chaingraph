import type {
  ArrayPortConfig,
  IPort,
  PortConfig,
  PortValueFromConfig,
} from '../types'
import { PortFactory, registerPort } from '../registry'
import { PortBase, PortKind } from '../types'

@registerPort<ArrayPortConfig<any>>(PortKind.Array)
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
    const newValue = [] as Array<PortValueFromConfig<E>>
    for (const val of value) {
      element.setValue(val as never)
      newValue.push(element.getValue())
    }

    this.value = newValue
  }

  validate(): boolean {
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
    return config.kind === PortKind.Array
  }
}
