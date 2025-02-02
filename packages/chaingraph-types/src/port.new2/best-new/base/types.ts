import { z } from 'zod'

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
export const PORT_TYPES = ['string', 'number', 'array', 'object', 'boolean'] as const
export type PortType = (typeof PORT_TYPES)[number]

/**
 * Base interface for all port configurations
 */
export interface BasePortConfig {
  id?: string
  name?: string
  metadata?: Record<string, unknown>
}

/**
 * String port configuration
 */
export interface StringPortConfig extends BasePortConfig {
  type: 'string'
  minLength?: number
  maxLength?: number
  pattern?: string
}

/**
 * Number port configuration
 */
export interface NumberPortConfig extends BasePortConfig {
  type: 'number'
  min?: number
  max?: number
  step?: number
  integer?: boolean
}

/**
 * Array port configuration
 */
export interface ArrayPortConfig extends BasePortConfig {
  type: 'array'
  itemConfig: IPortConfig
  minLength?: number
  maxLength?: number
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
export interface ArrayPortValue {
  type: 'array'
  value: IPortValue[]
}

/**
 * Union type of all port configurations
 */
export type IPortConfig = StringPortConfig | NumberPortConfig | ArrayPortConfig

/**
 * Union type of all port values
 */
export type IPortValue = StringPortValue | NumberPortValue | ArrayPortValue

/**
 * Type mapping for configs
 */
export interface ConfigTypeMap {
  string: StringPortConfig
  number: NumberPortConfig
  array: ArrayPortConfig
  object: never
  boolean: never
}

/**
 * Type mapping for values
 */
export interface ValueTypeMap {
  string: StringPortValue
  number: NumberPortValue
  array: ArrayPortValue
  object: never
  boolean: never
}

/**
 * Interface for port plugins with specific type
 */
export interface IPortPlugin<T extends PortType> {
  typeIdentifier: T
  configSchema: z.ZodType<ConfigTypeMap[T]>
  valueSchema: z.ZodType<ValueTypeMap[T]>
  serializeValue: (value: ValueTypeMap[T]) => unknown
  deserializeValue: (data: unknown) => ValueTypeMap[T]
}

/**
 * Interface for registry operations with broader types
 */
export interface RegistryPlugin {
  typeIdentifier: PortType
  configSchema: z.ZodType<IPortConfig>
  valueSchema: z.ZodType<IPortValue>
  serializeValue: (value: IPortValue) => unknown
  deserializeValue: (data: unknown) => IPortValue
}

/**
 * Helper function to convert a typed plugin to a registry plugin
 */
export function asRegistryPlugin<T extends PortType>(plugin: IPortPlugin<T>): RegistryPlugin {
  return plugin as unknown as RegistryPlugin
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
export function isStringPortConfig(config: IPortConfig): config is StringPortConfig {
  return config.type === 'string'
}

export function isNumberPortConfig(config: IPortConfig): config is NumberPortConfig {
  return config.type === 'number'
}

export function isArrayPortConfig(config: IPortConfig): config is ArrayPortConfig {
  return config.type === 'array'
}

/**
 * Type guards for port values
 */
export function isStringPortValue(value: IPortValue): value is StringPortValue {
  return value.type === 'string'
}

export function isNumberPortValue(value: IPortValue): value is NumberPortValue {
  return value.type === 'number'
}

export function isArrayPortValue(value: IPortValue): value is ArrayPortValue {
  return value.type === 'array'
}

/**
 * Helper function to create a plugin for a specific type
 */
export function createPortPlugin<T extends PortType>(
  typeIdentifier: T,
  configSchema: z.ZodType<ConfigTypeMap[T]>,
  valueSchema: z.ZodType<ValueTypeMap[T]>,
  serializeValue: (value: ValueTypeMap[T]) => unknown,
  deserializeValue: (data: unknown) => ValueTypeMap[T],
): IPortPlugin<T> {
  return {
    typeIdentifier,
    configSchema,
    valueSchema,
    serializeValue,
    deserializeValue,
  }
}
