// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/port.ts
import type { EnsureJSONSerializable, JSONValue } from './json'
import type { IPortConfigUnion } from './port-configs'
import type { PortTypeEnum } from './port-types.enum'
import type { IPortValueUnion } from './port-value-types'

/*
  Base Port configuration – every port should have an id, and may have a name and metadata.
  All fields must be JSON serializable.
*/
export type BasePortConfig = EnsureJSONSerializable<{
  id: string
  name?: string
  metadata?: Record<string, JSONValue>
}>

/**
 * A simpler approach: define a single type for a "FullPort" that ensures config and value share the same type: D.
 * We do that by Extracting from the union definitions.
 */
export interface FullPort<D extends PortTypeEnum> {
  config: Extract<IPortConfigUnion, { type: D }>
  value: Extract<IPortValueUnion, { type: D }>
}

/**
 * The union of all possible ports.
 */
export type PortUnion =
  | FullPort<PortTypeEnum.String>
  | FullPort<PortTypeEnum.Number>
  | FullPort<PortTypeEnum.Boolean>
  | FullPort<PortTypeEnum.Enum>
  | FullPort<PortTypeEnum.Array>
  | FullPort<PortTypeEnum.Object>
