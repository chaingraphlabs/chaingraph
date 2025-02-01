import type { NodeMetadata } from '@chaingraph/types/node'
import type { ConfigFromPortType, ObjectSchema, PortConfig } from '@chaingraph/types/port.new'
import { NodeRegistry } from '@chaingraph/types'
import { getOrCreateNodeMetadata } from '@chaingraph/types/node'
import { PortDirection, PortType } from '@chaingraph/types/port.new'
import { portConfigSchema } from '@chaingraph/types/port.new/config/types'
import { processPortConfig } from './instance-converter'
import { getObjectSchema, isObjectSchema } from './port-object-schema-decorator'

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

type LegacyPortConfig = Omit<PortConfig, 'type'> & {
  type?: PortType | Function
  kind?: PortType | Function
  elementConfig?: LegacyPortConfig
  valueType?: LegacyPortConfig
  options?: LegacyPortConfig[]
}

function isConstructor(type: any): type is { prototype: any } {
  return typeof type === 'function' && type.prototype !== undefined
}

export function Port<K extends PortType>(config: PortDecoratorConfig<K>) {
  return function (target: any, propertyKey: string) {
    const metadata = getOrCreateNodeMetadata(target)
    if (!metadata.portsConfig) {
      metadata.portsConfig = new Map<string, PortConfig>()
    }

    const inferSchema = (portConfig: LegacyPortConfig): PortConfig => {
      const config = { ...portConfig } as LegacyPortConfig

      // Convert 'kind' to 'type' for backward compatibility
      if (config.kind && !config.type) {
        config.type = config.kind
        delete config.kind
      }

      // Handle class type
      if (config.type && isConstructor(config.type)) {
        const classType = config.type
        if (isObjectSchema(classType)) {
          const schema = getObjectSchema(classType)
          if (schema) {
            const objectConfig = {
              ...config,
              type: PortType.Object,
              schema,
            } as ConfigFromPortType<PortType.Object>
            return processPortConfig(objectConfig)
          }
        }
      }

      // Handle array with class type in elementConfig
      if (config.type === PortType.Array && config.elementConfig) {
        config.elementConfig = inferSchema(config.elementConfig)
      }

      // Handle enum with class types in options
      if (config.type === PortType.Enum && config.options) {
        config.options = config.options.map(option => inferSchema(option))
      }

      // Handle stream with class type in valueType
      if (config.type === PortType.Stream && config.valueType) {
        config.valueType = inferSchema(config.valueType)
      }

      // Process any class instances in default values
      const parsedConfig = portConfigSchema.parse(config)
      return processPortConfig(parsedConfig)
    }

    const inferredConfig = inferSchema(config as LegacyPortConfig)

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
  const parsedConfig = portConfigSchema.parse(existingConfig)
  metadata.portsConfig.set(propertyKey, processPortConfig(parsedConfig))
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

/**
 * Specialized decorator for input stream ports
 */
export function PortStreamInput(config?: Omit<PartialPortConfig<PortType.Stream>, 'direction' | 'mode'>) {
  return Port<PortType.Stream>({
    ...(config || {}),
    type: PortType.Stream,
    direction: PortDirection.Input,
    mode: 'input',
  } as PortDecoratorConfig<PortType.Stream>)
}

/**
 * Specialized decorator for output stream ports
 */
export function PortStreamOutput(config?: Omit<PartialPortConfig<PortType.Stream>, 'direction' | 'mode'>) {
  return Port<PortType.Stream>({
    ...(config || {}),
    type: PortType.Stream,
    direction: PortDirection.Output,
    mode: 'output',
  } as PortDecoratorConfig<PortType.Stream>)
}
