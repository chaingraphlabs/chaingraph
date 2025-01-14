import type { MultiChannel } from '@chaingraph/types/port'
import type { PortDirection } from './port-direction'
import type { PortKindEnum } from './port-kind-enum'
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

export interface BasePortConfig<K extends PortKindEnum> {
  kind: K
  id?: string
  parentId?: string
  nodeId?: string
  key?: string
  title?: string
  description?: string
  direction?: PortDirection
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

export interface StringPortConfig extends BasePortConfig<PortKindEnum.String> {
  defaultValue?: string
  validation?: StringPortValidation
}

/*
 * * * * * * * * * * *
 * Number Port Config
 * * * * * * * * * * *
 */

export interface NumberPortConfig extends BasePortConfig<PortKindEnum.Number> {
  defaultValue?: NumberPortValue
  validation?: NumberPortValidation
}

/*
 * * * * * * * * * * *
 * Boolean Port Config
 * * * * * * * * * * *
 */
export interface BooleanPortConfig extends BasePortConfig<PortKindEnum.Boolean> {
  defaultValue?: boolean
  validation?: BooleanPortValidation
}

/*
 * * * * * * * * * * *
 * Array Port Config
 * * * * * * * * * * *
 */

export interface ArrayPortConfig<E extends PortConfig> extends BasePortConfig<PortKindEnum.Array> {
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

export interface ObjectPortConfig<S extends ObjectSchema> extends BasePortConfig<PortKindEnum.Object> {
  schema: S
  defaultValue?: ObjectPortValueFromSchema<S>
  validation?: ObjectPortValidation
}

/*
 * * * * * * * * * * *
 * Any Port Config
 * * * * * * * * * * *
 */
export interface AnyPortConfig extends BasePortConfig<PortKindEnum.Any> {
  connectedPortConfig?: PortConfig | null
  defaultValue?: any
}

/*
 * * * * * * * * * * *
 * Enum Port Config
 * * * * * * * * * * *
 */

export interface EnumPortConfig<E extends PortConfig> extends BasePortConfig<PortKindEnum.Enum> {
  options: E[] // Array of options, each is a PortConfig of a specific type
  defaultValue?: string | null // Selected option's id
  validation?: EnumPortValidation
}

/*
 * * * * * * * * * * *
 * Stream Output Port Config
 * * * * * * * * * * *
 */

export interface StreamOutputPortConfig<T> extends BasePortConfig<PortKindEnum.StreamOutput> {
  valueType?: PortConfig
}

/*
 * * * * * * * * * * *
 * Enum Port Config
 * * * * * * * * * * *
 */

export interface StreamInputPortConfig<T> extends BasePortConfig<PortKindEnum.StreamInput> {
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

export type PortValueByKind<K extends PortKindEnum> = PortValueFromConfig<PortConfigByKind<K>>

export type PortConfigByKind<K extends PortKindEnum> =
  K extends PortKindEnum.String ? StringPortConfig :
    K extends PortKindEnum.Number ? NumberPortConfig :
      K extends PortKindEnum.Boolean ? BooleanPortConfig :
        K extends PortKindEnum.Array ? ArrayPortConfig<any> :
          K extends PortKindEnum.Object ? ObjectPortConfig<any> :
            K extends PortKindEnum.Any ? AnyPortConfig :
              K extends PortKindEnum.Enum ? EnumPortConfig<any> :
                K extends PortKindEnum.StreamOutput ? StreamOutputPortConfig<any> :
                  K extends PortKindEnum.StreamInput ? StreamInputPortConfig<any> :
                    never
