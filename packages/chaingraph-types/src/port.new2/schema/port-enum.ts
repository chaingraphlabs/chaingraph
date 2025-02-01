// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/port-enum.ts
import type { EnsureJSONSerializable } from './json'
import type { BasePortConfig, Port } from './port'
import type { PortTypeEnum } from './port-types.enum'
import type { IEnumPortValue } from './port-value-types'

/*
  A PortEnumOption represents an option inside an enum port.
  In our design, an option is another Port (here kept generic).
*/
export interface PortEnumOption {
  port: Port<any, any, any>
}

/*
  Enum Port configuration: extends BasePortConfig with type set to PortTypeEnum.Enum,
  and includes an array of options.
*/
export type EnumPortConfig = EnsureJSONSerializable<
  BasePortConfig & {
    type: PortTypeEnum.Enum
    options: PortEnumOption[]
  }
>

/*
  Final Enum Port type tying configuration and value together.
  Now the "value" is just IEnumPortValue, not a separate alias.
*/
export type EnumPort = Port<PortTypeEnum.Enum, EnumPortConfig, IEnumPortValue>
