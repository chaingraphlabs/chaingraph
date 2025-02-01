import type { EnsureJSONSerializable } from './json'

/*
  A generic base for Port values.
  It assigns a specific discriminant (valueType) and the actual value (V).
  Wrapped in EnsureJSONSerializable to enforce JSON serialization at compile time.
*/
export type PortValueBase<D extends string, V> = EnsureJSONSerializable<{
  valueType: D
  value: V
}>

/*
  Scalar Port Value definitions.
  These are defined once so that they can be reused.
*/
export type PortValueString = PortValueBase<'string', string>
export type PortValueNumber = PortValueBase<'number', number>
export type PortValueBoolean = PortValueBase<'boolean', boolean>

/*
  The union of all built‑in scalar port values.
*/
export type RawScalarPortValue =
  | PortValueString
  | PortValueNumber
  | PortValueBoolean
