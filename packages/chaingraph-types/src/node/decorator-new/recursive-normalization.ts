/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IObjectSchema, IPortConfig } from '@badaitech/chaingraph-types/port/base'
import { resolveObjectSchema } from '.'

/**
 * Recursively normalizes an array port item configuration.
 * If the item configuration is for an object port and its schema is still a constructor,
 * nothing is changed here (the caller—such as resolveObjectSchema—will later resolve it).
 * For nested arrays, this function recurses into the nested itemConfig.
 *
 * @param itemConfig - The item configuration to normalize.
 * @returns The normalized item configuration.
 */
export function normalizeArrayItemConfig(itemConfig: IPortConfig): any {
  if (typeof itemConfig === 'object' && itemConfig !== null) {
    if (itemConfig.type === 'object' && itemConfig.schema) {
      return {
        ...itemConfig,
        schema: resolveObjectSchema(itemConfig.schema),
      }
    } else if (itemConfig.type === 'array' && itemConfig.itemConfig) {
      return {
        ...itemConfig,
        itemConfig: normalizeArrayItemConfig(itemConfig.itemConfig),
      }
    }
  }
  return itemConfig
}

/**
 * Recursively normalizes a plain object schema.
 * It iterates over all properties and if a property is an array port, then its itemConfig is normalized.
 *
 * @param schema - The object schema to normalize.
 * @returns The normalized object schema.
 */
export function normalizeSchema(schema: IObjectSchema): IObjectSchema {
  const normalized: IObjectSchema = { ...schema, properties: {} }
  for (const key in schema.properties) {
    const prop = schema.properties[key]
    if (prop.type === 'array' && prop.itemConfig) {
      normalized.properties[key] = {
        ...prop,
        itemConfig: normalizeArrayItemConfig(prop.itemConfig),
      }
    } else if (prop.type === 'object' && prop.schema) {
      normalized.properties[key] = {
        ...prop,
        schema: resolveObjectSchema(prop.schema),
      }
    } else {
      normalized.properties[key] = prop
    }
  }
  return normalized
}

/**
 * Processes an item configuration for an array port recursively.
 * If the configuration is for an object port whose schema is still a constructor,
 * it leaves the "schema" unaltered here (assuming that resolution will be done via resolveObjectSchema).
 * For nested arrays, it recurses.
 *
 * @param itemConf - The item configuration to process.
 * @returns The processed item configuration.
 */
export function processItemConfig(itemConf: IPortConfig): IPortConfig {
  if (itemConf.type === 'object' && typeof itemConf.schema === 'function') {
    return {
      ...itemConf,
      type: 'object',
      schema: resolveObjectSchema(itemConf.schema),
    }
  } else if (itemConf.type === 'array' && itemConf.itemConfig) {
    return {
      ...itemConf,
      itemConfig: processItemConfig(itemConf.itemConfig),
    }
  }
  return itemConf
}

/**
 * Processes the options array for enum ports recursively.
 * If an option is an object port with schema as a constructor, it leaves the schema field to be resolved;
 * if the option is an array port, it processes its itemConfig.
 *
 * @param options - The array of enum option configurations.
 * @returns The processed array of enum options.
 */
export function processEnumOptions(options: IPortConfig[]): IPortConfig[] {
  return options.map((option) => {
    if (option.type === 'object' && typeof option.schema === 'function') {
      return { ...option, type: 'object', schema: resolveObjectSchema(option.schema) }
    } else if (option.type === 'array' && option.itemConfig) {
      return { ...option, itemConfig: processItemConfig(option.itemConfig) }
    }
    return option
  })
}
