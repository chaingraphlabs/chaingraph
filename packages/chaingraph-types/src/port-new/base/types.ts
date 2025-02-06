import type { JSONValue } from './json'

import type {
  ArrayPortConfigUIType,
  BasePortConfigUIType,
  BooleanPortConfigUIType,
  NumberPortConfigUIType,
  ObjectPortConfigUIType,
  StreamPortConfigUIType,
  StringPortConfigUIType,
} from './ui-config.schema'

import { z } from 'zod'
import { MultiChannel } from '../channel/multi-channel'

/**
 * Port error types
 */
export enum PortErrorType {
  ValidationError = 'ValidationError',
  TypeError = 'TypeError',
  SerializationError = 'SerializationError',
  RegistryError = 'RegistryError',
}

/**
 * Port error class
 */
export class PortError extends Error {
  constructor(
    public type: PortErrorType,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'PortError'
  }
}

/**
 * Port type literals
 */
export const PORT_TYPES = [
  'string',
  'number',
  'array',
  'object',
  'boolean',
  'stream',
  'enum',
  'any',
] as const
export type PortType = (typeof PORT_TYPES)[number]

export enum PortDirection {
  Input = 'input',
  Output = 'output',
}

/**
 * Base interface for all port configurations
 */
export interface BasePortConfig { // extends JSONObject
  id?: string
  name?: string
  metadata?: Record<string, JSONValue>
  required?: boolean
  parentId?: string
  nodeId?: string
  key?: string
  title?: string
  description?: string
  direction?: PortDirection
  ui?: BasePortConfigUIType
}

/**
 * String port configuration
 */
export interface StringPortConfig extends BasePortConfig {
  type: 'string'
  defaultValue?: StringPortValue
  minLength?: number
  maxLength?: number
  pattern?: string
  ui?: BasePortConfigUIType & StringPortConfigUIType
}

/**
 * Number port configuration
 */
export interface NumberPortConfig extends BasePortConfig {
  type: 'number'
  defaultValue?: NumberPortValue
  min?: number
  max?: number
  step?: number
  integer?: boolean
  ui?: BasePortConfigUIType & NumberPortConfigUIType
}

/**
 * Array port configuration
 */
export interface ArrayPortConfig<
  Item extends IPortConfig = IPortConfig,
> extends BasePortConfig {
  type: 'array'
  itemConfig: IPortConfig
  defaultValue?: ArrayPortValue<Item>
  minLength?: number
  maxLength?: number
  ui?: BasePortConfigUIType & ArrayPortConfigUIType
}

/**
 * Object port configuration
 */
export interface ObjectPortConfig<S extends ObjectSchema = ObjectSchema> extends BasePortConfig {
  type: 'object'
  schema: S
  defaultValue?: ObjectPortValue<S>
  ui?: BasePortConfigUIType & ObjectPortConfigUIType
}

/**
 * Object port schema definition
 */
export interface ObjectSchema<T extends Record<string, IPortConfig> = Record<string, IPortConfig>> {
  properties: T
  id?: string
  type?: string
  description?: string
  category?: string
  isObjectSchema?: boolean
}

/**
 * Stream port configuration
 */
export interface StreamPortConfig<Item extends IPortConfig = IPortConfig> extends BasePortConfig {
  type: 'stream'
  itemConfig: Item
  defaultValue?: StreamPortValue<Item>
  ui?: BasePortConfigUIType & StreamPortConfigUIType
}

/**
 * Boolean port configuration
 */
export interface BooleanPortConfig extends BasePortConfig {
  type: 'boolean'
  defaultValue?: BooleanPortValue
  ui?: BasePortConfigUIType & BooleanPortConfigUIType
}

/**
 * Enum port configuration
 */
export interface EnumPortConfig extends BasePortConfig {
  type: 'enum'
  options: IPortConfig[]
  defaultValue?: EnumPortValue
  ui?: BasePortConfigUIType
}

/**
 * Any port configuration
 */
export interface AnyPortConfig extends BasePortConfig {
  type: 'any'
  underlyingType?: IPortConfig
  defaultValue?: AnyPortValue
  ui?: BasePortConfigUIType
}

