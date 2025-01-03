import type { IPort, PortConfig, PortValidation } from '..'
import { Decimal } from 'decimal.js'

/**
 * Extended validation rules for number ports
 */
export interface NumberPortValidation extends PortValidation {
  /** Minimum value constraint */
  min?: number | string | Decimal

  /** Maximum value constraint */
  max?: number | string | Decimal

  /** Whether to allow integer values only */
  integer?: boolean

  /** Number of decimal places allowed */
  precision?: number

  /** Whether to allow negative values */
  allowNegative?: boolean

  /** Whether to allow zero value */
  allowZero?: boolean
}

/**
 * Configuration specific to number ports
 */
export interface NumberPortConfig extends Omit<PortConfig, 'type' | 'validation' | 'defaultValue'> {
  type: 'number'
  defaultValue?: number | string | Decimal
  validation?: NumberPortValidation
}

/**
 * Implementation of number port using Decimal.js for precise calculations
 */
export class NumberPort implements IPort<Decimal> {
  readonly config: PortConfig

  private _value: Decimal

  constructor(config: NumberPortConfig) {
    // Convert NumberPortConfig to PortConfig while preserving type safety
    this.config = {
      ...config,
      validation: config.validation as PortValidation,
      defaultValue: config.defaultValue?.toString(), // Convert to string for safe storage
    }

    this._value = config.defaultValue
      ? new Decimal(config.defaultValue)
      : new Decimal(0)
  }

  get value(): Decimal {
    return this._value
  }

  getValue(): Decimal {
    return this._value
  }

  setValue(value: number | string | Decimal): void {
    this._value = new Decimal(value)
  }

  async validate(): Promise<boolean> {
    const validation = this.config.validation as NumberPortValidation | undefined

    if (!validation) {
      return true
    }

    // Run custom validator if provided
    if (validation.validator) {
      const isValid = await validation.validator(this._value)
      if (!isValid)
        return false
    }

    const value = this._value

    // Check if integer is required
    if (validation.integer && !value.isInteger()) {
      return false
    }

    // Check minimum value
    if (validation.min !== undefined && value.lessThan(validation.min)) {
      return false
    }

    // Check maximum value
    if (validation.max !== undefined && value.greaterThan(validation.max)) {
      return false
    }

    // Check precision
    if (validation.precision !== undefined) {
      const decimalPlaces = value.decimalPlaces()
      if (decimalPlaces > validation.precision) {
        return false
      }
    }

    // Check if negative values are allowed
    if (validation.allowNegative === false && value.isNegative()) {
      return false
    }

    // Check if zero is allowed
    if (validation.allowZero === false && value.isZero()) {
      return false
    }

    return true
  }

  reset(): void {
    if (this.config.defaultValue === undefined || this.config.defaultValue === null) {
      this._value = new Decimal(0)
      return
    }

    // Type guard for valid Decimal input types
    if (
      typeof this.config.defaultValue === 'number'
      || typeof this.config.defaultValue === 'string'
      || this.config.defaultValue instanceof Decimal
    ) {
      this._value = new Decimal(this.config.defaultValue)
    } else {
      // If defaultValue is of invalid type, fall back to 0
      this._value = new Decimal(0)
    }
  }

  hasValue(): boolean {
    return !this._value.isNaN()
  }

  clone(): IPort<Decimal> {
    return new NumberPort(this.config as NumberPortConfig)
  }

  /**
   * Helper methods for common numerical operations
   */

  add(value: number | string | Decimal): Decimal {
    return this._value.plus(value)
  }

  subtract(value: number | string | Decimal): Decimal {
    return this._value.minus(value)
  }

  multiply(value: number | string | Decimal): Decimal {
    return this._value.times(value)
  }

  divide(value: number | string | Decimal): Decimal {
    return this._value.dividedBy(value)
  }

  round(precision?: number): Decimal {
    return precision !== undefined
      ? this._value.toDecimalPlaces(precision)
      : this._value.round()
  }

  abs(): Decimal {
    return this._value.abs()
  }

  toString(): string {
    return this._value.toString()
  }

  toNumber(): number {
    return this._value.toNumber()
  }
}
