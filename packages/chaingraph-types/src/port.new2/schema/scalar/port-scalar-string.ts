// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/scalar/port-scalar-string.ts
import type { BasePortConfig, Port } from '../port'
import type { PortTypeEnum } from '../port-types.enum'
import type { IStringPortValue } from '../port-value-types'

/*
  Scalar (string) Port configuration.
  Extending BasePortConfig with a literal type PortTypeEnum.String.
*/
export type ScalarStringPortConfig = BasePortConfig & { type: PortTypeEnum.String }

/*
  Final Scalar String Port type.
  Now the "value" is just IStringPortValue, not a separate alias.
*/
export type ScalarStringPort = Port<PortTypeEnum.String, ScalarStringPortConfig, IStringPortValue>
