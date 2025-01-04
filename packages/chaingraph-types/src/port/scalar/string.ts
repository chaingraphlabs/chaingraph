import type { IPort, PortConfig, PortValidation } from '@chaingraph/types/port'
import type { PortValue } from '../types/port-values'
import { PortTypeEnum } from '../types/port-types'

/**
 * String port validation options
 */
export interface StringPortValidation extends PortValidation<PortTypeEnum.String> {
  minLength?: number
  maxLength?: number
}

/**
 * String port configuration
 */
export interface StringPortConfig extends PortConfig<PortTypeEnum.String> {
  validation?: StringPortValidation
}

/**
 * String port implementation
 */
export class StringPort implements IPort<PortTypeEnum.String> {
  readonly config: PortConfig<PortTypeEnum.String>
  private _value: string

  constructor(config: StringPortConfig) {
    this.config = {
      ...config,
      type: PortTypeEnum.String,
    }
    this._value = config.defaultValue ?? ''
  }

  get value(): string {
    return this._value
  }

  getValue(): PortValue<PortTypeEnum.String> {
    return this._value
  }

  setValue(value: PortValue<PortTypeEnum.String>): void {
    if (typeof value !== 'string') {
      throw new TypeError(`StringPort expects string value, got ${typeof value}`)
    }
    this._value = value
  }

  async validate(): Promise<boolean> {
    const validation = (this.config as StringPortConfig).validation

    if (!validation) {
      return true
    }

    // Check custom validator first if exists
    if (validation.validator) {
      const isValid = await validation.validator(this._value)
      if (!isValid)
        return false
    }

    const { minLength, maxLength } = validation

    if (minLength && minLength > 0 && this._value.length < minLength) {
      return false
    }

    if (maxLength && maxLength > 0 && this._value.length > maxLength) {
      return false
    }

    return true
  }

  reset(): void {
    this._value = this.config.defaultValue ?? ''
  }

  hasValue(): boolean {
    return this._value !== ''
  }

  clone(): IPort<PortTypeEnum.String> {
    return new StringPort({
      ...this.config,
      defaultValue: this._value,
    })
  }
}
