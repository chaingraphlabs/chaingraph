import type { EnsureJSONSerializable } from './json'
import type { BasePortConfig, Port } from './port'

/*
  A PortEnumOption represents an option inside an enum port.
  In our design, an option is simply another port.
  (Using a type alias instead of an interface for consistency.)
*/
export interface PortEnumOption {
  port: Port<any, any, any>
}

/*
  Enum Port configuration extends the BasePortConfig by:
    - Adding a literal property type set to 'enum'
    - Including an 'options' array of PortEnumOption.
*/
export type EnumPortConfig = EnsureJSONSerializable<
  BasePortConfig & {
    type: 'enum'
    options: PortEnumOption[]
  }
>

/*
  Enum Port Value is a JSON serializable object with a literal property valueType 'enum'
  and a value that is the identifier (string) of the selected option.
*/
export type EnumPortValue = EnsureJSONSerializable<{
  valueType: 'enum'
  value: string
}>

/*
  Final Enum Port type tying the config and value together using the discriminant 'enum'.
*/
export type EnumPort = Port<'enum', EnumPortConfig, EnumPortValue>
