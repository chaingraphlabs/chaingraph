// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/scalar/port-scalar-boolean.ts
import type { FullPort } from '../port'
import type { IBooleanPortConfig } from '../port-configs'
import type { PortTypeEnum } from '../port-types.enum'
import type { IBooleanPortValue } from '../port-value-types'

/*
  Final Scalar Boolean Port type.
  Using FullPort to ensure config and value share the same type.
*/
export type ScalarBooleanPort = FullPort<PortTypeEnum.Boolean>
