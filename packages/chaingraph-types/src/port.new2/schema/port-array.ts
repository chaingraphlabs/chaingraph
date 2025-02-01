// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/port-array.ts

import type { BasePortConfig, Port } from './port'
import type { PortTypeEnum } from './port-types.enum'
import type { IArrayPortValue } from './port-value-types'

/*
  Array Port configuration: extends BasePortConfig with type set to PortTypeEnum.Array.
*/
export type ArrayPortConfig = BasePortConfig & { type: PortTypeEnum.Array }

/*
  Final definition for an Array Port.
  Now the "value" is just IArrayPortValue, not a separate alias.
*/
export type ArrayPort = Port<PortTypeEnum.Array, ArrayPortConfig, IArrayPortValue>
