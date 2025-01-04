import type {
  AnyPortConfig,
  ArrayPortConfig,
  BooleanPortConfig,
  EnumPortConfig,
  NumberPortConfig,
  ObjectPortConfig,
  ObjectSchema,
  PortConfig,
  StringPortConfig,
} from '@chaingraph/types/port'

export function isStringPortConfig(config: PortConfig): config is StringPortConfig {
  return config.kind === 'string'
}

export function isNumberPortConfig(config: PortConfig): config is NumberPortConfig {
  return config.kind === 'number'
}

export function isBooleanPortConfig(config: PortConfig): config is BooleanPortConfig {
  return config.kind === 'boolean'
}

export function isArrayPortConfig<E extends PortConfig>(config: PortConfig): config is ArrayPortConfig<E> {
  return config.kind === 'array'
}

export function isObjectPortConfig<S extends ObjectSchema>(config: PortConfig): config is ObjectPortConfig<S> {
  return config.kind === 'object'
}

export function isAnyPortConfig(config: PortConfig): config is AnyPortConfig {
  return config.kind === 'any'
}

export function isEnumPortConfig<E extends PortConfig>(config: PortConfig): config is EnumPortConfig<E> {
  return config.kind === 'enum'
}
