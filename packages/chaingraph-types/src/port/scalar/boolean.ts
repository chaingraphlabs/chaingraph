import type { BooleanPortConfig, IPort } from '@chaingraph/types/port'
import { PortBase } from '@chaingraph/types/port'

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

  async validate(): Promise<boolean> {
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
}
