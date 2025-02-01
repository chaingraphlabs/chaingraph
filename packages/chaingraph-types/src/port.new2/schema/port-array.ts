import type { EnsureJSONSerializable } from './json'
import type { BasePortConfig, Port } from './port'

/*
  Define the PortValueArray type.
  It wraps an array of elements (of type E) in a JSON serializable container,
  with the discriminant 'array'.
*/
export type PortValueArray<E> = EnsureJSONSerializable<{
  valueType: 'array'
  value: E[]
}>

/*
  Array Port configuration.
  It extends BasePortConfig by adding a literal property type set to 'array'.
*/
export type ArrayPortConfig = BasePortConfig & { type: 'array' }

/*
  Final definition for an Array Port.
  The generic parameter E is used to specify the type of elements that the array holds.
  Value is enforced to have valueType equal to 'array'.
*/
export type ArrayPort<E> = Port<'array', ArrayPortConfig, PortValueArray<E>>
