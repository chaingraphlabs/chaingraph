// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/scalar/port-scalar-number.ts
import type { FullPort } from '../port'
import type { INumberPortConfig } from '../port-configs'
import type { PortTypeEnum } from '../port-types.enum'
import type { INumberPortValue } from '../port-value-types'

/*
  Final Scalar Number Port type.
  Using FullPort to ensure config and value share the same type.
*/
export type ScalarNumberPort = FullPort<PortTypeEnum.Number>
