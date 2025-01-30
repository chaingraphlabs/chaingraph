import { z } from 'zod'
import { PortType } from '../config/constants'
import {
  applyLengthValidation,
  applyRangeValidation,
  hasLengthValidation,
  hasRangeValidation,
  hasValidation,
} from './base'

/**
 * Base value schemas for each port type
 */

// String value schema
export const stringValueSchema = z.string()

// Number value schema
export const numberValueSchema = z.number()

// Boolean value schema
export const booleanValueSchema = z.boolean()

// Forward declaration for recursive schemas
export const arrayValueSchema: z.ZodType = z.lazy(() => z.array(z.unknown()))
export const objectValueSchema: z.ZodType = z.lazy(() => z.record(z.unknown()))

/**
 * Type guard for array port config
 */
function isArrayConfig(config: unknown): config is { elementConfig: unknown } {
  return typeof config === 'object'
    && config !== null
    && 'elementConfig' in config
    && config.elementConfig !== undefined
}

/**
 * Type guard for object port config
 */
function isObjectConfig(config: unknown): config is {
  schema: { properties: Record<string, unknown> }
} {
  return typeof config === 'object'
    && config !== null
    && 'schema' in config
    && typeof config.schema === 'object'
    && config.schema !== null
    && 'properties' in config.schema
    && typeof config.schema.properties === 'object'
    && config.schema.properties !== null
}

/**
 * Create a value schema for a specific port type
 */
export function createValueSchema(config: { type: PortType } & Record<string, unknown>): z.ZodType {
  switch (config.type) {
    case PortType.String: {
      let schema = stringValueSchema
      if (hasLengthValidation(config)) {
        schema = applyLengthValidation(schema, config.validation)
      }
      return schema
    }

    case PortType.Number: {
      let schema = numberValueSchema
      if (hasRangeValidation(config)) {
        schema = applyRangeValidation(schema, config.validation)
      }
      return schema
    }

    case PortType.Boolean:
      return booleanValueSchema

    case PortType.Array: {
      if (!isArrayConfig(config)) {
        throw new Error('Array port requires elementConfig')
      }
      return z.array(createValueSchema(config.elementConfig as { type: PortType } & Record<string, unknown>))
    }

    case PortType.Object: {
      if (!isObjectConfig(config)) {
        throw new Error('Object port requires schema with properties')
      }

      const propertySchemas: Record<string, z.ZodType> = {}
      for (const [key, propConfig] of Object.entries(config.schema.properties)) {
        if (!propConfig || typeof propConfig !== 'object') {
          throw new Error(`Invalid property config for "${key}"`)
        }
        propertySchemas[key] = createValueSchema(propConfig as { type: PortType } & Record<string, unknown>)
      }

      return z.object(propertySchemas).passthrough()
    }

    case PortType.Enum:
      return z.string()

    case PortType.Stream:
    case PortType.Any:
      return z.unknown()

    default:
      throw new Error(`Unknown port type: ${config.type}`)
  }
}

/**
 * Apply validation to a value schema based on port configuration
 */
export function applyValidation(
  schema: z.ZodType,
  config: Record<string, unknown>,
  portType: PortType,
): z.ZodType {
  if (!hasValidation(config)) {
    return schema
  }

  switch (portType) {
    case PortType.String:
      return hasLengthValidation(config)
        ? applyLengthValidation(schema as z.ZodString, config.validation)
        : schema

    case PortType.Number:
      return hasRangeValidation(config)
        ? applyRangeValidation(schema as z.ZodNumber, config.validation)
        : schema

    default:
      return schema
  }
}

/**
 * Create a value schema with validation
 */
export function createValidatedValueSchema(config: { type: PortType } & Record<string, unknown>): z.ZodType {
  const baseSchema = createValueSchema(config)
  return applyValidation(baseSchema, config, config.type)
}
