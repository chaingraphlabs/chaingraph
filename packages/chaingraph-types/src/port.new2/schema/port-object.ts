import type { FullPort } from './port'
// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/port-object.ts
import type { PortTypeEnum } from './port-types.enum'

/*
  Final definition for an Object Port.
  Using FullPort to ensure config and value share the same type.
*/
export type ObjectPort = FullPort<PortTypeEnum.Object>
