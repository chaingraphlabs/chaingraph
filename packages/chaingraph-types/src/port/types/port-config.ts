import type {
  ArrayPort,
  BooleanPort,
  NumberPort,
  ObjectPort,
  ObjectPortValueFromSchema,
  ObjectSchema,
  StringPort,
} from '@chaingraph/types/port'

export type PortKind = 'string' | 'number' | 'boolean' | 'array' | 'object'

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

// Specific PortConfig interfaces
export interface StringPortConfig extends BasePortConfig<'string'> {
  defaultValue?: string
  validation?: StringPortValidation
}

export interface NumberPortConfig extends BasePortConfig<'number'> {
  defaultValue?: number
  validation?: NumberPortValidation
}

export interface BooleanPortConfig extends BasePortConfig<'boolean'> {
  defaultValue?: boolean
  validation?: BooleanPortValidation
}

export interface ArrayPortConfig<E extends PortConfig> extends BasePortConfig<'array'> {
  elementConfig: E
  defaultValue?: Array<PortValueFromConfig<E>>
  validation?: ArrayPortValidation<E>
}

export interface ObjectPortConfig<S extends ObjectSchema> extends BasePortConfig<'object'> {
  schema: S
  defaultValue?: ObjectPortValueFromSchema<S>
  validation?: ObjectPortValidation<S>
}

// Union type of all PortConfigs
export type PortConfig =
  | StringPortConfig
  | NumberPortConfig
  | BooleanPortConfig
  | ArrayPortConfig<any>
  | ObjectPortConfig<any>

export type PortFromConfig<C extends PortConfig> =
  C extends StringPortConfig ? StringPort :
    C extends NumberPortConfig ? NumberPort :
      C extends BooleanPortConfig ? BooleanPort :
        C extends ArrayPortConfig<infer E> ? ArrayPort<E> :
          C extends ObjectPortConfig<infer S> ? ObjectPort<S> :
            never

export type PortValueFromConfig<C extends PortConfig> =
  C extends StringPortConfig ? string :
    C extends NumberPortConfig ? number :
      C extends BooleanPortConfig ? boolean :
        C extends ArrayPortConfig<infer E> ? Array<PortValueFromConfig<E>> :
          C extends ObjectPortConfig<infer S> ? ObjectPortValueFromSchema<S> :
            never
