import type { ObjectPortValueFromSchema, ObjectSchema } from '@chaingraph/types/port'
import type { ObjectPortConfig } from '@chaingraph/types/port/types/port-config'
import type { IPort } from '@chaingraph/types/port/types/port-interface'
import { PortBase } from '@chaingraph/types/port/types/port-base'

export class ObjectPort<S extends ObjectSchema> extends PortBase<ObjectPortConfig<S>> {
  readonly config: ObjectPortConfig<S>
  value: ObjectPortValueFromSchema<S>

  constructor(config: ObjectPortConfig<S>) {
    super()
    this.config = config
    this.value = config.defaultValue || {} as ObjectPortValueFromSchema<S>
  }

  getValue(): ObjectPortValueFromSchema<S> {
    return this.value
  }

  setValue(value: ObjectPortValueFromSchema<S>): void {
    this.value = value
  }

  async validate(): Promise<boolean> {
    // Implement your validation logic here, possibly validating each property
    return true
  }

  reset(): void {
    this.value = this.config.defaultValue || {} as ObjectPortValueFromSchema<S>
  }

  hasValue(): boolean {
    return Object.keys(this.value).length > 0
  }

  clone(): IPort<ObjectPortConfig<S>> {
    return new ObjectPort({ ...this.config, defaultValue: this.value })
  }
}
