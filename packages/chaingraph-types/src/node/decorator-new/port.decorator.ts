import type {
  PortType,
} from '@chaingraph/types/port-new/base/types'
import type { PortDecoratorOptions } from './port-decorator.types'
import { resolveObjectSchema } from '@chaingraph/types/node/decorator-new/object-schema.decorator'
import { ensurePortKey } from './port-decorator.utils'

import 'reflect-metadata'

/**
 * Port decorator that stores port configuration for a property.
 * For ports of type "object", the config’s “schema” field is mandatory and can be either an explicit object schema (IObjectSchema)
 * or a class (constructor) decorated with @ObjectSchema.
 * Additionally, for array ports the itemConfig field is processed: if itemConfig.type is a class decorated with @ObjectSchema,
 * it is automatically converted to { type: 'object', schema: <resolved schema> }.
 */
export function Port<T extends PortType>(
  config: PortDecoratorOptions<T> & { type: T },
): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    const ctor = target.constructor

    // Retrieve existing ports metadata, if any
    const existingPorts: Map<string | symbol, any>
      = Reflect.getMetadata('chaingraph:ports-config', ctor) || new Map()

    // Merge with any existing config
    const existingConfig = existingPorts.get(propertyKey)
    if (existingConfig) {
      config = { ...existingConfig, ...config }
    }

    // Ensure the port key is set.
    ensurePortKey(propertyKey, config)

    // For object ports, the "schema" property is mandatory.
    if (config.type === 'object') {
      if (!('schema' in config)) {
        throw new Error(`Port [${propertyKey.toString()}] of type "object" must provide a "schema".`)
      }
      if (typeof config.schema === 'function') {
        // Resolve the schema using our helper (the resolution actually happens in the @ObjectSchema decorator)
        config.schema = resolveObjectSchema(config.schema)
      }
    }

    // For array ports, ensure an itemConfig exists.
    if (config.type === 'array') {
      if (!('itemConfig' in config)) {
        throw new Error(`Port [${propertyKey.toString()}] of type "array" must provide an "itemConfig".`)
      }
      // Process the itemConfig: if the user provided a class (constructor) in the "type" field
      // then convert it into an object port configuration.
      const itemConf = config.itemConfig
      if (typeof itemConf.type === 'function') {
        config.itemConfig = {
          ...itemConf,
          // Force the type to be 'object' and resolve the schema from the provided class.
          type: 'object',
          schema: resolveObjectSchema(itemConf.type),
        }
      }
    }

    existingPorts.set(propertyKey, config)
    Reflect.defineMetadata('chaingraph:ports-config', existingPorts, ctor)
  }
}
