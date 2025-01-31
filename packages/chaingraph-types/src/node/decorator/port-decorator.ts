import type { NodeMetadata } from '@chaingraph/types/node'
import type { ConfigFromPortType, ObjectSchema, PortConfig } from '@chaingraph/types/port.new'
import { getOrCreateNodeMetadata } from '@chaingraph/types/node'
import { PortDirection, PortType } from '@chaingraph/types/port.new'
import { portConfigSchema } from '@chaingraph/types/port.new/config/types'

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
      if (config.type === PortType.Array) {
        if (!config?.elementConfig) {
          throw new Error(`Can not infer array port schema from ${JSON.stringify(config)}, elementConfig is missing`)
        }
        config.elementConfig = inferSchema(config.elementConfig)
      } else if (config.type === PortType.Enum) {
        if (!config.options) {
          throw new Error(`Can not infer enum port schema from ${JSON.stringify(config)}, options is missing`)
        }
        config.options = config.options.map(option => inferSchema(option))
      } else if (config.type === PortType.Stream) {
        if (!config.valueType) {
          throw new Error(`Can not infer stream port schema from ${JSON.stringify(config)}, valueType is missing`)
        }
        config.valueType = inferSchema(config.valueType)
      } else if (typeof config.type === 'function') {
        const type = (config as any).type
        const classMetadata = getOrCreateNodeMetadata(type.prototype)
        Object.assign(config, {
          type: PortType.Object,
          schema: createObjectSchemaFromMetadata(classMetadata),
        })
      }

      // Validate the config using Zod schema
      return portConfigSchema.parse(config)
    }

    const inferredConfig = inferSchema(config as PortConfig)

    const existsPortConfig = metadata.portsConfig.get(propertyKey)
    if (!existsPortConfig) {
      metadata.portsConfig.set(propertyKey, {
        ...inferredConfig,
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
  metadata.portsConfig.set(propertyKey, portConfigSchema.parse(existingConfig))
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
      metadata.portsConfig.set(propertyKey, portConfigSchema.parse({
        type: PortType.Any,
        direction: PortDirection.Input,
      }))
    } else {
      metadata.portsConfig.set(propertyKey, portConfigSchema.parse({
        ...portConfig,
        direction: PortDirection.Input,
      }))
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
      metadata.portsConfig.set(propertyKey, portConfigSchema.parse({
        type: PortType.Any,
        direction: PortDirection.Output,
      }))
    } else {
      metadata.portsConfig.set(propertyKey, portConfigSchema.parse({
        ...portConfig,
        direction: PortDirection.Output,
      }))
    }
  }
}

/**
 * @see StringPort
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
