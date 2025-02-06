import type { ObjectSchema as IObjectSchema, IPortConfig } from '@chaingraph/types/port-new/base'

import {
  getObjectSchemaMetadata,
  getPortsMetadata,
  setObjectSchemaMetadata,
} from '@chaingraph/types/node'
import 'reflect-metadata'

/**
 * Helper function to recursively normalize a plain object schema.
 * For every property that is an array port configuration, if its itemConfig.type is a constructor,
 * then we replace it with the explicit object port configuration using resolveObjectSchema.
 */
function normalizeSchema(schema: IObjectSchema): IObjectSchema {
  // Create a shallow copy of schema; override properties as a new object.
  const normalized: IObjectSchema = { ...schema, properties: {} }
  for (const key in schema.properties) {
    const prop = schema.properties[key] as Record<string, any>
    if (prop.type === 'array' && prop.itemConfig) {
      let newItemConfig = { ...prop.itemConfig }
      // Check if newItemConfig.type is a constructor function.
      if (newItemConfig.type && typeof newItemConfig.type === 'function') {
        newItemConfig = {
          ...newItemConfig,
          type: 'object',
          schema: resolveObjectSchema(newItemConfig.type),
        }
      }
      // Additionally, if newItemConfig.schema is a constructor, resolve it.
      if (newItemConfig.schema && typeof newItemConfig.schema === 'function') {
        newItemConfig = {
          ...newItemConfig,
          schema: resolveObjectSchema(newItemConfig.schema),
        }
      } else if (newItemConfig.type === 'array' && newItemConfig.itemConfig) {
      // For nested arrays, recursively normalize.
        newItemConfig = {
          ...newItemConfig,
          itemConfig: normalizeArrayItemConfig(newItemConfig.itemConfig),
        }
      }
      // Cast to IPortConfig to satisfy TypeScript.
      normalized.properties[key] = { ...prop, itemConfig: newItemConfig } as IPortConfig
    } else {
      normalized.properties[key] = prop as IPortConfig
    }
  }
  return normalized
}

/**
 * Helper function to normalize an array port item configuration.
 * If the itemConfig is an object and its "schema" field is a constructor,
 * it is replaced with the explicit object port configuration.
 */
function normalizeArrayItemConfig(itemConfig: any): any {
  if (typeof itemConfig === 'object' && itemConfig !== null) {
    // Check if we have an explicit (long) form for object ports.
    if (itemConfig.type === 'object' && itemConfig.schema) {
      // If schema is a constructor, resolve it.
      if (typeof itemConfig.schema === 'function') {
        return { ...itemConfig, schema: resolveObjectSchema(itemConfig.schema) }
      } else {
        return { ...itemConfig, schema: normalizeSchema(itemConfig.schema) }
      }
    } else if (itemConfig.type && typeof itemConfig.type === 'function') {
      // Shorthand not allowed per our new design — resolve the class.
      return { type: 'object', schema: resolveObjectSchema(itemConfig.type) }
    } else if (itemConfig.type === 'array' && itemConfig.itemConfig) {
      // For nested arrays, recursively normalize.
      return { ...itemConfig, itemConfig: normalizeArrayItemConfig(itemConfig.itemConfig) }
    }
  }
  return itemConfig
}

/**
 * Updated resolveObjectSchema: If the argument is a function,
 * then get its metadata. If it's a plain object literal, then recursively normalize it.
 */
export function resolveObjectSchema(
  schemaOrConstructor: IObjectSchema | Function,
): IObjectSchema {
  if (typeof schemaOrConstructor === 'function') {
    const schema = getObjectSchema(schemaOrConstructor)
    if (!schema) {
      throw new Error(
        `Class ${schemaOrConstructor.name} is not decorated with @ObjectSchema`,
      )
    }
    return schema
  }
  // If already a plain object, normalize its nested structures.
  return normalizeSchema(schemaOrConstructor as IObjectSchema)
}

/**
 * The @ObjectSchema decorator collects all properties decorated with @Port
 * and builds an explicit object schema.
 */
export function ObjectSchema(
  options?: Partial<IObjectSchema>,
): ClassDecorator {
  return (target: any) => {
    // Retrieve all port configurations stored by the @Port decorator.
    const portsConfig = getPortsMetadata(target)

    const properties: Record<string, IPortConfig> = {}

    for (const [key, config] of portsConfig.entries()) {
      if (config.type === 'object' && config.schema) {
        config.schema = resolveObjectSchema(config.schema)
      }
      properties[key.toString()] = config
    }

    const schema: IObjectSchema = {
      type: target.name,
      properties,
      isObjectSchema: true,
      ...options,
    }

    // Normalize the full object schema before storing it.
    const normalizedSchema = normalizeSchema(schema)
    setObjectSchemaMetadata(target, normalizedSchema)
  }
}

/**
 * Helper function to retrieve the stored object schema from a decorated class.
 */
export function getObjectSchema(target: any): IObjectSchema | undefined {
  return getObjectSchemaMetadata(target)
}
