import type { PortDirection, PortType } from './constants'

/**
 * Core configuration properties shared by all port types
 */
export interface BasePortConfigProps {
  id?: string
  parentId?: string
  nodeId?: string
  key?: string
  title?: string
  description?: string
  direction?: PortDirection
  optional?: boolean
  metadata?: Record<string, unknown>
}

/**
 * String port specific configuration
 */
export interface StringPortProps {
  type: PortType.String
  defaultValue?: string
  validation?: {
    minLength?: number
    maxLength?: number
  }
}

/**
 * Number port specific configuration
 */
export interface NumberPortProps {
  type: PortType.Number
  defaultValue?: number
  validation?: {
    min?: number
    max?: number
    integer?: boolean
  }
}

/**
 * Boolean port specific configuration
 */
export interface BooleanPortProps {
  type: PortType.Boolean
  defaultValue?: boolean
}

/**
 * Array port specific configuration
 */
export interface ArrayPortProps<E extends PortTypeConfig> {
  type: PortType.Array
  elementConfig: E
  defaultValue?: Array<PortValueType<E>>
}

/**
 * Object schema configuration
 */
export interface ObjectSchema {
  id?: string
  type?: string
  description?: string
  properties: Record<string, PortTypeConfig>
}

/**
 * Object port specific configuration
 */
export interface ObjectPortProps {
  type: PortType.Object
  schema: ObjectSchema
  defaultValue?: Record<string, unknown>
}

/**
 * Enum port specific configuration
 */
export interface EnumPortProps<E extends PortTypeConfig> {
  type: PortType.Enum
  options: E[]
  defaultValue?: string | null
}

/**
 * Stream port specific configuration
 */
export interface StreamPortProps<T extends PortTypeConfig> {
  type: PortType.Stream
  valueType: T
  mode: 'input' | 'output'
  bufferSize?: number
  defaultValue?: any // Will be MultiChannel<PortValueType<T>>
}

/**
 * Any port specific configuration
 */
export interface AnyPortProps {
  type: PortType.Any
  connectedPortConfig?: PortTypeConfig | null
  defaultValue?: unknown
}

/**
 * Union type of all possible port type configurations
 */
export type PortTypeConfig =
  | StringPortProps
  | NumberPortProps
  | BooleanPortProps
  | ArrayPortProps<any>
  | ObjectPortProps
  | EnumPortProps<any>
  | StreamPortProps<any>
  | AnyPortProps

/**
 * Complete port configuration type combining base properties with type-specific properties
 */
export type PortConfig<T extends PortTypeConfig = PortTypeConfig> = BasePortConfigProps & T

/**
 * Helper type to extract the value type from a port configuration
 */
export type PortValueType<T extends PortTypeConfig> =
  T extends StringPortProps ? string :
    T extends NumberPortProps ? number :
      T extends BooleanPortProps ? boolean :
        T extends ArrayPortProps<infer E> ? Array<PortValueType<E>> :
          T extends ObjectPortProps ? { [K in keyof T['schema']['properties']]: PortValueType<T['schema']['properties'][K]> } :
            T extends EnumPortProps<any> ? string | null :
              T extends StreamPortProps<infer V> ? AsyncIterable<PortValueType<V>> :
                T extends AnyPortProps ? unknown :
                  never
