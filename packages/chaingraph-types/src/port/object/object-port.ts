import type {
  IPort,
  ObjectPortConfig,
  ObjectPortValueFromSchema,
  ObjectSchema,
} from '@chaingraph/types/port'
import {
  PortBase,
} from '@chaingraph/types/port'

export class ObjectPort<S extends ObjectSchema> extends PortBase<ObjectPortConfig<S>> {
  readonly config: ObjectPortConfig<S>
  value: ObjectPortValueFromSchema<S>

  constructor(config: ObjectPortConfig<S>) {
    super()
    this.config = config
    this.value = config.defaultValue || {} as ObjectPortValueFromSchema<S>
  }

  // private initializeValue(): ObjectPortValueFromSchema<S> {
  //   const value: any = {}
  //   for (const key in this.config.schema.properties) {
  //     const propertyConfig = this.config.schema.properties[key]
  //     value[key] = propertyConfig.defaultValue
  //   }
  //   return value
  // }

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
