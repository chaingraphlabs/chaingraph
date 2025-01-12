import type { StringPortConfig } from '@chaingraph/types/port/types/port-config'
import type { IPort } from '../types/port-interface'
import { PortBase } from '@chaingraph/types/port/types/port-base'

export class StringPort extends PortBase<StringPortConfig> {
  readonly className = 'StringPort'
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

  async validate(): Promise<boolean> {
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
}
