/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  AnyPortConfig,
  ArrayPortConfig,
  BooleanPortConfig,
  EnumPortConfig,
  IObjectSchema,
  IPort,
  IPortConfig,
  NumberPortConfig,
  ObjectPortConfig,
  StreamPortConfig,
  StringPortConfig,
} from '../../port'
import {
  AnyPort,
  ArrayPort,
  BooleanPort,
  EnumPort,
  NumberPort,
  ObjectPort,
  PortError,
  PortErrorType,
  StreamPort,
  StringPort,
} from '../../port'

export type SupportedPortInstance =
  | StringPort
  | NumberPort
  | BooleanPort
  | ArrayPort
  | ObjectPort
  | StreamPort
  | EnumPort
  | AnyPort

export type PortInstanceFromConfig<T extends IPortConfig> =
  T extends StringPortConfig ? StringPort :
    T extends NumberPortConfig ? NumberPort :
      T extends BooleanPortConfig ? BooleanPort :
        T extends ArrayPortConfig<infer I> ? ArrayPort<I> :
          T extends ObjectPortConfig<infer S> ? ObjectPort<S> :
            T extends StreamPortConfig<infer V> ? StreamPort<V> :
              T extends EnumPortConfig ? EnumPort :
                T extends AnyPortConfig ? AnyPort :
                  never

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
  static create<T extends IPortConfig>(config: T): PortInstanceFromConfig<T> {
    if (!config || typeof config !== 'object') {
      throw new PortError(
        PortErrorType.ValidationError,
        'Invalid port configuration: expected an object',
      )
    }

    switch (config.type) {
      case 'string': {
        return new StringPort(config as StringPortConfig) as PortInstanceFromConfig<T>
      }
      case 'number': {
        return new NumberPort(config as NumberPortConfig) as PortInstanceFromConfig<T>
      }
      case 'boolean': {
        return new BooleanPort(config as BooleanPortConfig) as PortInstanceFromConfig<T>
      }
      case 'array': {
        return new ArrayPort(config as ArrayPortConfig) as PortInstanceFromConfig<T>
      }
      case 'object': {
        return new ObjectPort(config as ObjectPortConfig) as PortInstanceFromConfig<T>
      }
      case 'stream': {
        return new StreamPort(config as StreamPortConfig) as PortInstanceFromConfig<T>
      }
      case 'enum': {
        return new EnumPort(config as EnumPortConfig) as PortInstanceFromConfig<T>
      }
      case 'any': {
        return new AnyPort(config as AnyPortConfig) as PortInstanceFromConfig<T>
      }
      default:
        throw new PortError(
          PortErrorType.ValidationError,
          `Unsupported port type: ${(config satisfies never as any).type}`,
        )
    }
  }

  /**
   * For dynamic or legacy code – create a port instance from an untyped configuration.
   */
  static createFromConfig(config: IPortConfig): IPort {
    return PortFactory.create(config) as IPort
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

  static createArrayPort<I extends IPortConfig>(config: ArrayPortConfig<I>): ArrayPort<I> {
    return new ArrayPort<I>(config)
  }

  // For an object port, if you use your helper functions (like createObjectSchema
  // and createObjectPortConfig) so that config carries a detailed schema,
  // the following method should preserve that detail:
  static createObjectPort<S extends IObjectSchema>(config: ObjectPortConfig<S>): ObjectPort<S> {
    return new ObjectPort<S>(config)
  }

  static createStreamPort<I extends IPortConfig>(config: StreamPortConfig<I>): StreamPort<I> {
    return new StreamPort<I>(config)
  }

  static createEnumPort(config: EnumPortConfig): EnumPort {
    return new EnumPort(config)
  }

  static createAnyPort(config: AnyPortConfig): AnyPort {
    return new AnyPort(config)
  }
}