/**
 * String port value
 */
// export interface StringPortValue {
//   type: 'string'
//   value: string
// }
export type StringPortValue = string

/**
 * Number port value
 */
// export interface NumberPortValue {
//   type: 'number'
//   value: number
// }
export type NumberPortValue = number

/**
 * Array port value
 */
// export interface ArrayPortValue<Item extends IPortConfig = IPortConfig> {
//   type: 'array'
//   value: Array<ExtractValue<Item>>
// }
export type ArrayPortValue<Item extends IPortConfig = IPortConfig> = Array<ExtractValue<Item>>

/**
 * Object port value
 */
// export interface ObjectPortValue<S extends ObjectSchema = ObjectSchema> {
//   type: 'object'
//   value: ObjectPortValueFromSchema<S>
// }
export type ObjectPortValue<S extends ObjectSchema = ObjectSchema> = ObjectPortValueFromSchema<S>

/**
 * Object port value from schema
 */
export type ObjectPortValueFromSchema<S extends ObjectSchema<any>> = {
  [K in keyof S['properties']]: ExtractValue<S['properties'][K]>
}

type MultiChannelTyped<T extends IPortConfig = IPortConfig> = MultiChannel<ExtractValue<T>>

/**
 * Stream port value
 */
// export interface StreamPortValue<T extends IPortConfig = IPortConfig> {
//   type: 'stream'
//   value: MultiChannelTyped<T>
// }
export type StreamPortValue<T extends IPortConfig = IPortConfig> = MultiChannelTyped<T>

/**
 * Boolean port value
 */
// export interface BooleanPortValue {
//   type: 'boolean'
//   value: boolean
// }
export type BooleanPortValue = boolean

/**
 * Enum port value
 */
export type EnumPortValue = string

/**
 * Any port value
 */
export type AnyPortValue = any

/**
 * Union type of all port configurations
 */
export type IPortConfig =
  | StringPortConfig
  | NumberPortConfig
  | BooleanPortConfig
  | ArrayPortConfig<any>
  | ObjectPortConfig<any>
  | StreamPortConfig<any>
  | EnumPortConfig
  | AnyPortConfig

/**
 * Union type of all port values
 */
export type IPortValue =
  | StringPortValue
  | NumberPortValue
  | BooleanPortValue
  | ArrayPortValue<any>
  | ObjectPortValue<any>
  | StreamPortValue<any>
  | EnumPortValue
  | AnyPortValue

export type PortConfigByType<T extends PortType> = ConfigTypeMap[T]

/**
 * Type mapping for configs
 */
export interface ConfigTypeMap {
  string: StringPortConfig
  number: NumberPortConfig
  boolean: BooleanPortConfig
  array: ArrayPortConfig<any>
  object: ObjectPortConfig<any>
  stream: StreamPortConfig<any>
  enum: EnumPortConfig
  any: AnyPortConfig
}

/**
 * Type mapping for values
 */
export interface ValueTypeMap {
  string: StringPortValue
  number: NumberPortValue
  boolean: BooleanPortValue
  array: ArrayPortValue<any>
  object: ObjectPortValue<any>
  stream: StreamPortValue<any>
  enum: EnumPortValue
  any: AnyPortValue
}

/**
 * Interface for port plugins with specific type
 */
export interface IPortPlugin<T extends PortType> {
  typeIdentifier: T
  configSchema: z.ZodType<ConfigTypeMap[T]>
  valueSchema: z.ZodType<ValueTypeMap[T]>
  serializeValue: (value: ValueTypeMap[T], config: ConfigTypeMap[T]) => JSONValue
  deserializeValue: (data: JSONValue, config: ConfigTypeMap[T]) => ValueTypeMap[T]
  serializeConfig: (config: ConfigTypeMap[T]) => JSONValue
  deserializeConfig: (data: JSONValue) => ConfigTypeMap[T]
  validateValue: (value: ValueTypeMap[T], config: ConfigTypeMap[T]) => string[]
  validateConfig: (config: ConfigTypeMap[T]) => string[]
}

