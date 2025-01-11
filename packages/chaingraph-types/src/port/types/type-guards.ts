import type {
  AnyPort,
  AnyPortConfig,
  ArrayPort,
  ArrayPortConfig,
  BooleanPort,
  BooleanPortConfig,
  EnumPort,
  EnumPortConfig,
  IPort,
  NumberPort,
  NumberPortConfig,
  ObjectPort,
  ObjectPortConfig,
  ObjectSchema,
  PortConfig,
  StreamInputPortConfig,
  StringPort,
  StringPortConfig,
} from '@chaingraph/types/port'
import type { StreamInputPort } from '@chaingraph/types/port/stream/stream-input-port'
import type { StreamOutputPort } from '@chaingraph/types/port/stream/stream-output-port'
import { PortKindEnum,
} from '@chaingraph/types/port'

export function isStringPortConfig(config: any): config is StringPortConfig {
  return config.kind === PortKindEnum.String
}

export function isNumberPortConfig(config: any): config is NumberPortConfig {
  return config.kind === PortKindEnum.Number
}

export function isBooleanPortConfig(config: any): config is BooleanPortConfig {
  return config.kind === PortKindEnum.Boolean
}

export function isArrayPortConfig<E extends PortConfig>(config: any): config is ArrayPortConfig<E> {
  return config.kind === PortKindEnum.Array
}

export function isObjectPortConfig<S extends ObjectSchema>(config: any): config is ObjectPortConfig<S> {
  return config.kind === PortKindEnum.Object
}

export function isAnyPortConfig(config: any): config is AnyPortConfig {
  return config.kind === PortKindEnum.Any
}

export function isEnumPortConfig<E extends PortConfig>(config: any): config is EnumPortConfig<E> {
  return config.kind === PortKindEnum.Enum
}

export function isStreamInputPortConfig<T>(config: any): config is StreamInputPortConfig<T> {
  return config.kind === PortKindEnum.StreamInput
}

export function isStreamOutputPortConfig<T>(config: any): config is StreamInputPortConfig<T> {
  return config.kind === PortKindEnum.StreamOutput
}

export function isPortConfig(config: any): config is PortConfig {
  return isStringPortConfig(config)
    || isNumberPortConfig(config)
    || isBooleanPortConfig(config)
    || isArrayPortConfig(config)
    || isObjectPortConfig(config)
    || isAnyPortConfig(config)
    || isEnumPortConfig(config)
    || isStreamInputPortConfig(config)
    || isStreamOutputPortConfig(config)
}

export function isStringPort(port: IPort<any>): port is StringPort {
  return port.config.kind === PortKindEnum.String
}

export function isNumberPort(port: IPort<any>): port is NumberPort {
  return port.config.kind === PortKindEnum.Number
}

export function isBooleanPort(port: IPort<any>): port is BooleanPort {
  return port.config.kind === PortKindEnum.Boolean
}

export function isArrayPort(port: IPort<any>): port is ArrayPort<any> {
  return port.config.kind === PortKindEnum.Array
}

export function isObjectPort(port: IPort<any>): port is ObjectPort<any> {
  return port.config.kind === PortKindEnum.Object
}

export function isAnyPort(port: IPort<any>): port is AnyPort {
  return port.config.kind === PortKindEnum.Any
}

export function isEnumPort(port: IPort<any>): port is EnumPort<any> {
  return port.config.kind === PortKindEnum.Enum
}

export function isStreamInputPort(port: IPort<any>): port is StreamInputPort<any> {
  return port.config.kind === PortKindEnum.StreamInput
}

export function isStreamOutputPort(port: IPort<any>): port is StreamOutputPort<any> {
  return port.config.kind === PortKindEnum.StreamOutput
}

export function isSomePort(port: IPort<any>): port is IPort<any> {
  return isStringPort(port)
    || isNumberPort(port)
    || isBooleanPort(port)
    || isArrayPort(port)
    || isObjectPort(port)
    || isAnyPort(port)
    || isEnumPort(port)
    || isStreamInputPort(port)
    || isStreamOutputPort(port)
}
