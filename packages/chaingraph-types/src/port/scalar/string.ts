import type { IPort, StringPortConfig } from '../types'
import { PortBase } from '../types'

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
