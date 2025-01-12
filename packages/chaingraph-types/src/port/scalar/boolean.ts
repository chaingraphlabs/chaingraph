import type { BooleanPortConfig } from '../types/port-config'
import type { IPort } from '../types/port-interface'
import { registerPort } from '@chaingraph/types/port/registry/port-registry'
import { PortBase } from '@chaingraph/types/port/types/port-base'
import { PortKindEnum } from '@chaingraph/types/port/types/port-kind-enum'

@registerPort<BooleanPortConfig>(PortKindEnum.Boolean)
export class BooleanPort extends PortBase<BooleanPortConfig> {
  readonly config: BooleanPortConfig
  value: boolean

  constructor(config: BooleanPortConfig) {
    super()
    this.config = config
    this.value = config.defaultValue ?? false
  }

  getValue(): boolean {
    return this.value
  }

  setValue(value: boolean): void {
    this.value = value
  }

  validate(): boolean {
    // Implement your validation logic here
    return true
  }

  reset(): void {
    this.value = this.config.defaultValue ?? false
  }

  hasValue(): boolean {
    return this.value !== false
  }

  clone(): IPort<BooleanPortConfig> {
    return new BooleanPort({ ...this.config, defaultValue: this.value })
  }

  static isBooleanPortConfig(config: any): config is BooleanPortConfig {
    return config.kind === PortKindEnum.Boolean
  }
}
