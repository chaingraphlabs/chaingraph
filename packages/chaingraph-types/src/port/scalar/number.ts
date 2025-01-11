import type { JSONObject } from 'superjson/dist/types'
import type { IPort, NumberPortConfig } from '../types'
import Decimal from 'decimal.js'
import superjson from 'superjson'
import { isPortConfig, PortBase } from '../types'

export type NumberPortValue = number | string | Decimal

export class NumberPort extends PortBase<NumberPortConfig> {
  readonly className = 'NumberPort'
  readonly config: NumberPortConfig
  value: Decimal

  constructor(config: NumberPortConfig) {
    super()
    this.config = config
    this.value = new Decimal(config.defaultValue ?? 0)
  }

  deserialize(v: JSONObject): IPort<NumberPortConfig> {
    if (isPortConfig(v.config)) {
      throw new Error('Port config is missing')
    }

    port = new NumberPort(v.config)
  }

  serializePortConfig(config: NumberPortConfig): JSONObject {
    return {
      ...config,
      defaultValue: superjson.stringify(config.defaultValue),
      validation: superjson.stringify(config.validation),
      metadata: superjson.stringify(config.metadata),
    }
  }

  serialize(v: IPort<NumberPortConfig>): JSONObject {
    return {
      className: v.className,
      config: superjson.stringify({ ...v.config }),
      value: superjson.stringify(v.getValue()),
    }
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
