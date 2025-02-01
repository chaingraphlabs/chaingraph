import type { BasePortConfig } from './port'
import type { IPortConfigUnion } from './port-configs'
// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/port-array-generic.ts
import type { PortTypeEnum } from './port-types.enum'
import type { IPortValueUnion } from './port-value-types'

/**
 * A specialized config interface for a parametric Array Port.
 * - type is always PortTypeEnum.Array.
 * - itemType is a second discriminator telling us the type of each array element.
 * - itemConfig is optional but can store a reference to that item's config if needed.
 */
export interface IGenericArrayPortConfig<ItemD extends PortTypeEnum> extends BasePortConfig {
  type: PortTypeEnum.Array
  /**
   * The type of elements in this array; must be one branch of PortTypeEnum.
   */
  itemType: ItemD
  /**
   * Optional field storing the config for the item type, if relevant.
   */
  itemConfig?: Extract<IPortConfigUnion, { type: ItemD }>
}

/**
 * A specialized value interface for a parametric Array Port.
 * - type is always PortTypeEnum.Array.
 * - The "value" is an array of items, each matching itemType.
 */
export interface IGenericArrayPortValue<ItemD extends PortTypeEnum> {
  type: PortTypeEnum.Array
  /**
   * The array's elements. Each element must match the item's port value type.
   */
  value: Array<Extract<IPortValueUnion, { type: ItemD }>>
}

/**
 * A final "GenericArrayPort" tying config and value together with the ItemD generic.
 * - The top-level port "type" is still PortTypeEnum.Array
 * - We add a second generic "ItemD" telling us exactly which branch of PortValue is allowed as an element.
 */
export interface GenericArrayPort<ItemD extends PortTypeEnum> {
  config: IGenericArrayPortConfig<ItemD>
  value: IGenericArrayPortValue<ItemD>
}
