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
import { PortKindEnum,
} from './types'

export class PortFactory {
  static create<C extends PortConfig>(config: C): PortFromConfig<C> {
    switch (config.kind) {
      case PortKindEnum.String:
        return new StringPort(config as StringPortConfig) as PortFromConfig<C>

      case PortKindEnum.Number:
        return new NumberPort(config as NumberPortConfig) as PortFromConfig<C>

      case PortKindEnum.Boolean:
        return new BooleanPort(config as BooleanPortConfig) as PortFromConfig<C>

      case PortKindEnum.Array:
        return new ArrayPort(config as ArrayPortConfig<any>) as PortFromConfig<C>

      case PortKindEnum.Object:
        return new ObjectPort(config as ObjectPortConfig<any>) as PortFromConfig<C>

      case PortKindEnum.Any:
        return new AnyPort(config as AnyPortConfig) as PortFromConfig<C>

      case PortKindEnum.Enum:
        return new EnumPort(config as EnumPortConfig<any>) as PortFromConfig<C>

      case PortKindEnum.StreamOutput:
        return new StreamOutputPort(config as StreamOutputPortConfig<any>) as PortFromConfig<C>

      case PortKindEnum.StreamInput:
        return new StreamInputPort(config as StreamInputPortConfig<any>) as PortFromConfig<C>

      default:
        throw new Error(`Unsupported port kind: ${(config as any).kind}`)
    }
  }
}
