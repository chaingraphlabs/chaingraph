import type { JSONObject, JSONValue } from './json'

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
export const PORT_TYPES = ['string', 'number', 'array', 'object', 'boolean', 'stream'] as const
export type PortType = (typeof PORT_TYPES)[number]

/**
 * Base interface for all port configurations
 */
export interface BasePortConfig extends JSONObject {
  id?: string
  name?: string
  metadata?: Record<string, JSONValue>
  required?: boolean
  parentId?: string
  nodeId?: string
  key?: string
  title?: string
  description?: string
  direction?: 'input' | 'output'
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
  itemConfig: Item
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
 * String port value
 */
export interface StringPortValue {
  type: 'string'
  value: string
}

/**
 * Number port value
 */
export interface NumberPortValue {
  type: 'number'
  value: number
}

/**
 * Array port value
 */
export interface ArrayPortValue<Item extends IPortConfig = IPortConfig> {
  type: 'array'
  value: Array<ExtractValue<Item>>
}

/**
 * Object port value
 */
export interface ObjectPortValue<S extends ObjectSchema = ObjectSchema> {
  type: 'object'
  value: ObjectPortValueFromSchema<S>
}

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
export interface StreamPortValue<T extends IPortConfig = IPortConfig> {
  type: 'stream'
  value: MultiChannelTyped<T>
}

/**
 * Boolean port value
 */
export interface BooleanPortValue {
  type: 'boolean'
  value: boolean
}

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
}

/**
 * Interface for port plugins with specific type
 */
export interface IPortPlugin<T extends PortType> {
  typeIdentifier: T
  configSchema: z.ZodType<ConfigTypeMap[T]>
  valueSchema: z.ZodType<ValueTypeMap[T]>
  serializeValue: (value: ValueTypeMap[T]) => JSONValue
  deserializeValue: (data: JSONValue) => ValueTypeMap[T]
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
  serializeValue: (value: IPortValue) => JSONValue
  deserializeValue: (data: JSONValue) => IPortValue
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
                never

/**
 * Helper function to convert a typed plugin to a registry plugin
 */
export function asRegistryPlugin<T extends PortType>(plugin: IPortPlugin<T>): RegistryPlugin {
  return {
    typeIdentifier: plugin.typeIdentifier,
    configSchema: plugin.configSchema as z.ZodType<IPortConfig>,
    valueSchema: plugin.valueSchema as z.ZodType<IPortValue>,
    serializeValue: plugin.serializeValue as (value: IPortValue) => JSONValue,
    deserializeValue: plugin.deserializeValue as (data: JSONValue) => IPortValue,
    serializeConfig: plugin.serializeConfig as (config: IPortConfig) => JSONValue,
    deserializeConfig: plugin.deserializeConfig as (data: JSONValue) => IPortConfig,
    validateValue: plugin.validateValue as (value: IPortValue, config: IPortConfig) => string[],
    validateConfig: plugin.validateConfig as (config: IPortConfig) => string[],
  }
}

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

/**
 * Type guards for port values
 */
export function isStringPortValue(value: unknown): value is StringPortValue {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'string'
    && 'value' in value
    && typeof (value as any).value === 'string'
  )
}

export function isNumberPortValue(value: unknown): value is NumberPortValue {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'number'
    && 'value' in value
    && typeof (value as any).value === 'number'
  )
}

export function isArrayPortValue(value: unknown): value is ArrayPortValue {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'array'
    && 'value' in value
    && Array.isArray((value as any).value)
  )
}

export function isObjectPortValue(value: unknown): value is ObjectPortValue {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'object'
    && 'value' in value
    && typeof (value as any).value === 'object'
    && (value as any).value !== null
  )
}

export function isStreamPortValue(value: unknown): value is StreamPortValue {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'stream'
    && 'value' in value
    && value.value instanceof MultiChannel
  )
}

export function isBooleanPortValue(value: unknown): value is BooleanPortValue {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'boolean'
    && 'value' in value
    && typeof (value as any).value === 'boolean'
  )
}
