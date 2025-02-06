import type { PortDecoratorOptions } from '@chaingraph/types/node'
import type {
  PortType,
} from '@chaingraph/types/port/base/types'
import { resolveObjectSchema } from '@chaingraph/types/node/decorator-new/object-schema.decorator'

import { getPortsMetadata, setPortMetadata } from './metadata-storage'
import { processEnumOptions, processItemConfig } from './recursive-normalization'
import 'reflect-metadata'

/**
 * Helper function to ensure that a port configuration has a key.
 * If not, it defaults to the property name.
 *
 * @param propertyKey - The property key.
 * @param config - The port configuration.
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
  return function (target: object, propertyKey: string | symbol) {
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
      if (typeof config.schema === 'function') {
        config.schema = resolveObjectSchema(config.schema)
      }
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
