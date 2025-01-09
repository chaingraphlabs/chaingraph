import type {
  AnyPort,
  ArrayPort,
  BooleanPort,
  NumberPort,
  NumberPortValue,
  ObjectPort,
  ObjectPortValueFromSchema,
  ObjectSchema,
  StringPort,
} from '@chaingraph/types/port'
import type { MultiChannel } from '@chaingraph/types/port/channel/multi-channel'
import type { EnumPort } from '@chaingraph/types/port/enum/enum-port'
import type { StreamInputPort } from '@chaingraph/types/port/stream/stream-input-port'
import type { StreamOutputPort } from '@chaingraph/types/port/stream/stream-output-port'

export enum PortKindEnum {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Array = 'array',
  Object = 'object',
  Any = 'any',
  Enum = 'enum',
  StreamOutput = 'stream-output',
  StreamInput = 'stream-input',
}

export type PortKind =
  | PortKindEnum.String
  | PortKindEnum.Number
  | PortKindEnum.Boolean
  | PortKindEnum.Array
  | PortKindEnum.Object
  | PortKindEnum.Any
  | PortKindEnum.Enum
  | PortKindEnum.StreamOutput
  | PortKindEnum.StreamInput

export enum PortDirectionEnum {
  Input = 'input',
  Output = 'output',
}

export type PortDirection = PortDirectionEnum.Input | PortDirectionEnum.Output

export interface BasePortConfig<K extends PortKind> {
  kind: K
  id?: string
  parentId?: string
  nodeId?: string
  name?: string
  title?: string
  description?: string
  direction?: PortDirection
  optional?: boolean
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
export interface StringPortConfig extends BasePortConfig<PortKindEnum.String> {
  kind: PortKindEnum.String
  defaultValue?: string
  validation?: StringPortValidation
}

export interface NumberPortConfig extends BasePortConfig<PortKindEnum.Number> {
  kind: PortKindEnum.Number
  defaultValue?: NumberPortValue
  validation?: NumberPortValidation
}

export interface BooleanPortConfig extends BasePortConfig<PortKindEnum.Boolean> {
  kind: PortKindEnum.Boolean
  defaultValue?: boolean
  validation?: BooleanPortValidation
}

export interface ArrayPortConfig<E extends PortConfig> extends BasePortConfig<PortKindEnum.Array> {
  kind: PortKindEnum.Array
  elementConfig: E
  defaultValue?: Array<PortValueFromConfig<E>>
  validation?: ArrayPortValidation<E>
}

export interface ObjectPortConfig<S extends ObjectSchema> extends BasePortConfig<PortKindEnum.Object> {
  kind: PortKindEnum.Object
  schema: S
  defaultValue?: ObjectPortValueFromSchema<S>
  validation?: ObjectPortValidation<S>
}

export interface AnyPortConfig extends BasePortConfig<PortKindEnum.Any> {
  kind: PortKindEnum.Any
  connectedPortConfig?: PortConfig | null
}

export interface EnumPortConfig<E extends PortConfig> extends BasePortConfig<PortKindEnum.Enum> {
  kind: PortKindEnum.Enum
  options: E[] // Array of options, each is a PortConfig of specific type
  defaultValue?: string // Selected option's id
  validation?: EnumPortValidation<E>
}

export interface StreamOutputPortConfig<T> extends BasePortConfig<PortKindEnum.StreamOutput> {
  kind: PortKindEnum.StreamOutput
  valueType: PortConfig
}

export interface StreamInputPortConfig<T> extends BasePortConfig<PortKindEnum.StreamInput> {
  kind: PortKindEnum.StreamInput
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
    C extends NumberPortConfig ? NumberPortValue :
      C extends BooleanPortConfig ? boolean :
        C extends ArrayPortConfig<infer E> ? Array<PortValueFromConfig<E>> :
          C extends ObjectPortConfig<infer S> ? ObjectPortValueFromSchema<S> :
            C extends AnyPortConfig ? any :
              C extends EnumPortConfig<any> ? string | null :
                C extends StreamOutputPortConfig<infer T> ? MultiChannel<T> :
                  C extends StreamInputPortConfig<infer T> ? MultiChannel<T> | null :
                    never

export type PortConfigByKind<K extends PortKind> =
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
