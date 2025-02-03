import type {
  ArrayPortConfig,
  BooleanPortConfig,
  IPortConfig,
  NumberPortConfig,
  ObjectPortConfig,
  ObjectSchema,
  StreamPortConfig,
  StringPortConfig,
} from '../base/types'
import { PortError, PortErrorType } from '../base/types'

import { ArrayPort } from '../instances/ArrayPort'
import { BooleanPort } from '../instances/BooleanPort'
import { NumberPort } from '../instances/NumberPort'
import { ObjectPort } from '../instances/ObjectPort'
import { StreamPort } from '../instances/StreamPort'
// Import concrete port instance classes
import { StringPort } from '../instances/StringPort'

export type SupportedPortInstance =
  | StringPort
  | NumberPort
  | BooleanPort
  | ArrayPort
  | ObjectPort
  | StreamPort

export class PortFactory {
  /**
   * Creates a port instance given one of the supported configurations.
   * (The return type is a union of all supported port instances.)
   *
   * Note that because you are passing in a union type the compiler does not
   * automatically narrow the result. Therefore, if you care about preserving
   * full generic type information (for example, for object ports), use the specific
   * convenience methods (for example, createObjectPort) below.
   */
  static create(config: IPortConfig): SupportedPortInstance {
    if (!config || typeof config !== 'object') {
      throw new PortError(
        PortErrorType.ValidationError,
        'Invalid port configuration: expected an object',
      )
    }
    switch (config.type) {
      case 'string': {
        return new StringPort(config as StringPortConfig)
      }
      case 'number': {
        return new NumberPort(config as NumberPortConfig)
      }
      case 'boolean': {
        return new BooleanPort(config as BooleanPortConfig)
      }
      case 'array': {
        return new ArrayPort(config as ArrayPortConfig)
      }
      case 'object': {
        return new ObjectPort(config as ObjectPortConfig)
      }
      case 'stream': {
        return new StreamPort(config as StreamPortConfig)
      }
      default:
        throw new PortError(
          PortErrorType.ValidationError,
          `Unsupported port type: ${(config as any).type}`,
        )
    }
  }

  /**
   * For dynamic or legacy code – create a port instance from an untyped configuration.
   */
  static createFromConfig(config: IPortConfig): SupportedPortInstance {
    return PortFactory.create(config)
  }

  // –– Convenience methods preserve the more specific types ––

  static createStringPort(config: StringPortConfig): StringPort {
    return new StringPort(config)
  }

  static createNumberPort(config: NumberPortConfig): NumberPort {
    return new NumberPort(config)
  }

  static createBooleanPort(config: BooleanPortConfig): BooleanPort {
    return new BooleanPort(config)
  }

  static createArrayPort(config: ArrayPortConfig): ArrayPort {
    return new ArrayPort(config)
  }

  // For an object port, if you use your helper functions (like createObjectSchema
  // and createObjectPortConfig) so that config carries a detailed schema,
  // the following method should preserve that detail:
  static createObjectPort<S extends ObjectSchema>(config: ObjectPortConfig<S>): ObjectPort<S> {
    return new ObjectPort(config)
  }

  static createStreamPort(config: StreamPortConfig): StreamPort {
    return new StreamPort(config)
  }
}
