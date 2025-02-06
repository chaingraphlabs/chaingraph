import type {
  AnyPortConfig,
  ArrayPortConfig,
  BooleanPortConfig,
  EnumPortConfig,
  IPortConfig,
  NumberPortConfig,
  ObjectPortConfig,

  PortType,
  StreamPortConfig,
  StringPortConfig,
} from '@chaingraph/types/port-new/base'

import {
  getOrCreateNodeMetadata,
} from '@chaingraph/types/node/decorator-new/getOrCreateNodeMetadata'

import {
  PortDirection,
} from '@chaingraph/types/port-new/base'
import { getObjectSchema, isObjectSchema } from './port-object-schema-decorator'
import 'reflect-metadata'

const PORT_METADATA_KEY = Symbol('port:metadata')

export type PortConfigWithTypeClass = IPortConfig | Omit<IPortConfig, 'type'> & {
  type: Function
}

export type PartialPortConfig<K extends PortType> = Omit<
  IPortConfig,
  'type' | 'schema' | 'elementConfig' | 'valueType'
> & {
  type?: K | Function
  defaultValue?: any
  schema?: any // For ObjectPortConfig
  itemConfig?: PortConfigWithTypeClass // For ArrayPortConfig
  valueType?: PortConfigWithTypeClass // For StreamOutputPortConfig, StreamInputPortConfig
}

export type PortDecoratorConfig<K extends PortType> =
  (
    StringPortConfig
    | NumberPortConfig
    | BooleanPortConfig
    | (ArrayPortConfig<any> & { itemConfig: IPortConfig & { type: Function } })
    | ObjectPortConfig<any>
    | StreamPortConfig<any>
    | EnumPortConfig
    | AnyPortConfig
  )
  & { type: K }

export type ArrayPortDecoratorConfig = PortDecoratorConfig<'array'>

// export type PortDecoratorConfig<K extends PortType> = PartialPortConfig<K> & { type: K | Function }

type LegacyPortConfig = Omit<IPortConfig, 'type'> & {
  type?: PortType | Function
  kind?: PortType | Function
  itemConfig?: LegacyPortConfig
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
      metadata.portsConfig = new Map<string, IPortConfig>()
    }

    const inferSchema = (portConfig: LegacyPortConfig): IPortConfig => {
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
              type: 'object',
              schema,
            } as ObjectPortConfig
            return processPortConfig(objectConfig)
          }
        }
      }

      // Handle array with class type in elementConfig
      if (config.type === 'array' && config.itemConfig) {
        config.itemConfig = inferSchema(config.itemConfig)
      }

      // Handle enum with class types in options
      if (config.type === 'enum' && config.options) {
        config.options = config.options.map(option => inferSchema(option))
      }

      // Handle stream with class type in valueType
      if (config.type === 'stream' && config.itemConfig) {
        config.itemConfig = inferSchema(config.itemConfig)
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
      } as IPortConfig)
    }
  }
}

export function updatePortConfig(
  target: any,
  propertyKey: string,
  updater: (config: IPortConfig) => void,
): void {
  const metadata = getOrCreateNodeMetadata(target)
  if (!metadata.portsConfig) {
    metadata.portsConfig = new Map<string, IPortConfig>()
  }

  const existingConfig = metadata.portsConfig.get(propertyKey) || {} as IPortConfig
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
      metadata.portsConfig = new Map<string, IPortConfig>()
    }

    const portConfig = metadata.portsConfig.get(propertyKey)
    if (!portConfig) {
      metadata.portsConfig.set(propertyKey, portConfigSchema.parse({
        type: 'any',
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
      metadata.portsConfig = new Map<string, IPortConfig>()
    }

    const portConfig = metadata.portsConfig.get(propertyKey)
    if (!portConfig) {
      metadata.portsConfig.set(propertyKey, portConfigSchema.parse({
        type: 'any',
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
export const PortString = createPortDecorator('string')

/**
 * @see NumberPort
 */
export const PortNumber = createPortDecorator('number')

/**
 * @see BooleanPort
 */
export const PortBoolean = createPortDecorator('boolean')

/**
 * @see ArrayPort
 */
export const PortArray = createPortDecorator('array')

/**
 * @see ObjectPort
 */
export const PortObject = createPortDecorator('object')

/**
 * @see AnyPort
 */
export const PortAny = createPortDecorator('any')

/**
 * @see EnumPort
 */
export const PortEnum = createPortDecorator('enum')

/**
 * @see StreamPort
 */
export const PortStream = createPortDecorator('stream')

/**
 * Specialized decorator.old for input stream ports
 */
export function PortStreamInput(config?: Omit<PartialPortConfig<'stream'>, 'direction' | 'mode'>) {
  return Port<'stream'>({
    ...(config || {}),
    type: 'stream',
    direction: PortDirection.Input,
    mode: 'input',
  } as PortDecoratorConfig<'stream'>)
}

/**
 * Specialized decorator.old for output stream ports
 */
export function PortStreamOutput(config?: Omit<PartialPortConfig<'stream'>, 'direction' | 'mode'>) {
  return Port<'stream'>({
    ...(config || {}),
    type: 'stream',
    direction: PortDirection.Output,
    mode: 'output',
  } as PortDecoratorConfig<'stream'>)
}
