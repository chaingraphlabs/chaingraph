/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IObjectSchema, IPortConfig } from '../port'

import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'
import {
  getObjectSchemaMetadata,
  getPortsMetadata,
  setObjectSchemaMetadata,
} from './metadata-storage'
import { normalizeSchema } from './recursive-normalization'
import { NodeRegistry } from './registry'
import 'reflect-metadata'

/**
 * Updated resolveObjectSchema: If the argument is a constructor (function),
 * then retrieves its stored schema metadata. If it's already a plain object,
 * then recursively normalizes it.
 *
 * @param schemaOrConstructor - An object schema or a constructor decorated with @ObjectSchema.
 * @returns The resolved and normalized object schema.
 */
export function resolveObjectSchema(
  schemaOrConstructor: IObjectSchema | Function,
): IObjectSchema {
  if (typeof schemaOrConstructor === 'function') {
    const schema = getObjectSchema(schemaOrConstructor)
    if (!schema) {
      throw new Error(`Class ${schemaOrConstructor.name} is not decorated with @ObjectSchema`)
    }
    return schema
  }

  return normalizeSchema(schemaOrConstructor as IObjectSchema)
}

/**
 * The @ObjectSchemaDecorator decorator collects all properties decorated with @Port
 * (via its metadata) and builds an explicit object schema. It then normalizes the schema
 * recursively.
 *
 * @param options - Optional additional settings for the object schema.
 * @param nodeRegistry
 */
export function ObjectSchema(
  options: Partial<IObjectSchema> & {
    type: string
  },
  nodeRegistry: NodeRegistry = NodeRegistry.getInstance(),
): ClassDecorator {
  return (target: any) => {
    const portsConfig = getPortsMetadata(target)

    const properties: Record<string, IPortConfig> = {}
    for (const [key, config] of portsConfig.entries()) {
      if (typeof config === 'object' && 'type' in config && config.type === 'object' && config.schema) {
        if (typeof config.schema === 'function') {
          config.schema = resolveObjectSchema(config.schema)
        }
      }
      properties[key.toString()] = config
    }

    // check if the object schema already exists in the nodes registry
    const schemaType = options?.type || target.name
    let schemaId = schemaType
    if (nodeRegistry.getObjectSchema(schemaType)) {
      const maxIterations = 100
      for (let i = 0; i < maxIterations; i++) {
        schemaId = `${schemaType}#${customAlphabet(nolookalikes, 8)()}`
        if (!nodeRegistry.getObjectSchema(schemaId)) {
          break
        }
        if (i === maxIterations - 1) {
          throw new Error(`Failed to generate a unique schema ID for type ${schemaType} after ${maxIterations} attempts`)
        }
      }
    }

    const schema: IObjectSchema = {
      ...options,
      id: schemaId,
      type: options.type || target.name,
      description: options.description,
      category: options.category,
      properties,
      isObjectSchema: true,
    }

    const normalizedSchema = normalizeSchema(schema)
    setObjectSchemaMetadata(target, normalizedSchema)

    nodeRegistry.registerObjectSchema(
      schemaId,
      normalizedSchema,
    )
  }
}

/**
 * Helper function to retrieve the stored object schema from a decorated class.
 *
 * @param target - The class whose schema should be retrieved.
 * @returns The object schema or undefined if not found.
 */
export function getObjectSchema(target: any): IObjectSchema | undefined {
  return getObjectSchemaMetadata(target)
}
