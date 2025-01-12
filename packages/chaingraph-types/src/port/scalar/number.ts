import type { NumberPortConfig } from '@chaingraph/types/port/types/port-config'
import type { NumberPortValue } from '@chaingraph/types/port/types/port-value'
import type { IPort } from '../types/port-interface'
import { registerPort } from '@chaingraph/types/port/registry/port-registry'
import { PortBase } from '@chaingraph/types/port/types/port-base'
import { PortKindEnum } from '@chaingraph/types/port/types/port-kind-enum'
import Decimal from 'decimal.js'

@registerPort<NumberPortConfig>(PortKindEnum.Number)
export class NumberPort extends PortBase<NumberPortConfig> {
  readonly config: NumberPortConfig
  value: Decimal

  constructor(config: NumberPortConfig) {
    super()
    this.config = config
    this.value = new Decimal(config.defaultValue ?? 0)
  }

  getValue(): Decimal {
    return this.value
  }

  setValue(value: NumberPortValue): void {
    this.value = new Decimal(value)
  }

  validate(): boolean {
    // Implement your validation logic here
    return true
  }

  reset(): void {
    this.value = new Decimal(this.config.defaultValue ?? 0)
  }

  hasValue(): boolean {
    return this.value !== undefined && this.value !== null && !this.value.isNaN()
  }

  clone(): IPort<NumberPortConfig> {
    return new NumberPort({ ...this.config, defaultValue: new Decimal(this.value) })
  }

  static isNumberPortConfig(config: any): config is NumberPortConfig {
    return config.kind === PortKindEnum.Number
  }
}
