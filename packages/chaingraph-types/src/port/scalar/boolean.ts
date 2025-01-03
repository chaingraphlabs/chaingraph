import type { IPort, PortConfig, PortValidation } from '@chaingraph/types/port'
import type { PortValue } from '../types/port-values'
import { PrimitivePortType } from '../types/port-types'

/**
 * Validation rules specific to boolean ports
 * Note: Currently using base validation only,
 * but we can extend with boolean-specific rules if needed
 */
export interface BooleanPortValidation extends PortValidation<PrimitivePortType.Boolean> {}

/**
 * Configuration for boolean ports
 */
export interface BooleanPortConfig extends PortConfig<PrimitivePortType.Boolean> {
  validation?: BooleanPortValidation
}

/**
 * Implementation of boolean port
 */
export class BooleanPort implements IPort<PrimitivePortType.Boolean> {
  readonly config: PortConfig<PrimitivePortType.Boolean>
  private _value: boolean

  constructor(config: BooleanPortConfig) {
    this.config = {
      ...config,
      type: PrimitivePortType.Boolean,
    }
    this._value = config.defaultValue ?? false
  }

  get value(): boolean {
    return this._value
  }

  getValue(): PortValue<PrimitivePortType.Boolean> {
    return this._value
  }

  setValue(value: PortValue<PrimitivePortType.Boolean>): void {
    if (typeof value !== 'boolean') {
      throw new TypeError(`BooleanPort expects boolean value, got ${typeof value}`)
    }
    this._value = value
  }

  async validate(): Promise<boolean> {
    const validation = (this.config as BooleanPortConfig).validation
    if (!validation) {
      return true
    }

    // Check custom validator if exists
    if (validation.validator) {
      return validation.validator(this._value)
    }

    return true
  }

  reset(): void {
    this._value = this.config.defaultValue ?? false
  }

  hasValue(): boolean {
    return true // Boolean always has a value (true or false)
  }

  clone(): IPort<PrimitivePortType.Boolean> {
    return new BooleanPort({
      ...this.config,
      defaultValue: this._value,
    })
  }
}
