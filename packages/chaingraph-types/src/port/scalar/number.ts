import type { IPort, NumberPortConfig } from '@chaingraph/types/port'
import { PortBase } from '@chaingraph/types/port'

export class NumberPort extends PortBase<NumberPortConfig> {
  readonly config: NumberPortConfig
  value: number

  constructor(config: NumberPortConfig) {
    super()
    this.config = config
    this.value = config.defaultValue ?? 0
  }

  getValue(): number {
    return this.value
  }

  setValue(value: number): void {
    this.value = value
  }

  async validate(): Promise<boolean> {
    // Implement your validation logic here
    return true
  }

  reset(): void {
    this.value = this.config.defaultValue ?? 0
  }

  hasValue(): boolean {
    return this.value !== 0
  }

  clone(): IPort<NumberPortConfig> {
    return new NumberPort({ ...this.config, defaultValue: this.value })
  }
}
