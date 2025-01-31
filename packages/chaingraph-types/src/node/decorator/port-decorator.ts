import type { NodeMetadata } from '@chaingraph/types/node'
import type { ConfigFromPortType, ObjectSchema, PortConfig } from '@chaingraph/types/port.new'
import { getOrCreateNodeMetadata } from '@chaingraph/types/node'
import { PortDirection, PortType } from '@chaingraph/types/port.new'

import 'reflect-metadata'

const PORT_METADATA_KEY = Symbol('port:metadata')

export type PortConfigWithTypeClass = ConfigFromPortType<any> | Omit<ConfigFromPortType<any>, 'type'> & {
  type: Function
}

export type PartialPortConfig<K extends PortType> = Omit<
  ConfigFromPortType<K>,
  'type' | 'schema' | 'elementConfig' | 'valueType'
> & {
  type?: K | Function
  defaultValue?: any
  schema?: any // For ObjectPortConfig
  elementConfig?: PortConfigWithTypeClass // For ArrayPortConfig
  valueType?: PortConfigWithTypeClass // For StreamOutputPortConfig, StreamInputPortConfig
}

export type PortDecoratorConfig<K extends PortType> = PartialPortConfig<K> & { type: K | Function }

export function Port<K extends PortType>(config: PortDecoratorConfig<K>) {
  return function (target: any, propertyKey: string) {
    const metadata = getOrCreateNodeMetadata(target)
    if (!metadata.portsConfig) {
      metadata.portsConfig = new Map<string, PortConfig>()
    }

    const inferSchema = (config: PortConfig): PortConfig => {
      // if (config) {
      //   if (config.schema && config.schema.properties) {
      //     // user provided the schema directly just return it
      //     return config
      //   }
      //
      //   if (config.schema && typeof config.schema === 'function') {
      //     // user provided the schema as a class, create the schema from the class
      //     config.schema = createObjectSchemaFromMetadata(
      //       getOrCreateNodeMetadata(config.schema),
      //     )
      //   } else {
      //     // try to infer the schema from the field value or type or class
      //     const designType = Reflect.getMetadata('design:type', target, propertyKey)
      //     if (!designType) {
      //       throw new Error(`Can not infer object port schema from ${JSON.stringify(config)}, design:type is missing`)
      //     }
      //     config.schema = createObjectSchemaFromMetadata(
      //       getOrCreateNodeMetadata(designType),
      //     )
      //   }
      // } else

      if (config.type === PortType.Array) {
        if (!config?.elementConfig) {
          throw new Error(`Can not infer array port schema from ${JSON.stringify(config)}, elementConfig is missing`)
        } else {
          config.elementConfig = inferSchema(config.elementConfig)
        }
      } else if (config.type === PortType.Enum) {
        for (const key in Object.keys(config.options)) {
          config.options[key] = inferSchema(config.options[key])
        }
      } else if (config.type === PortType.Stream) {
        if (!config.valueType) {
          throw new Error(`Can not infer stream port schema from ${JSON.stringify(config)}, valueType is missing`)
        }
        config.valueType = inferSchema(config.valueType)
      } else if (typeof config.type === 'function') {
        // Found the function type in the config
        // Check if the function is a class and if so, get the metadata from Reflect
        // and create the schema for the object

        const type = (config as any).type
        const classMetadata = getOrCreateNodeMetadata(type.prototype)
        Object.assign(config, {
          type: PortType.Object,
          schema: createObjectSchemaFromMetadata(classMetadata),
        })
      }

      return config
    }

    const inferredConfig = inferSchema(config as PortConfig)

    const existsPortConfig = metadata.portsConfig.get(propertyKey)
    if (!existsPortConfig) {
      metadata.portsConfig.set(propertyKey, {
        ...inferredConfig,
        // id: inferredConfig?.id ?? propertyKey,
        key: inferredConfig?.key ?? propertyKey,
        title: inferredConfig?.title ?? propertyKey,
      })
    } else {
      metadata.portsConfig.set(propertyKey, {
        ...existsPortConfig,
        ...inferredConfig,
      } as PortConfig)
    }
  }
}

function createObjectSchemaFromMetadata(metadata: NodeMetadata): ObjectSchema {
  if (!metadata || !metadata.portsConfig) {
    // throw new Error(`Port type class ${JSON.stringify(config)} does not have any ports defined`)
    throw new Error(`Can not infer object port schema from ${JSON.stringify(metadata)}, portsConfig is missing`)
  }

  const objectSchema: ObjectSchema = {
    id: metadata?.id ? (metadata.id as string) : '',
    type: metadata?.type ? (metadata.type as string) : '',
    description: metadata?.description ? (metadata.description as string) : '',
    properties: {},
  }

  for (const [nestedPropertyKey, nestedPortConfig] of metadata.portsConfig.entries()) {
    objectSchema.properties[nestedPropertyKey] = nestedPortConfig
  }

  return objectSchema
}

export function updatePortConfig(
  target: any,
  propertyKey: string,
  updater: (config: PortConfig) => void,
): void {
  const metadata = getOrCreateNodeMetadata(target)
  if (!metadata.portsConfig) {
    metadata.portsConfig = new Map<string, PortConfig>()
  }

  const existingConfig = metadata.portsConfig.get(propertyKey) || {} as PortConfig
  updater(existingConfig)
  metadata.portsConfig.set(propertyKey, existingConfig)
}

function createPortDecorator<K extends PortType>(type: K) {
  return (config?: PartialPortConfig<K>) => {
    return Port<K>({ ...(config || {} as PartialPortConfig<K>), type })
  }
}

export function Input() {
  return function (target: any, propertyKey: string) {
    const metadata = getOrCreateNodeMetadata(target)
    if (!metadata.portsConfig) {
      metadata.portsConfig = new Map<string, PortConfig>()
    }

    const portConfig = metadata.portsConfig.get(propertyKey)
    if (!portConfig) {
      metadata.portsConfig.set(propertyKey, {
        type: PortType.Any,
        direction: PortDirection.Input,
      })
    } else {
      metadata.portsConfig.set(propertyKey, {
        ...portConfig,
        direction: PortDirection.Input,
      })
    }
  }
}

export function Output() {
  return function (target: any, propertyKey: string) {
    const metadata = getOrCreateNodeMetadata(target)
    if (!metadata.portsConfig) {
      metadata.portsConfig = new Map<string, PortConfig>()
    }

    const portConfig = metadata.portsConfig.get(propertyKey)
    if (!portConfig) {
      metadata.portsConfig.set(propertyKey, {
        type: PortType.Any,
        direction: PortDirection.Output,
      })
    } else {
      metadata.portsConfig.set(propertyKey, {
        ...portConfig,
        direction: PortDirection.Output,
      })
    }
  }
}

/**
 * @see ObjectPort
 */
export const PortString = createPortDecorator(PortType.String)

/**
 * @see NumberPort
 */
export const PortNumber = createPortDecorator(PortType.Number)

/**
 * @see BooleanPort
 */
export const PortBoolean = createPortDecorator(PortType.Boolean)

/**
 * @see ArrayPort
 */
export const PortArray = createPortDecorator(PortType.Array)

/**
 * @see ObjectPort
 */
export const PortObject = createPortDecorator(PortType.Object)

/**
 * @see AnyPort
 */
export const PortAny = createPortDecorator(PortType.Any)

/**
 * @see EnumPort
 */
export const PortEnum = createPortDecorator(PortType.Enum)

/**
 * @see StreamPort
 */
export const PortStream = createPortDecorator(PortType.Stream)
