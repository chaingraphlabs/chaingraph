import type { IPort } from '@chaingraph/types/port'
import type { NumberPortConfig } from '@chaingraph/types/port/types/port-config'
import type { NumberPortValue } from '@chaingraph/types/port/types/port-value'
import { registerPort } from '@chaingraph/types/port/registry/port-registry'
import { PortBase } from '@chaingraph/types/port/types/port-base'
import { PortKind } from '@chaingraph/types/port/types/port-kind'
import Decimal from 'decimal.js'

export type NumberPortReturnType<T extends Decimal | number> = T extends Decimal
  ? Decimal
  : number

@registerPort<NumberPortConfig>(PortKind.Number)
export class NumberPort<D extends Decimal | number = Decimal> extends PortBase<NumberPortConfig> {
  readonly config: NumberPortConfig
  value: Decimal

  constructor(config: NumberPortConfig) {
    super()
    this.config = config
    this.value = new Decimal(config.defaultValue ?? 0)
  }

  getValue(): NumberPortReturnType<D> {
    if (!this.config.isNumber) {
      return this.value as NumberPortReturnType<D>
    }

    return this.value.toNumber() as NumberPortReturnType<D>
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
    return config.kind === PortKind.Number
  }
}
