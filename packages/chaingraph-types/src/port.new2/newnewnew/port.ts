import type { EnsureJSONSerializable, JSONValue } from './json'
import type { PortTypeEnum } from './port-types.enum'

/*
  BasePortConfig: Every port configuration must at least have an id,
  and may include a name and metadata. All fields are JSON serializable.
*/
export type BasePortConfig = EnsureJSONSerializable<{
  id?: string
  name?: string
  metadata?: Record<string, JSONValue>
}>

/*
  FullPort: A generic port ties together a configuration and a value.
  Both must carry the same literal "type" (from PortTypeEnum).

  The type parameter D is constrained to be a specific literal from PortTypeEnum,
  and both Config and Value must have a 'type' property matching that literal.
*/
export interface FullPort<
  D extends PortTypeEnum,
  Config extends BasePortConfig & { type: D },
  Value extends { type: D, value: any },
> {
  config: Config
  value: Value
}
