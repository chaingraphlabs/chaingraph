import type { ObjectSchema } from './object'
import type {
  AnyPortConfig,
  ArrayPortConfig,
  BooleanPortConfig,
  NumberPortConfig,
  ObjectPortConfig,
  PortConfig,
  PortFromConfig,
  StringPortConfig,
} from './types'
import { AnyPort } from './any'
import { ArrayPort } from './array'
import { ObjectPort } from './object'
import { BooleanPort, NumberPort, StringPort } from './scalar'

export class PortFactory {
  // Function overloads
  static create(config: StringPortConfig): StringPort
  static create(config: NumberPortConfig): NumberPort
  static create(config: BooleanPortConfig): BooleanPort
  static create<E extends PortConfig>(config: ArrayPortConfig<E>): ArrayPort<E>
  static create<S extends ObjectSchema>(config: ObjectPortConfig<S>): ObjectPort<S>
  static create(config: AnyPortConfig): AnyPort

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

      case 'any': // Handle 'any' kind
        return new AnyPort(config as AnyPortConfig) as PortFromConfig<C>

      default:
        throw new Error(`Unsupported port kind: ${(config as any).kind}`)
    }
  }
}
