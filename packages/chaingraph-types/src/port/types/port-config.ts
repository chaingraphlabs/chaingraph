import type {
  AnyPort,
  ArrayPort,
  BooleanPort,
  NumberPort,
  ObjectPort,
  ObjectPortValueFromSchema,
  ObjectSchema,
  StringPort,
} from '@chaingraph/types/port'
import type { MultiChannel } from '@chaingraph/types/port/channel/multi-channel'
import type { EnumPort } from '@chaingraph/types/port/enum/enum-port'
import type { StreamInputPort } from '@chaingraph/types/port/stream/stream-input-port'
import type { StreamOutputPort } from '@chaingraph/types/port/stream/stream-output-port'

export type PortKind =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'any'
  | 'enum'
  | 'stream-output'
  | 'stream-input'

interface BasePortConfig<K extends PortKind> {
  id: string
  name: string
  kind: K
  defaultValue?: any // Will be specified in each specific config
  validation?: any // Will be specified in each specific config
  metadata?: Record<string, unknown>
}

// Validation interfaces (define as needed)
export interface StringPortValidation {
  // Define your validation rules for string ports
}

export interface NumberPortValidation {
  // Define your validation rules for number ports
}

export interface BooleanPortValidation {
  // Define your validation rules for boolean ports
}

export interface ArrayPortValidation<E extends PortConfig> {
  // Define your validation rules for array ports
}

export interface ObjectPortValidation<S extends ObjectSchema> {
  // Define your validation rules for object ports
}

export interface EnumPortValidation<E extends PortConfig> {
  // Define validation rules if needed
}

// Specific PortConfig interfaces
export interface StringPortConfig extends BasePortConfig<'string'> {
  kind: 'string'
  defaultValue?: string
  validation?: StringPortValidation
}

export interface NumberPortConfig extends BasePortConfig<'number'> {
  kind: 'number'
  defaultValue?: number
  validation?: NumberPortValidation
}

export interface BooleanPortConfig extends BasePortConfig<'boolean'> {
  kind: 'boolean'
  defaultValue?: boolean
  validation?: BooleanPortValidation
}

export interface ArrayPortConfig<E extends PortConfig> extends BasePortConfig<'array'> {
  kind: 'array'
  elementConfig: E
  defaultValue?: Array<PortValueFromConfig<E>>
  validation?: ArrayPortValidation<E>
}

export interface ObjectPortConfig<S extends ObjectSchema> extends BasePortConfig<'object'> {
  kind: 'object'
  schema: S
  defaultValue?: ObjectPortValueFromSchema<S>
  validation?: ObjectPortValidation<S>
}

export interface AnyPortConfig extends BasePortConfig<'any'> {
  kind: 'any'
  connectedPortConfig?: PortConfig | null
}

export interface EnumPortConfig<E extends PortConfig> extends BasePortConfig<'enum'> {
  kind: 'enum'
  options: E[] // Array of options, each is a PortConfig of specific type
  defaultValue?: string // Selected option's id
  validation?: EnumPortValidation<E>
}

export interface StreamOutputPortConfig<T> extends BasePortConfig<'stream-output'> {
  kind: 'stream-output'
  valueType: PortConfig
}

export interface StreamInputPortConfig<T> extends BasePortConfig<'stream-input'> {
  kind: 'stream-input'
  valueType: PortConfig
}

// Union type of all PortConfigs
export type PortConfig =
  | StringPortConfig
  | NumberPortConfig
  | BooleanPortConfig
  | ArrayPortConfig<any>
  | ObjectPortConfig<any>
  | AnyPortConfig
  | EnumPortConfig<any>
  | StreamOutputPortConfig<any>
  | StreamInputPortConfig<any>

export type PortFromConfig<C extends PortConfig> =
  C extends StringPortConfig ? StringPort :
    C extends NumberPortConfig ? NumberPort :
      C extends BooleanPortConfig ? BooleanPort :
        C extends ArrayPortConfig<infer E> ? ArrayPort<E> :
          C extends ObjectPortConfig<infer S> ? ObjectPort<S> :
            C extends AnyPortConfig ? AnyPort :
              C extends EnumPortConfig<infer E> ? EnumPort<E> :
                C extends StreamOutputPortConfig<infer T> ? StreamOutputPort<T> :
                  C extends StreamInputPortConfig<infer T> ? StreamInputPort<T> :
                    never

export type PortValueFromConfig<C extends PortConfig> =
  C extends StringPortConfig ? string :
    C extends NumberPortConfig ? number :
      C extends BooleanPortConfig ? boolean :
        C extends ArrayPortConfig<infer E> ? Array<PortValueFromConfig<E>> :
          C extends ObjectPortConfig<infer S> ? ObjectPortValueFromSchema<S> :
            C extends AnyPortConfig ? any :
              C extends EnumPortConfig<any> ? string | null :
                C extends StreamOutputPortConfig<infer T> ? MultiChannel<T> :
                  C extends StreamInputPortConfig<infer T> ? MultiChannel<T> | null :
                    never
