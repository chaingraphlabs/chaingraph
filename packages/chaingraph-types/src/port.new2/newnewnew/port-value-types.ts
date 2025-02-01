import type { EnsureJSONSerializable } from './json'
import type { IArrayPortConfig, IBooleanPortConfig, IEnumPortConfig, INumberPortConfig, IObjectPortConfig, IPortConfigUnion, IStringPortConfig } from './port-configs'
import type { PortTypeEnum } from './port-types.enum'

/** String port value. */
export interface IStringPortValue {
  type: PortTypeEnum.String
  value: string
}

/** Number port value. */
export interface INumberPortValue {
  type: PortTypeEnum.Number
  value: number
}

/** Boolean port value. */
export interface IBooleanPortValue {
  type: PortTypeEnum.Boolean
  value: boolean
}

/** Enum port value. */
export interface IEnumPortValue {
  type: PortTypeEnum.Enum
  value: string
}

/**
 * Mapping type: Given a port config T, derive its corresponding port value.
 * For array and object types, the mapping is recursive.
 */
export type MapPortConfigToValue<T extends IPortConfigUnion> =
  T extends IStringPortConfig ? IStringPortValue :
    T extends INumberPortConfig ? INumberPortValue :
      T extends IBooleanPortConfig ? IBooleanPortValue :
        T extends IEnumPortConfig ? IEnumPortValue :
          T extends IArrayPortConfig<infer ItemConfig> ? IGenericArrayPortValue<ItemConfig> :
            T extends IObjectPortConfig<infer Schema> ? IGenericObjectPortValue<Schema> :
              never

/**
 * Generic Array Port Value.
 * The "value" property is an array of port values derived from the itemConfig.
 */
export interface IGenericArrayPortValue<ItemConfig extends IPortConfigUnion> {
  type: PortTypeEnum.Array
  value: Array<MapPortConfigToValue<ItemConfig>>
}

/**
 * Generic Object Port Value.
 * The "value" property is an object whose keys are the schema's keys and whose values
 * are derived from the corresponding port config.
 */
export interface IGenericObjectPortValue<Schema extends { [key: string]: IPortConfigUnion }> {
  type: PortTypeEnum.Object
  value: { [K in keyof Schema]: MapPortConfigToValue<Schema[K]> }
}

/**
 * The final PortValue union.
 * We wrap the union in EnsureJSONSerializable.
 */
export type PortValue = EnsureJSONSerializable<
  IStringPortValue |
  INumberPortValue |
  IBooleanPortValue |
  IEnumPortValue |
  IGenericArrayPortValue<IPortConfigUnion> |
  IGenericObjectPortValue<{ [key: string]: IPortConfigUnion }>
>
