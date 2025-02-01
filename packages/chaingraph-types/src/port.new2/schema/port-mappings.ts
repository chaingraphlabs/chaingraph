import type { GenericArrayPort } from './port-array-generic'
import type {
  IArrayPortConfig,
  IPortConfigUnion,
} from './port-configs'
// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/port-mappings.ts
import type { PortTypeEnum } from './port-types.enum'
import type {
  IBooleanPortValue,
  IEnumPortValue,
  INumberPortValue,
  IObjectPortValue,
  IStringPortValue,
} from './port-value-types'

/**
 * Map an item config type T to its corresponding port value.
 * For non-array configurations, we use our existing mapping.
 * For array configs, we recursively define it as a GenericArrayPort.
 */
export type MapItemConfigToValue<T extends IPortConfigUnion> =
  // If T is a generic array config, then map it to GenericArrayPort<U>,
  // where U is the nested item config.
  T extends IArrayPortConfig<infer U>
    ? GenericArrayPort<U>
    : T['type'] extends PortTypeEnum.String
      ? IStringPortValue
      : T['type'] extends PortTypeEnum.Number
        ? INumberPortValue
        : T['type'] extends PortTypeEnum.Boolean
          ? IBooleanPortValue
          : T['type'] extends PortTypeEnum.Enum
            ? IEnumPortValue
            : T['type'] extends PortTypeEnum.Object
              ? IObjectPortValue
              : never
