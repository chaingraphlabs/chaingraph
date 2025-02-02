import type { IPortConfig, IPortPlugin, IPortValue } from '../base/types'
import { z } from 'zod'
import { portRegistry } from '../registry/PortRegistry'

/**
 * Configuration schema for array ports
 */
interface ArrayPortConfig extends IPortConfig {
  type: 'array'
  itemConfig: IPortConfig
  minLength?: number
  maxLength?: number
}

/**
 * Value schema for array ports
 */
interface ArrayPortValue extends IPortValue<IPortValue<any>[]> {
  type: 'array'
  value: IPortValue<any>[]
}

// Type guard for IPortValue
function isPortValue(value: unknown): value is IPortValue<any> {
  return typeof value === 'object' && value !== null
    && 'type' in value && typeof (value as any).type === 'string'
    && 'value' in value
}

// Type guard for IPortConfig
function isPortConfig(value: unknown): value is IPortConfig {
  return typeof value === 'object' && value !== null
    && 'type' in value && typeof (value as any).type === 'string'
}

// Type guard for ArrayPortConfig
function isArrayPortConfig(value: IPortConfig): value is ArrayPortConfig {
  return value.type === 'array' && 'itemConfig' in value && isPortConfig(value.itemConfig)
}

/**
 * Validate a single port value against its config
 */
function validateSingleValue(value: IPortValue<any>, config: IPortConfig, path: (string | number)[]): z.ZodIssue[] {
  const plugin = portRegistry.getPlugin(config.type)
  if (!plugin) {
    return [{
      code: z.ZodIssueCode.custom,
      message: `Unknown port type: ${config.type}`,
      path,
    }]
  }

  // Validate value type matches config type
  if (value.type !== config.type) {
    return [{
      code: z.ZodIssueCode.custom,
      message: `Item type "${value.type}" does not match config type "${config.type}"`,
      path,
    }]
  }

  // Validate value using plugin's schema
  const result = plugin.valueSchema.safeParse(value)
  if (!result.success) {
    return result.error.errors.map(err => ({
      ...err,
      path: [...path, ...(err.path as (string | number)[])],
    }))
  }

  return []
}

/**
 * Recursively validate a port value against its config
 */
function validatePortValue(value: IPortValue<any>, config: IPortConfig, path: (string | number)[]): z.ZodIssue[] {
  const issues = validateSingleValue(value, config, path)
  if (issues.length > 0) {
    return issues
  }

  // For array types, recursively validate items
  if (isArrayPortConfig(config) && value.type === 'array') {
    const arrayValue = value as ArrayPortValue
    const itemIssues: z.ZodIssue[] = []

    arrayValue.value.forEach((item, index) => {
      const itemPath = [...path, 'value', index]
      const itemValidation = validateSingleValue(item, config.itemConfig, itemPath)
      itemIssues.push(...itemValidation)

      // If this is also an array, recursively validate its items
      if (isArrayPortConfig(config.itemConfig) && item.type === 'array') {
        const nestedIssues = validatePortValue(item, config.itemConfig, itemPath)
        itemIssues.push(...nestedIssues)
      }
    })

    return itemIssues
  }

  return []
}

// Create base schemas with type assertions
const configSchema = z.object({
  type: z.literal('array'),
  id: z.string().optional(),
  name: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  itemConfig: z.lazy(() => portRegistry.getConfigUnionSchema()),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
}).passthrough().superRefine((data, ctx) => {
  // Validate minLength/maxLength relationship
  if (data.minLength !== undefined && data.maxLength !== undefined) {
    if (data.minLength > data.maxLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `minLength (${data.minLength}) must be less than or equal to maxLength (${data.maxLength})`,
        path: ['minLength'],
      })
    }
  }
}) as unknown as z.ZodType<ArrayPortConfig>

const valueSchema = z.object({
  type: z.literal('array'),
  value: z.array(z.lazy(() => portRegistry.getValueUnionSchema())),
}).passthrough().superRefine((data, ctx) => {
  if (!Array.isArray(data.value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Value must be an array',
      path: ['value'],
    })
    return
  }

  // Validate each item is a valid port value
  data.value.forEach((item, index) => {
    if (!isPortValue(item)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid port value at index ${index}`,
        path: ['value', index],
      })
    }
  })
}) as unknown as z.ZodType<ArrayPortValue>

// Schema for validating value against config
const validationSchema = z.object({
  config: configSchema,
  value: valueSchema,
}).superRefine((data, ctx) => {
  const { config, value } = data

  // Validate array length constraints
  if (config.minLength !== undefined && value.value.length < config.minLength) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      message: `Array must have at least ${config.minLength} items`,
      minimum: config.minLength,
      type: 'array',
      inclusive: true,
      path: ['value', 'value'],
    })
  }

  if (config.maxLength !== undefined && value.value.length > config.maxLength) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      message: `Array must have at most ${config.maxLength} items`,
      maximum: config.maxLength,
      type: 'array',
      inclusive: true,
      path: ['value', 'value'],
    })
  }

  // Validate each array item against the itemConfig
  value.value.forEach((item, index) => {
    const issues = validatePortValue(item, config.itemConfig, ['value', 'value', index])
    issues.forEach(issue => ctx.addIssue(issue))
  })
})

/**
 * Plugin implementation for array ports
 */
export const ArrayPortPlugin: IPortPlugin<ArrayPortConfig, ArrayPortValue> = {
  typeIdentifier: 'array',
  configSchema,
  valueSchema,

  serializeValue: (value: ArrayPortValue) => {
    return value.value.map((item) => {
      if (!isPortValue(item)) {
        throw new Error('Invalid port value in array')
      }
      const plugin = portRegistry.getPlugin(item.type)
      if (!plugin || !plugin.serializeValue) {
        throw new Error(`Cannot serialize item of type: ${item.type}`)
      }
      return plugin.serializeValue(item)
    })
  },

  deserializeValue: (data: unknown) => {
    if (!Array.isArray(data)) {
      throw new TypeError('Expected array value for deserialization')
    }

    // For deserialization, we need the itemConfig to know how to deserialize each item
    // This will be provided through the config when validating
    return {
      type: 'array',
      value: data,
    }
  },
}

/**
 * Helper function for array validation
 */
function validateArrayValue(value: IPortValue<any>[], config: ArrayPortConfig): string[] {
  const result = validationSchema.safeParse({
    config,
    value: { type: 'array', value },
  })
  if (!result.success) {
    return result.error.errors.map(err => err.message)
  }
  return []
}

export { validateArrayValue }
