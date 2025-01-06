import type {
  AnyPortConfig,
  ArrayPortConfig,
  BooleanPortConfig,
  EnumPortConfig,
  NumberPortConfig,
  ObjectPortConfig,
  PortConfig,
  PortFromConfig,
  StreamInputPortConfig,
  StreamOutputPortConfig,
  StringPortConfig,
} from './types'
import { EnumPort } from '@chaingraph/types/port/enum/enum-port'
import { StreamInputPort } from '@chaingraph/types/port/stream/stream-input-port'
import { StreamOutputPort } from '@chaingraph/types/port/stream/stream-output-port'
import { AnyPort } from './any'
import { ArrayPort } from './array'
import { ObjectPort } from './object'
import { BooleanPort, NumberPort, StringPort } from './scalar'

export class PortFactory {
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

      case 'any':
        return new AnyPort(config as AnyPortConfig) as PortFromConfig<C>

      case 'enum':
        return new EnumPort(config as EnumPortConfig<any>) as PortFromConfig<C>

      case 'stream-output':
        return new StreamOutputPort(config as StreamOutputPortConfig<any>) as PortFromConfig<C>

      case 'stream-input':
        return new StreamInputPort(config as StreamInputPortConfig<any>) as PortFromConfig<C>

      default:
        throw new Error(`Unsupported port kind: ${(config as any).kind}`)
    }
  }
}
