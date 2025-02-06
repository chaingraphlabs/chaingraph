import type { IPortConfig, ObjectSchema } from '@chaingraph/types/port-new/base'
import {
  getOrCreateNodeMetadata,
  NodeRegistry,
} from '@chaingraph/types'
import { v7 as uuidv7 } from 'uuid'
import { processPortConfig } from './instance-converter'

export interface ObjectSchemaMetadata {
  id?: string
  type?: string
  category?: string
  description?: string
  portsConfig?: Map<string, IPortConfig>
  isObjectSchema?: boolean
}

interface Constructor {
  prototype: any
  name: string
}

function isConstructor(type: any): type is Constructor {
  return typeof type === 'function' && type.prototype !== undefined
}

export function PortObjectSchema(config?: ObjectSchemaMetadata, nodeRegistry?: NodeRegistry | null) {
  return function (target: any) {
    const nodeMetadata = getOrCreateNodeMetadata(target.prototype)
    const metadata: Required<ObjectSchemaMetadata> = {
      id: config?.id ?? uuidv7(),
      type: config?.type ?? target.name,
      description: config?.description ?? '',
      category: '__OBJECT_SCHEMA__',
      portsConfig: nodeMetadata.portsConfig || new Map<string, IPortConfig>(),
      isObjectSchema: true,
    }

    // Convert port configs to schema properties
    const properties: Record<string, IPortConfig> = {}
    for (const [key, portConfig] of metadata.portsConfig.entries()) {
      // Process the port configuration to handle class instances
      const processedConfig = processPortConfig(portConfig as IPortConfig)

      // If the port config has a class type, look up its schema
      if (isConstructor(portConfig.type)) {
        const classMetadata = getOrCreateNodeMetadata(portConfig.type.prototype)
        if (classMetadata.category === '__OBJECT_SCHEMA__') {
          properties[key] = {
            ...processedConfig,
            type: 'object',
            schema: {
              type: classMetadata.type || portConfig.type.name,
              properties: Object.fromEntries(
                Array.from(classMetadata.portsConfig || new Map()).map(([k, v]) => [
                  k,
                  processPortConfig(v),
                ]),
              ),
            },
          } as IPortConfig
        }
      } else {
        properties[key] = processedConfig
      }
    }

    // Create the object schema
    const schema: ObjectSchema = {
      id: metadata.id,
      type: metadata.type,
      description: metadata.description,
      properties,
    }

    // Register the schema
    const registry = nodeRegistry !== undefined
      ? (nodeRegistry !== null ? nodeRegistry : NodeRegistry.getInstance())
      : NodeRegistry.getInstance()

    registry.registerObjectSchema(metadata.id, schema)

    // Update node metadata
    Object.assign(nodeMetadata, {
      type: metadata.type,
      description: metadata.description,
      category: metadata.category,
      id: metadata.id,
      portsConfig: new Map(Object.entries(properties)),
      isObjectSchema: metadata.isObjectSchema,
    })

    // Update the node in registry
    registry.updateNode(target, nodeMetadata)

    // Make the class implement Record<string, unknown>
    const propertyNames = Object.keys(properties)

    // Define enumerable properties for each port
    const descriptors = propertyNames.reduce((acc, key) => {
      acc[key] = {
        enumerable: true,
        configurable: true,
        get(this: Record<string, unknown>) {
          return this[`_${key}`]
        },
        set(this: Record<string, unknown>, value: unknown) {
          this[`_${key}`] = value
        },
      }
      return acc
    }, {} as PropertyDescriptorMap & ThisType<any>)

    Object.defineProperties(target.prototype, descriptors)

    // Add index signature support
    Object.defineProperty(target.prototype, Symbol.toStringTag, {
      value: metadata.type,
      configurable: true,
    })

    // Add toJSON method for proper serialization
    if (!target.prototype.toJSON) {
      target.prototype.toJSON = function (this: Record<string, unknown>) {
        return propertyNames.reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = this[key]
          return acc
        }, {})
      }
    }

    return target
  }
}

// Helper function to check if a class is an object schema
export function isObjectSchema(target: any): boolean {
  const metadata = getOrCreateNodeMetadata(target)
  return metadata.category === '__OBJECT_SCHEMA__'
}

// Helper function to get schema from registry
export function getObjectSchema(target: any): ObjectSchema | undefined {
  const metadata = getOrCreateNodeMetadata(target)
  if (metadata.id) {
    return NodeRegistry.getInstance().getObjectSchema(metadata.id)
  }
  return undefined
}
