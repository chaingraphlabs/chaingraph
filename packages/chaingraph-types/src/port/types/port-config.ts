import type { MultiChannel } from '@chaingraph/types/port'
import type { PortDirectionUnion } from './port-direction-union'
import type { PortKind } from './port-kind'
import type {
  ArrayPortValidation,
  BooleanPortValidation,
  EnumPortValidation,
  NumberPortValidation,
  ObjectPortValidation,
  PortValidation,
  StringPortValidation,
} from './port-validation'
import type {
  NumberPortValue,
} from './port-value'

/*
 * * * * * * * * * * *
 * Base Port Config
 * * * * * * * * * * *
 */

export interface BasePortConfig<K extends PortKind> {
  kind: K
  id?: string
  parentId?: string
  nodeId?: string
  key?: string
  title?: string
  description?: string
  direction?: PortDirectionUnion
  optional?: boolean
  defaultValue?: any // Will be specified in each specific config
  validation?: PortValidation // Will be specified in each specific config
  metadata?: { [key: string]: unknown }
}

/*
 * * * * * * * * * * *
 * String Port Config
 * * * * * * * * * * *
 */

export interface StringPortConfig extends BasePortConfig<PortKind.String> {
  defaultValue?: string
  validation?: StringPortValidation
}

/*
 * * * * * * * * * * *
 * Number Port Config
 * * * * * * * * * * *
 */

export interface NumberPortConfig extends BasePortConfig<PortKind.Number> {
  defaultValue?: NumberPortValue
  validation?: NumberPortValidation
  isNumber?: boolean
}

/*
 * * * * * * * * * * *
 * Boolean Port Config
 * * * * * * * * * * *
 */
export interface BooleanPortConfig extends BasePortConfig<PortKind.Boolean> {
  defaultValue?: boolean
  validation?: BooleanPortValidation
}

/*
 * * * * * * * * * * *
 * Array Port Config
 * * * * * * * * * * *
 */

export interface ArrayPortConfig<E extends PortConfig> extends BasePortConfig<PortKind.Array> {
  elementConfig: E
  defaultValue?: Array<PortValueFromConfig<E>>
  validation?: ArrayPortValidation
}

/*
 * * * * * * * * * * *
 * Object Port Config
 * * * * * * * * * * *
 */

export interface ObjectSchema {
  id?: string
  type?: string
  description?: string
  category?: string
  properties: {
    [key: string]: PortConfig
  }
  isObjectSchema?: boolean
}

export type ObjectPortValueFromSchema<S extends ObjectSchema> = {
  [K in keyof S['properties']]: PortValueFromConfig<S['properties'][K]>;
}

export interface ObjectPortConfig<S extends ObjectSchema> extends BasePortConfig<PortKind.Object> {
  schema: S
  defaultValue?: ObjectPortValueFromSchema<S>
  validation?: ObjectPortValidation
}

/*
 * * * * * * * * * * *
 * Any Port Config
 * * * * * * * * * * *
 */
export interface AnyPortConfig extends BasePortConfig<PortKind.Any> {
  connectedPortConfig?: PortConfig | null
  defaultValue?: any
}

/*
 * * * * * * * * * * *
 * Enum Port Config
 * * * * * * * * * * *
 */

export interface EnumPortConfig<E extends PortConfig> extends BasePortConfig<PortKind.Enum> {
  options: E[] // Array of options, each is a PortConfig of a specific type
  defaultValue?: string | null // Selected option's id
  validation?: EnumPortValidation
}

/*
 * * * * * * * * * * *
 * Stream Output Port Config
 * * * * * * * * * * *
 */

export interface StreamOutputPortConfig<T> extends BasePortConfig<PortKind.StreamOutput> {
  valueType?: PortConfig
}

/*
 * * * * * * * * * * *
 * Enum Port Config
 * * * * * * * * * * *
 */

export interface StreamInputPortConfig<T> extends BasePortConfig<PortKind.StreamInput> {
  valueType?: PortConfig
}

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

export type PortValueFromConfig<C extends PortConfig> =
  C extends StringPortConfig ? string :
    C extends NumberPortConfig ? NumberPortValue :
      C extends BooleanPortConfig ? boolean :
        C extends ArrayPortConfig<infer E> ? Array<PortValueFromConfig<E>> :
          C extends ObjectPortConfig<infer S> ? ObjectPortValueFromSchema<S> :
            C extends AnyPortConfig ? any :
              C extends EnumPortConfig<any> ? string | null :
                C extends StreamOutputPortConfig<infer T> ? MultiChannel<T> :
                  C extends StreamInputPortConfig<infer T> ? MultiChannel<T> | null :
                    never

export type PortValueByKind<K extends PortKind> = PortValueFromConfig<PortConfigByKind<K>>

export type PortConfigByKind<K extends PortKind> =
  K extends PortKind.String ? StringPortConfig :
    K extends PortKind.Number ? NumberPortConfig :
      K extends PortKind.Boolean ? BooleanPortConfig :
        K extends PortKind.Array ? ArrayPortConfig<any> :
          K extends PortKind.Object ? ObjectPortConfig<any> :
            K extends PortKind.Any ? AnyPortConfig :
              K extends PortKind.Enum ? EnumPortConfig<any> :
                K extends PortKind.StreamOutput ? StreamOutputPortConfig<any> :
                  K extends PortKind.StreamInput ? StreamInputPortConfig<any> :
                    never
