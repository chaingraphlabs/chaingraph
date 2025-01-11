import type { JSONObject } from 'superjson/dist/types'
import type { IPort, StringPortConfig } from '../types'
import { undefined } from 'zod'
import { PortBase } from '../types'

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

  deserialize(v: JSONObject): IPort<StringPortConfig> {
    return undefined
  }

  serialize(v: IPort<StringPortConfig>): JSONObject {
    return undefined
  }
}
