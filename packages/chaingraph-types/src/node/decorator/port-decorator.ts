import type { PortConfig, PortConfigByKind, PortKind } from '../../port'
import { getOrCreateNodeMetadata } from '@chaingraph/types/node'
import { PortKindEnum } from '@chaingraph/types/port'
import { PortDirectionEnum } from '../../port'

import 'reflect-metadata'

const PORT_METADATA_KEY = Symbol('port:metadata')

type PartialPortConfig<K extends PortKind> = Omit<
  PortConfigByKind<K>,
  'kind' | 'schema' | 'elementConfig'
> & {
  schema?: any // For ObjectPortConfig

  elementConfig?:
    PortConfig |
    Omit<PortConfig, 'kind'> & {
    // eslint-disable-next-line ts/no-unsafe-function-type
      kind: Function
    } // For ArrayPortConfig
}

type PortDecoratorConfig<K extends PortKind> = PartialPortConfig<K> & { kind: K }

export function PortDecorator<K extends PortKind>(config: PortDecoratorConfig<K>) {
  return function (target: any, propertyKey: string) {
    const metadata = getOrCreateNodeMetadata(target)
    if (!metadata.portsConfig) {
      metadata.portsConfig = new Map<string, PortConfig>()
    }

    const existsPortConfig = metadata.portsConfig.get(propertyKey)
    if (!existsPortConfig) {
      const portConfig: PortConfig = {
        ...config,
        id: config.id ?? propertyKey,
        name: propertyKey,
      } as PortConfig

      metadata.portsConfig.set(propertyKey, {
        ...portConfig,
      })
    } else {
      metadata.portsConfig.set(propertyKey, {
        ...existsPortConfig,
        ...config,
      })
    }
  }
}

function createPortDecorator<K extends PortKind>(kind: K) {
  return (config?: PartialPortConfig<K>) => {
    return PortDecorator<K>({ ...(config || {} as PartialPortConfig<K>), kind })
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
        kind: PortKindEnum.Any,
        direction: PortDirectionEnum.Input,
      })
    } else {
      metadata.portsConfig.set(propertyKey, {
        ...portConfig,
        direction: PortDirectionEnum.Input,
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
        kind: PortKindEnum.Any,
        direction: PortDirectionEnum.Output,
      })
    } else {
      metadata.portsConfig.set(propertyKey, {
        ...portConfig,
        direction: PortDirectionEnum.Output,
      })
    }
  }
}

/**
 * @see ObjectPort
 * @see ObjectPortConfig
 */
export const PortString = createPortDecorator(PortKindEnum.String)

/**
 * @see NumberPort
 * @see NumberPortConfig
 */
export const PortNumber = createPortDecorator(PortKindEnum.Number)

/**
 * @see BooleanPort
 * @see BooleanPortConfig
 */
export const PortBoolean = createPortDecorator(PortKindEnum.Boolean)

/**
 * @see ArrayPort
 * @see ArrayPortConfig
 */
export const PortArray = createPortDecorator(PortKindEnum.Array)

/**
 * @see ObjectPort
 * @see ObjectPortConfig
 */
export const PortObject = createPortDecorator(PortKindEnum.Object)

/**
 * @see AnyPort
 * @see AnyPortConfig
 */
export const PortAny = createPortDecorator(PortKindEnum.Any)

/**
 * @see EnumPort
 * @see EnumPortConfig
 */
export const PortEnum = createPortDecorator(PortKindEnum.Enum)

/**
 * @see StreamOutputPort
 * @see StreamOutputPortConfig
 */
export const PortStreamOutput = createPortDecorator(PortKindEnum.StreamOutput)

/**
 * @see StreamInputPort
 * @see StreamInputPortConfig
 */
export const PortStreamInput = createPortDecorator(PortKindEnum.StreamInput)
