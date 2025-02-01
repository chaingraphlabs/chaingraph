// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/port.ts
import type { EnsureJSONSerializable, JSONValue } from './json'

/*
  Base Port configuration – every port should have an id, and may have a name and metadata.
  All fields must be JSON serializable.
*/
export type BasePortConfig = EnsureJSONSerializable<{
  id: string
  name?: string
  metadata?: Record<string, JSONValue>
}>

/*
  Generic Port type that ties the config and the value together by a common discriminant D.
  - Config must have a literal property `type: D`
  - Value must have a literal property `valueType: D`
*/
export interface Port<
  D extends string,
  Config extends { type: D },
  Value extends { valueType: D },
> {
  config: Config
  value: Value
}