/**
 * Interface for registry operations with broader types
 */
export interface RegistryPlugin {
  typeIdentifier: PortType
  configSchema: z.ZodType<IPortConfig>
  valueSchema: z.ZodType<IPortValue>
  serializeValue: (value: IPortValue, config: IPortConfig) => JSONValue
  deserializeValue: (data: JSONValue, config: IPortConfig) => IPortValue
  serializeConfig: (config: IPortConfig) => JSONValue
  deserializeConfig: (data: JSONValue) => IPortConfig
  validateValue: (value: IPortValue, config: IPortConfig) => string[]
  validateConfig: (config: IPortConfig) => string[]
}

/**
 * Extract the value type from a port config
 */
export type ExtractValue<C extends IPortConfig> =
    C extends StringPortConfig ? StringPortValue :
      C extends NumberPortConfig ? NumberPortValue :
        C extends BooleanPortConfig ? BooleanPortValue :
          C extends ArrayPortConfig<infer E> ? ArrayPortValue<E> :
            C extends ObjectPortConfig<infer S> ? ObjectPortValue<S> :
              C extends StreamPortConfig<infer T> ? StreamPortValue<T> :
                C extends EnumPortConfig ? EnumPortValue :
                  C extends AnyPortConfig ? AnyPortValue :
                    never

/**
 * Helper function to build a union schema
 */
export function buildUnion<T extends z.ZodTypeAny>(
  schemas: T[],
  defaultSchema: T,
): z.ZodType<z.infer<T>> {
  if (schemas.length === 0) {
    throw new PortError(
      PortErrorType.RegistryError,
      'No schemas registered',
    )
  }

  // If only one schema, return it directly
  if (schemas.length === 1) {
    return schemas[0]
  }

  // Create a union with default schema to ensure we have at least two schemas
  const allSchemas = [defaultSchema, ...schemas] as [T, T, ...T[]]
  return z.union(allSchemas)
}

/**
 * Type guards for port configurations
 */
export function isStringPortConfig(value: unknown): value is StringPortConfig {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'string'
  )
}

export function isNumberPortConfig(value: unknown): value is NumberPortConfig {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'number'
  )
}

export function isArrayPortConfig(value: unknown): value is ArrayPortConfig {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'array'
    && 'itemConfig' in value
    && typeof value.itemConfig === 'object'
  )
}

export function isObjectPortConfig(value: unknown): value is ObjectPortConfig {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'object'
    && 'schema' in value
    && typeof (value as any).schema === 'object'
    && 'properties' in (value as any).schema
    && typeof (value as any).schema.properties === 'object'
  )
}

export function isStreamPortConfig(value: unknown): value is StreamPortConfig {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'stream'
    && 'itemConfig' in value
    && typeof value.itemConfig === 'object'
  )
}

export function isBooleanPortConfig(value: unknown): value is BooleanPortConfig {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'boolean'
  )
}

export function isEnumPortConfig(value: unknown): value is EnumPortConfig {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'enum'
    && 'options' in value
    && Array.isArray((value as EnumPortConfig).options)
  )
}

export function isAnyPortConfig(value: unknown): value is AnyPortConfig {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'any'
    && 'underlyingType' in value
    && typeof value.underlyingType === 'object'
  )
}

/**
 * Type guards for port values
 */
export function isStringPortValue(value: unknown): value is StringPortValue {
  return typeof value === 'string'
}

export function isNumberPortValue(value: unknown): value is NumberPortValue {
  return typeof value === 'number' && !Number.isNaN(value)
}

export function isArrayPortValue(value: unknown): value is ArrayPortValue {
  return Array.isArray(value)
}

export function isObjectPortValue(value: unknown): value is ObjectPortValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isStreamPortValue(value: unknown): value is StreamPortValue {
  return value instanceof MultiChannel
}

export function isBooleanPortValue(value: unknown): value is BooleanPortValue {
  return typeof value === 'boolean'
}

export function isEnumPortValue(value: unknown): value is EnumPortValue {
  return typeof value === 'string'
}

export function isAnyPortValue(value: unknown): value is AnyPortValue {
  return true
}
