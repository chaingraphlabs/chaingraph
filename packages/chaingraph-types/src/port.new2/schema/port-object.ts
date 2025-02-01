import type { EnsureJSONSerializable } from './json'
import type { BasePortConfig, Port } from './port'

/*
  Define the PortValueObject type.
  It wraps an object (with keys mapping to port values) in a JSON serializable container,
  with the discriminant 'object'.
*/
export type PortValueObject<T extends Record<string, unknown>> = EnsureJSONSerializable<{
  valueType: 'object'
  value: T
}>

/*
  Object Port configuration.
  It extends BasePortConfig by adding a literal property type set to 'object'.
*/
export type ObjectPortConfig = BasePortConfig & { type: 'object' }

/*
  Final definition for an Object Port.
  The generic parameter T is used to specify the structure of the object.
  Value is enforced to have valueType equal to 'object'.
*/
export type ObjectPort<T extends Record<string, unknown>> = Port<'object', ObjectPortConfig, PortValueObject<T>>
