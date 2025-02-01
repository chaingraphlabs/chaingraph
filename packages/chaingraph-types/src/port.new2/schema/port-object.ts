// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/port-object.ts
import type { BasePortConfig, Port } from './port'
import type { PortTypeEnum } from './port-types.enum'
import type { IObjectPortValue } from './port-value-types'

/*
  Object Port configuration: extends BasePortConfig with type set to PortTypeEnum.Object.
*/
export type ObjectPortConfig = BasePortConfig & { type: PortTypeEnum.Object }

/*
  Final definition for an Object Port.
  Now the "value" is just IObjectPortValue, not a separate alias.
*/
export type ObjectPort = Port<PortTypeEnum.Object, ObjectPortConfig, IObjectPortValue>
