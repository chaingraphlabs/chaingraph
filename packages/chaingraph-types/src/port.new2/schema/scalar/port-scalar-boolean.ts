import type { BasePortConfig, Port } from '../port'
// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/scalar/port-scalar-boolean.ts
import type { PortTypeEnum } from '../port-types.enum'
import type { IBooleanPortValue } from '../port-value-types'

/*
  Scalar (boolean) Port configuration.
  Extending BasePortConfig with a literal type PortTypeEnum.Boolean.
*/
export type ScalarBooleanPortConfig = BasePortConfig & { type: PortTypeEnum.Boolean }

/*
  Final Scalar Boolean Port type.
  Now the "value" is just IBooleanPortValue, not a separate alias.
*/
export type ScalarBooleanPort = Port<PortTypeEnum.Boolean, ScalarBooleanPortConfig, IBooleanPortValue>
