import type { IPort, NumberPortConfig } from '@chaingraph/types/port'
import { PortBase } from '@chaingraph/types/port'
import Decimal from 'decimal.js'

export type NumberPortValue = number | string | Decimal

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

  async validate(): Promise<boolean> {
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
}
