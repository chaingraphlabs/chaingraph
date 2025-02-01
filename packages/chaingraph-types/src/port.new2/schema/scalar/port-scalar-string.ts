// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/scalar/port-scalar-string.ts
import type { FullPort } from '../port'
import type { IStringPortConfig } from '../port-configs'
import type { PortTypeEnum } from '../port-types.enum'
import type { IStringPortValue } from '../port-value-types'

/*
  Final Scalar String Port type.
  Using FullPort to ensure config and value share the same type.
*/
export type ScalarStringPort = FullPort<PortTypeEnum.String>
