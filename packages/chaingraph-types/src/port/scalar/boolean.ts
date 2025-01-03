import type { IPort, PortConfig, PortValidation } from '..'

/**
 * Extended validation rules for boolean ports
 */
export interface BooleanPortValidation extends PortValidation {
  /**
   * Allow only specific boolean values
   * Useful when port should accept only true or only false
   */
  allowedValues?: boolean[]
}

/**
 * Configuration specific to boolean ports
 */
export interface BooleanPortConfig extends Omit<PortConfig, 'type' | 'validation' | 'defaultValue'> {
  type: 'boolean'
  defaultValue?: boolean
  validation?: BooleanPortValidation
}

/**
 * Implementation of boolean port
 */
export class BooleanPort implements IPort<boolean> {
  readonly config: PortConfig

  private _value: boolean

  constructor(config: BooleanPortConfig) {
    this.config = {
      ...config,
      validation: config.validation as PortValidation,
      defaultValue: config.defaultValue ?? false,
    }

    this._value = config.defaultValue ?? false
  }

  get value(): boolean {
    return this._value
  }

  getValue(): boolean {
    return this._value
  }

  setValue(value: boolean): void {
    if (typeof value !== 'boolean') {
      throw new TypeError('BooleanPort only accepts boolean values')
    }
    this._value = value
  }

  async validate(): Promise<boolean> {
    const validation = this.config.validation as BooleanPortValidation | undefined

    if (!validation) {
      return true
    }

    // Run custom validator if provided
    if (validation.validator) {
      const isValid = await validation.validator(this._value)
      if (!isValid)
        return false
    }

    // Check if value is in allowed values
    if (validation.allowedValues?.length) {
      return validation.allowedValues.includes(this._value)
    }

    return true
  }

  reset(): void {
    this._value = (this.config.defaultValue as boolean) ?? false
  }

  hasValue(): boolean {
    return true // Boolean always has a value (true or false)
  }

  clone(): IPort<boolean> {
    return new BooleanPort(this.config as BooleanPortConfig)
  }

  /**
   * Helper methods for boolean operations
   */

  /**
   * Toggle the boolean value
   */
  toggle(): boolean {
    this._value = !this._value
    return this._value
  }

  /**
   * Perform AND operation with another boolean
   */
  and(value: boolean): boolean {
    return this._value && value
  }

  /**
   * Perform OR operation with another boolean
   */
  or(value: boolean): boolean {
    return this._value || value
  }

  /**
   * Get the negation of the current value
   */
  not(): boolean {
    return !this._value
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return this._value.toString()
  }
}
