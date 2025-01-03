import type { IPort, PortConfig, PortValidation } from '..'

/**
 * Extended validation rules for string ports
 */
export interface StringPortValidation extends PortValidation {
  /** Minimum length constraint */
  minLength?: number

  /** Maximum length constraint */
  maxLength?: number

  /** Regular expression pattern */
  pattern?: RegExp
}

/**
 * Configuration specific to string ports
 */
export interface StringPortConfig extends Omit<PortConfig, 'type' | 'validation'> {
  type: 'string'
  defaultValue?: string
  validation?: StringPortValidation
}

/**
 * Implementation of string port
 */
export class StringPort implements IPort<string> {
  readonly config: PortConfig

  private _value: string

  constructor(config: StringPortConfig) {
    // Convert StringPortConfig to PortConfig to maintain compatibility
    this.config = {
      ...config,
      validation: config.validation as PortValidation,
    }
    this._value = config.defaultValue ?? ''
  }

  get value(): string {
    return this._value
  }

  getValue(): string {
    return this._value
  }

  setValue(value: string): void {
    this._value = value
  }

  async validate(): Promise<boolean> {
    const validation = this.config.validation as StringPortValidation | undefined

    if (!validation) {
      return true
    }

    // Run custom validator if provided
    if (validation.validator) {
      const isValid = await validation.validator(this._value)
      if (!isValid)
        return false
    }

    // Check length constraints
    if (validation.minLength !== undefined && this._value.length < validation.minLength) {
      return false
    }

    if (validation.maxLength !== undefined && this._value.length > validation.maxLength) {
      return false
    }

    // Check pattern
    if (validation.pattern && !validation.pattern.test(this._value)) {
      return false
    }

    return true
  }

  reset(): void {
    this._value = (this.config.defaultValue as string) ?? ''
  }

  hasValue(): boolean {
    return this._value !== ''
  }

  clone(): IPort<string> {
    return new StringPort(this.config as StringPortConfig)
  }
}
