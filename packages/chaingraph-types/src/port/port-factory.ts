import type { ObjectSchema } from '@chaingraph/types/port/object'
import type {
  ArrayPortConfig,
  BooleanPortConfig,
  NumberPortConfig,
  ObjectPortConfig,
  PortConfig,
  PortFromConfig,
  StringPortConfig,
} from '@chaingraph/types/port/types'
import { ArrayPort } from '@chaingraph/types/port/array'
import { ObjectPort } from '@chaingraph/types/port/object'
import { BooleanPort, NumberPort, StringPort } from '@chaingraph/types/port/scalar'

export class PortFactory {
  // Function overloads
  static create(config: StringPortConfig): StringPort
  static create(config: NumberPortConfig): NumberPort
  static create(config: BooleanPortConfig): BooleanPort
  static create<E extends PortConfig>(config: ArrayPortConfig<E>): ArrayPort<E>
  static create<S extends ObjectSchema>(config: ObjectPortConfig<S>): ObjectPort<S>

  static create<C extends PortConfig>(config: C): PortFromConfig<C> {
    switch (config.kind) {
      case 'string':
        return new StringPort(config as StringPortConfig) as PortFromConfig<C>

      case 'number':
        return new NumberPort(config as NumberPortConfig) as PortFromConfig<C>

      case 'boolean':
        return new BooleanPort(config as BooleanPortConfig) as PortFromConfig<C>

      case 'array':
        return new ArrayPort(config as ArrayPortConfig<any>) as PortFromConfig<C>

      case 'object':
        return new ObjectPort(config as ObjectPortConfig<any>) as PortFromConfig<C>

      default:
        throw new Error(`Unsupported port kind: ${(config as any).kind}`)
    }
  }
}
