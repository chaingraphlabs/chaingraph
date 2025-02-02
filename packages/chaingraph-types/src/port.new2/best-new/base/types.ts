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
 * Object port configuration
 */
export interface ObjectPortConfig extends BasePortConfig {
  type: 'object'
  fields: Record<string, IPortConfig>
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
 * Object port value
 */
export interface ObjectPortValue {
  type: 'object'
  value: Record<string, IPortValue>
}

/**
 * Union type of all port configurations
 */
export type IPortConfig = StringPortConfig | NumberPortConfig | ArrayPortConfig | ObjectPortConfig

/**
 * Union type of all port values
 */
export type IPortValue = StringPortValue | NumberPortValue | ArrayPortValue | ObjectPortValue

/**
 * Type mapping for configs
 */
export interface ConfigTypeMap {
  string: StringPortConfig
  number: NumberPortConfig
  array: ArrayPortConfig
  object: ObjectPortConfig
  boolean: never
}

/**
 * Type mapping for values
 */
export interface ValueTypeMap {
  string: StringPortValue
  number: NumberPortValue
  array: ArrayPortValue
  object: ObjectPortValue
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
    && 'fields' in value
    && typeof (value as any).fields === 'object'
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
