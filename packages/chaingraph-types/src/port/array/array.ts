import type { IPort, PortConfig, PortType, PortValue } from '@chaingraph/types/port'
import type { ArrayPortConfig } from './types'
import { ComplexPortType, PortFactory } from '@chaingraph/types/port'
import { Decimal } from 'decimal.js'

/**
 * Implementation of array port
 */
export class ArrayPort<T extends PortType> implements IPort<ComplexPortType.Array> {
  // Split into two properties to satisfy both the interface and maintain type safety
  readonly config: PortConfig<ComplexPortType.Array>
  private readonly arrayConfig: ArrayPortConfig<T>
  private _values: Array<PortValue<T>>

  constructor(config: ArrayPortConfig<T>) {
    // Create base config for IPort interface
    this.config = {
      id: config.id,
      name: config.name,
      type: ComplexPortType.Array,
    }

    // Store full array config
    this.arrayConfig = {
      ...config,
      type: ComplexPortType.Array,
    }

    this._values = config.defaultValue ?? []
  }

  get value(): Array<PortValue<T>> {
    return [...this._values]
  }

  getValue(): Array<PortValue<T>> {
    return [...this._values]
  }

  setValue(values: Array<PortValue<T>>): void {
    if (!Array.isArray(values)) {
      throw new TypeError('ArrayPort expects array value')
    }

    // Validate individual elements if elementConfig exists
    if (this.arrayConfig.elementConfig) {
      values.forEach(value => this.validateElement(value))
    }

    this._values = [...values]
  }

  async validate(): Promise<boolean> {
    const validation = this.arrayConfig.validation

    if (!validation) {
      return true
    }

    // Check custom validator if exists
    if (validation.validator) {
      const isValid = await validation.validator(this._values)
      if (!isValid)
        return false
    }

    // Validate each element if elementConfig exists
    if (this.arrayConfig.elementConfig) {
      try {
        await Promise.all(this._values.map(value => this.validateElement(value)))
        return true
      } catch {
        return false
      }
    }

    return true
  }

  reset(): void {
    this._values = this.arrayConfig.defaultValue ?? []
  }

  hasValue(): boolean {
    return this._values.length > 0
  }

  clone(): IPort<ComplexPortType.Array> {
    return new ArrayPort({
      ...this.arrayConfig,
      defaultValue: [...this._values],
    })
  }

  // Array-specific operations
  push(value: PortValue<T>): void {
    this.validateElement(value)
    this._values.push(value)
  }

  pop(): PortValue<T> | undefined {
    return this._values.pop()
  }

  insert(index: number, value: PortValue<T>): void {
    this.validateElement(value)
    this._values.splice(index, 0, value)
  }

  remove(index: number): void {
    this._values.splice(index, 1)
  }

  get(index: number): PortValue<T> | undefined {
    return this._values[index]
  }

  get length(): number {
    return this._values.length
  }

  clear(): void {
    this._values = []
  }

  private validateElement(value: PortValue<T>): void {
    if (!this.arrayConfig.elementConfig)
      return

    // Handle primitive types validation
    if (typeof value === 'string' || typeof value === 'boolean' || value instanceof Decimal) {
      const tempPort = PortFactory.createPort({
        ...this.arrayConfig.elementConfig,
        id: `${this.arrayConfig.id}-element`,
        type: this.arrayConfig.elementType,
      })

      tempPort.setValue(value)
      if (!tempPort.validate()) {
        throw new Error(`Invalid array element: ${value}`)
      }
      return
    }

    // Handle complex types (arrays, objects)
    if (Array.isArray(value) || typeof value === 'object') {
      // Additional validation logic for complex types could be added here
      return
    }

    throw new Error(`Unsupported element type: ${typeof value}`)
  }
}
