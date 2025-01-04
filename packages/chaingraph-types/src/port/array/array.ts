import type {
  IPort,
  PortConfig,
  PortType,
  PortValue,
} from '@chaingraph/types/port'
import type { ArrayType } from '@chaingraph/types/port/types/port-types'
import type { ArrayPortValue } from '@chaingraph/types/port/types/port-values'
import { PortFactory } from '../factory'

export interface ArrayPortValidation<T extends PortType> {
  validator?: (value: ArrayPortValue<T>) => boolean | Promise<boolean>
  errorMessage?: string
}

export interface ArrayPortConfig<T extends PortType> {
  /** Base port configuration */
  portConfig: Omit<PortConfig<ArrayType<T>>, 'validation'> & {
    validation?: ArrayPortValidation<T>
  }
  /** Array type configuration */
  arrayType: ArrayType<T>
  /** Default array value */
  defaultValue?: ArrayPortValue<T>
}

export class ArrayPort<T extends PortType> implements IPort<ArrayType<T>> {
  readonly config: PortConfig<ArrayType<T>>
  private values: ArrayPortValue<T>
  private portCache = new Map<number, IPort<T>>()
  private readonly arrayType: ArrayType<T>

  constructor(config: ArrayPortConfig<T>) {
    this.config = config.portConfig
    this.arrayType = config.arrayType
    this.values = config.defaultValue ?? []
  }

  get value(): PortValue<ArrayType<T>> {
    return this.values as PortValue<ArrayType<T>>
  }

  getValue(): PortValue<ArrayType<T>> {
    return this.values as PortValue<ArrayType<T>>
  }

  setValue(value: PortValue<ArrayType<T>>): void {
    if (!Array.isArray(value)) {
      throw new TypeError('ArrayPort expects array value')
    }
    this.values = [...value]
    this.clearPortCache()
  }

  reset(): void {
    this.values = (this.config.defaultValue ?? []) as PortValue<ArrayType<T>>
    this.clearPortCache()
  }

  hasValue(): boolean {
    return this.values.length > 0
  }

  clone(): IPort<ArrayType<T>> {
    return new ArrayPort<T>({
      portConfig: {
        ...this.config,
        type: this.arrayType,
        validation: this.config.validation as ArrayPortValidation<T>,
      },
      arrayType: this.arrayType,
      defaultValue: [...this.values],
    })
  }

  async validate(): Promise<boolean> {
    if (!Array.isArray(this.values)) {
      return false
    }

    if (this.config.validation && this.isArrayPortValidation(this.config.validation)) {
      return this.config.validation.validator?.(this.values) ?? true
    }

    return true
  }

  // Array-specific methods
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
    return PortFactory.create(
      this.arrayType.elementType,
      {
        id: `${this.config.id}_${index}`,
        name: `${this.config.name}[${index}]`,
        defaultValue: this.values[index],
      },
    )
  }

  private clearPortCache(): void {
    this.portCache.clear()
  }

  private isArrayPortValidation(
    validation: unknown,
  ): validation is ArrayPortValidation<T> {
    return (
      validation !== null
      && typeof validation === 'object'
      && ('validator' in validation || 'errorMessage' in validation)
      && (
        !('validator' in validation)
        || typeof validation.validator === 'function'
      )
    )
  }
}
