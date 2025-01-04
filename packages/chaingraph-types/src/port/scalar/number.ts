import type { IPort, PortConfig, PortValidation } from '../types/port-interface'
import type { PortValue } from '../types/port-values'
import { Decimal } from 'decimal.js'
import { PortTypeEnum } from '../types/port-types'

/**
 * Validation rules specific to number ports
 */
export interface NumberPortValidation extends PortValidation<PortTypeEnum.Number> {
  min?: number | Decimal
  max?: number | Decimal
  integer?: boolean
  precision?: number
}

/**
 * Configuration for number ports
 */
export interface NumberPortConfig extends PortConfig<PortTypeEnum.Number> {
  validation?: NumberPortValidation
}

/**
 * Implementation of number port using Decimal.js
 */
export class NumberPort implements IPort<PortTypeEnum.Number> {
  readonly config: PortConfig<PortTypeEnum.Number>
  private _value: Decimal

  constructor(config: NumberPortConfig) {
    this.config = {
      ...config,
      type: PortTypeEnum.Number,
    }
    this._value = this.toDecimal(config.defaultValue ?? 0)
  }

  get value(): Decimal {
    return this._value
  }

  getValue(): PortValue<PortTypeEnum.Number> {
    return this._value
  }

  setValue(value: PortValue<PortTypeEnum.Number>): void {
    if (!(value instanceof Decimal)) {
      throw new TypeError('NumberPort only accepts Decimal values')
    }
    this._value = value
  }

  async validate(): Promise<boolean> {
    const validation = (this.config as NumberPortConfig).validation
    if (!validation) {
      return true
    }

    // Check custom validator first if exists
    if (validation.validator) {
      const isValid = await validation.validator(this._value)
      if (!isValid)
        return false
    }

    const { min, max, integer, precision } = validation

    // Check integer constraint
    if (integer && !this._value.isInteger()) {
      return false
    }

    // Check minimum value
    if (min !== undefined) {
      const minDecimal = this.toDecimal(min)
      if (this._value.lessThan(minDecimal)) {
        return false
      }
    }

    // Check maximum value
    if (max !== undefined) {
      const maxDecimal = this.toDecimal(max)
      if (this._value.greaterThan(maxDecimal)) {
        return false
      }
    }

    // Check precision
    if (precision !== undefined && precision >= 0) {
      const decimalPlaces = this._value.decimalPlaces()
      if (decimalPlaces > precision) {
        return false
      }
    }

    return true
  }

  reset(): void {
    this._value = this.toDecimal(this.config.defaultValue ?? 0)
  }

  hasValue(): boolean {
    return !this._value.isNaN()
  }

  clone(): IPort<PortTypeEnum.Number> {
    return new NumberPort({
      ...this.config,
      defaultValue: this._value,
    })
  }

  private toDecimal(value: number | string | Decimal): Decimal {
    if (value instanceof Decimal) {
      return value
    }
    return new Decimal(value)
  }
}
