// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/scalar/port-scalar-number.ts
import type { BasePortConfig, Port } from '../port'
import type { PortTypeEnum } from '../port-types.enum'
import type { INumberPortValue } from '../port-value-types'

/*
  Scalar (number) Port configuration.
  Extending BasePortConfig with a literal type PortTypeEnum.Number.
*/
export type ScalarNumberPortConfig = BasePortConfig & { type: PortTypeEnum.Number }

/*
  Final Scalar Number Port type.
  Now the "value" is just INumberPortValue, not a separate alias.
*/
export type ScalarNumberPort = Port<PortTypeEnum.Number, ScalarNumberPortConfig, INumberPortValue>
