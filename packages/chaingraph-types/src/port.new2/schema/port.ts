// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/port.ts
import type { EnsureJSONSerializable, JSONValue } from './json'
import type { PortTypeEnum } from './port-types.enum'

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
  Generic Port type that ties config and value together by a common discriminant D.
  Both the config and the value MUST have a property "type" equal to D.
*/
export interface Port<
  D extends PortTypeEnum,
  Config extends { type: D },
  Value extends { type: D },
> {
  config: Config
  value: Value
}
