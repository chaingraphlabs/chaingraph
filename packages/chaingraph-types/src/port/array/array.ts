import type { IPort, PortConfig, PortType, PortValue } from '@chaingraph/types/port'
import type {
  ArrayPortValue,
  UnwrapArrayPortValue,
} from '@chaingraph/types/port/types/port-values'
import type { ArrayPortConfig } from './types'
import { ComplexPortType, PortFactory } from '@chaingraph/types/port'

export class ArrayPort<T extends PortType> implements IPort<ComplexPortType.Array> {
  readonly config: PortConfig<ComplexPortType.Array>
  private values: UnwrapArrayPortValue<T> = []
  private portCache = new Map<number, IPort<T>>()
  private readonly elementType: T
  private readonly elementConfig: PortConfig<T>

  constructor(config: ArrayPortConfig<T>) {
    this.config = config
    this.elementType = config.element.type
    this.elementConfig = config.element.config
    this.values = (config.defaultValue ?? []) as UnwrapArrayPortValue<T>
  }

  get value(): ArrayPortValue<T> {
    return this.values as ArrayPortValue<T>
  }

  getValue(): ArrayPortValue<T> {
    return this.values as ArrayPortValue<T>
  }

  setValue(value: ArrayPortValue<T>): void {
    if (!Array.isArray(value)) {
      throw new TypeError('ArrayPort expects array value')
    }
    this.values = [...value] as UnwrapArrayPortValue<T>
    this.clearPortCache()
  }

  reset(): void {
    this.values = (this.config.defaultValue ?? []) as ArrayPortValue<T>
    this.clearPortCache()
  }

  hasValue(): boolean {
    return this.values.length > 0
  }

  clone(): IPort<ComplexPortType.Array> {
    return new ArrayPort<T>({
      id: this.config.id,
      name: this.config.name,
      type: ComplexPortType.Array,
      defaultValue: [...this.values] as ArrayPortValue<T>,
      validation: this.config.validation,
      metadata: this.config.metadata,
      element: {
        type: this.elementType,
        config: this.elementConfig,
      },
    })
  }

  async validate(): Promise<boolean> {
    if (!Array.isArray(this.values)) {
      return false
    }

    if (this.config.validation?.validator) {
      return this.config.validation.validator(this.values as ArrayPortValue<T>)
    }

    return true
  }

  get length(): number {
    return this.values.length
  }

  getPort(index: number): IPort<T> | undefined {
    if (index < 0 || index >= this.values.length) {
      return undefined
    }

    let port = this.portCache.get(index)
    if (!port) {
      port = this.createElementPort(index)
      this.portCache.set(index, port)
    }

    return port
  }

  push(value: PortValue<T>): number {
    return this.values.push(value)
  }

  pop(): PortValue<T> | undefined {
    const value = this.values.pop()
    if (value !== undefined) {
      this.portCache.delete(this.values.length)
    }
    return value
  }

  private createElementPort(index: number): IPort<T> {
    const port = PortFactory.create<T>(
      this.elementType,
      {
        id: `${this.config.id}_${index}`,
        name: `${this.config.name}[${index}]`,
        defaultValue: this.values[index],
      },
    )
    return port
  }

  private clearPortCache(): void {
    this.portCache.clear()
  }
}
