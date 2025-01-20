import type { NodeMetadata } from '@chaingraph/types/node'
import type { ObjectSchema, PortConfig, PortConfigByKind } from '@chaingraph/types/port'
import type { BasePortConfig } from '@chaingraph/types/port/types/port-config'
import { getOrCreateNodeMetadata } from '@chaingraph/types/node'
import { ArrayPort, EnumPort, ObjectPort, StreamInputPort, StreamOutputPort } from '@chaingraph/types/port'
import { PortDirection } from '@chaingraph/types/port/types/port-direction-union'
import { PortKind } from '@chaingraph/types/port/types/port-kind'

import 'reflect-metadata'

const PORT_METADATA_KEY = Symbol('port:metadata')

export type PortConfigWithClassKind = PortConfig | Omit<PortConfig, 'kind'> & {
  kind: Function
}

export type PartialPortConfig<K extends PortKind> = Omit<
  PortConfigByKind<K>,
  'kind' | 'schema' | 'elementConfig' | 'valueType'
> & {
  schema?: any // For ObjectPortConfig
  elementConfig?: PortConfigWithClassKind // For ArrayPortConfig
  valueType?: PortConfigWithClassKind // For StreamOutputPortConfig, StreamInputPortConfig
}

export type PortDecoratorConfig<K extends PortKind> = PartialPortConfig<K> & { kind: K | Function }

export function Port<K extends PortKind>(config: PortDecoratorConfig<K>) {
  return function (target: any, propertyKey: string) {
    const metadata = getOrCreateNodeMetadata(target)
    if (!metadata.portsConfig) {
      metadata.portsConfig = new Map<string, PortConfig>()
    }

    const inferSchema = (config: BasePortConfig<any>): BasePortConfig<any> => {
      if (ObjectPort.isObjectPortConfig(config)) {
        if (config.schema && config.schema.properties) {
          // user provided the schema directly just return it
          return config
        }

        if (config.schema && typeof config.schema === 'function') {
          // user provided the schema as a class, create the schema from the class
          config.schema = createObjectSchemaFromMetadata(
            getOrCreateNodeMetadata(config.schema),
          )
        } else {
          // try to infer the schema from the field value or type or class
          const designType = Reflect.getMetadata('design:type', target, propertyKey)
          if (!designType) {
            throw new Error(`Can not infer object port schema from ${JSON.stringify(config)}, design:type is missing`)
          }
          config.schema = createObjectSchemaFromMetadata(
            getOrCreateNodeMetadata(designType),
          )
        }
      } else if (ArrayPort.isArrayPortConfig(config)) {
        if (!config?.elementConfig) {
          throw new Error(`Can not infer array port schema from ${JSON.stringify(config)}, elementConfig is missing`)
        } else {
          config.elementConfig = inferSchema(config.elementConfig)
        }
      } else if (EnumPort.isEnumPortConfig(config)) {
        for (const key in Object.keys(config.options)) {
          config.options[key] = inferSchema(config.options[key])
        }
      } else if (StreamInputPort.isStreamInputPortConfig(config) || StreamOutputPort.isStreamOutputPortConfig(config)) {
        if (!config.valueType) {
          throw new Error(`Can not infer stream port schema from ${JSON.stringify(config)}, valueType is missing`)
        }
        config.valueType = inferSchema(config.valueType)
      } else if (typeof config.kind === 'function') {
        // Found the function kind in the config
        // Check if the function is a class and if so, get the metadata from Reflect
        // and create the schema for the object

        const kind = (config as any).kind
        const classMetadata = getOrCreateNodeMetadata(kind.prototype)
        Object.assign(config, {
          kind: PortKind.Object,
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
      })
    }
  }
}

function createObjectSchemaFromMetadata(metadata: NodeMetadata): ObjectSchema {
  if (!metadata || !metadata.portsConfig) {
    // throw new Error(`Port kind class ${JSON.stringify(config)} does not have any ports defined`)
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

function createPortDecorator<K extends PortKind>(kind: K) {
  return (config?: PartialPortConfig<K>) => {
    return Port<K>({ ...(config || {} as PartialPortConfig<K>), kind })
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
        kind: PortKind.Any,
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
        kind: PortKind.Any,
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
 * @see ObjectPortConfig
 */
export const PortString = createPortDecorator(PortKind.String)

/**
 * @see NumberPort
 * @see NumberPortConfig
 */
export const PortNumber = createPortDecorator(PortKind.Number)

/**
 * @see BooleanPort
 * @see BooleanPortConfig
 */
export const PortBoolean = createPortDecorator(PortKind.Boolean)

/**
 * @see ArrayPort
 * @see ArrayPortConfig
 */
export const PortArray = createPortDecorator(PortKind.Array)

/**
 * @see ObjectPort
 * @see ObjectPortConfig
 */
export const PortObject = createPortDecorator(PortKind.Object)

/**
 * @see AnyPort
 * @see AnyPortConfig
 */
export const PortAny = createPortDecorator(PortKind.Any)

/**
 * @see EnumPort
 * @see EnumPortConfig
 */
export const PortEnum = createPortDecorator(PortKind.Enum)

/**
 * @see StreamOutputPort
 * @see StreamOutputPortConfig
 */
export const PortStreamOutput = createPortDecorator(PortKind.StreamOutput)

/**
 * @see StreamInputPort
 * @see StreamInputPortConfig
 */
export const PortStreamInput = createPortDecorator(PortKind.StreamInput)
