import type { PortConfig } from '@chaingraph/types'
import type { PortValue, PortValueType } from '@chaingraph/types/port/values'
import type { IPort } from '../interface'
import type { ArrayPortConfig } from './types'
import { Decimal } from 'decimal.js'

export class ArrayPort<T extends PortValueType> implements IPort<PortValue<T>[]> {
  readonly config: PortConfig

  private values: PortValue<T>[] = []
  private portCache = new Map<number, IPort<PortValue<T>>>()
  private elementConfig: Omit<PortConfig, 'id' | 'name'>

  constructor(config: ArrayPortConfig<T>) {
    this.config = {
      ...config,
      type: 'array',
    }

    this.elementConfig = config.elementConfig
    this.values = config.defaultValue ?? []
  }

  get value(): PortValue<T>[] {
    return this.values
  }

  getValue(): PortValue<T>[] {
    return this.values
  }

  setValue(values: PortValue<T>[]): void {
    this.values = values
    // Clear cache as values have changed
    this.portCache.clear()
  }

  /**
   * Get a port instance for an element at the specified index
   */
  getElementPort(index: number): IPort<PortValue<T>> {
    if (!this.portCache.has(index)) {
      const elementId = this.generateElementId(index)
      const elementPort = this.createElementPort(elementId, index)
      this.portCache.set(index, elementPort)
    }
    return this.portCache.get(index)!
  }

  /**
   * Add a new value to the array
   */
  push(value: PortValue<T>): void {
    this.values.push(value)
  }

  /**
   * Remove and return the last value from the array
   */
  pop(): PortValue<T> | undefined {
    const value = this.values.pop()
    if (value !== undefined) {
      this.portCache.delete(this.values.length)
    }
    return value
  }

  async validate(): Promise<boolean> {
    // Validate each value according to element type
    for (const value of this.values) {
      if (!this.validateValue(value)) {
        return false
      }
    }
    return true
  }

  reset(): void {
    this.values = (this.config.defaultValue as PortValue<T>[]) ?? []
    this.portCache.clear()
  }

  hasValue(): boolean {
    return this.values.length > 0
  }

  clone(): IPort<PortValue<T>[]> {
    return new ArrayPort({
      ...(this.config as ArrayPortConfig<T>),
      defaultValue: [...this.values],
    })
  }

  private generateElementId(index: number): string {
    return `${this.config.id}.${index}`
  }

  private createElementPort(id: string, index: number): IPort<PortValue<T>> {
    // Implementation depends on element type
    // This is a placeholder that needs to be implemented based on element type
    throw new Error('Not implemented')
  }

  private validateValue(value: unknown): boolean {
    switch (this.elementConfig.type) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return value instanceof Decimal
      case 'boolean':
        return typeof value === 'boolean'
      case 'array':
        return Array.isArray(value)
      default:
        return false
    }
  }
}
