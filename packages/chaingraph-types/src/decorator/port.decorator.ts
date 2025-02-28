/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortType } from '../port'
import type { PortDecoratorOptions } from './port.decorator.types'

import { getPortsMetadata, setPortMetadata } from './metadata-storage'
import { resolveObjectSchema } from './object-schema.decorator'
import { processEnumOptions, processItemConfig } from './recursive-normalization'
import 'reflect-metadata'

/**
 * Helper function to ensure that a port configuration has a key.
 * If not, it defaults to the property name.
 *
 * @param propertyKey - The property key.
 * @param config - The port configuration.
 * @param config.key - The key to ensure.
 */
function ensurePortKey(propertyKey: string | symbol, config: { key?: string }) {
  if (!config.key) {
    config.key = propertyKey.toString()
  }
}

/**
 * Port decorator that stores port configuration for a property.
 *
 * For ports of type "object", the "schema" is required and, if it is still a constructor,
 * it is resolved via resolveObjectSchema.
 *
 * For array ports, the "itemConfig" field is processed recursively via processItemConfig.
 *
 * For enum ports, the "options" array is processed recursively via processEnumOptions.
 *
 * @param config - The complete port decorator configuration.
 */
export function Port<T extends PortType>(
  config: PortDecoratorOptions<T> & { type: T },
): PropertyDecorator {
  return function (target: object, propertyKey: any) {
    const ctor = target.constructor
    const existingPorts = getPortsMetadata(ctor)
    const existingConfig = existingPorts.get(propertyKey)
    if (existingConfig) {
      config = { ...existingConfig, ...config }
    }
    ensurePortKey(propertyKey, config)

    // Process object ports.
    if (config.type === 'object') {
      if (!('schema' in config)) {
        throw new Error(`Port [${propertyKey.toString()}] of type "object" must provide a "schema".`)
      }
      config.schema = resolveObjectSchema(config.schema)
    }

    // Process array ports.
    if (config.type === 'array') {
      if (!('itemConfig' in config)) {
        throw new Error(`Port [${propertyKey.toString()}] of type "array" must provide an "itemConfig".`)
      }
      config.itemConfig = processItemConfig(config.itemConfig)
    }

    // Process enum ports.
    if (config.type === 'enum' && 'options' in config && Array.isArray(config.options)) {
      config.options = processEnumOptions(config.options)
    }

    if (config.type === 'stream') {
      if (!('itemConfig' in config)) {
        throw new Error(`Port [${propertyKey.toString()}] of type "stream" must provide an "itemConfig".`)
      }
      config.itemConfig = processItemConfig(config.itemConfig)
    }

    existingPorts.set(propertyKey, config)
    setPortMetadata(ctor, propertyKey, config)
  }
}
