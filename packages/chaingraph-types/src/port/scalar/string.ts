import type { IPort } from '@chaingraph/types/port'
import type { StringPortConfig } from '@chaingraph/types/port/types/port-config'
import { registerPort } from '@chaingraph/types/port/registry/port-registry'
import { PortBase } from '@chaingraph/types/port/types/port-base'
import { PortKind } from '@chaingraph/types/port/types/port-kind'

@registerPort<StringPortConfig>(PortKind.String)
export class StringPort extends PortBase<StringPortConfig> {
  readonly config: StringPortConfig
  value: string

  constructor(config: StringPortConfig) {
    super()
    this.config = config
    this.value = config.defaultValue ?? ''
  }

  getValue(): string {
    return this.value
  }

  setValue(value: string): void {
    this.value = value
  }

  validate(): boolean {
    // Implement your validation logic here
    return true
  }

  reset(): void {
    this.value = this.config.defaultValue ?? ''
  }

  hasValue(): boolean {
    return this.value !== ''
  }

  clone(): IPort<StringPortConfig> {
    return new StringPort({ ...this.config, defaultValue: this.value })
  }

  static isStringPortConfig(config: any): config is StringPortConfig {
    return config.kind === PortKind.String
  }
}
