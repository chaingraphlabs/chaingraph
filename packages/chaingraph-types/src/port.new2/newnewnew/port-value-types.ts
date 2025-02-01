import type { z } from 'zod'
import type { EnsureJSONSerializable } from './json'
import type {
  IArrayPortConfig,
  IBooleanPortConfig,
  IEnumPortConfig,
  INumberPortConfig,
  IObjectPortConfig,
  IPortConfigUnion,
  IStringPortConfig,
} from './port-configs'
import type {
  ArrayPortValueSchema,
  BooleanPortValueSchema,
  EnumPortValueSchema,
  NumberPortValueSchema,
  ObjectPortValueSchema,
  PortValueUnionSchema,
  StringPortValueSchema,
} from './zod-port-values'

/** String port value. */
export type IStringPortValue = z.infer<typeof StringPortValueSchema>

/** Number port value. */
export type INumberPortValue = z.infer<typeof NumberPortValueSchema>

/** Boolean port value. */
export type IBooleanPortValue = z.infer<typeof BooleanPortValueSchema>

/** Enum port value. */
export type IEnumPortValue = z.infer<typeof EnumPortValueSchema>

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
export type IGenericArrayPortValue<ItemConfig extends IPortConfigUnion> = z.infer<typeof ArrayPortValueSchema> & {
  value: Array<MapPortConfigToValue<ItemConfig>>
}

/**
 * Generic Object Port Value.
 * The "value" property is an object whose keys are the schema's keys and whose values
 * are derived from the corresponding port config.
 */
export type IGenericObjectPortValue<Schema extends { [key: string]: IPortConfigUnion }> = z.infer<typeof ObjectPortValueSchema> & {
  value: { [K in keyof Schema]: MapPortConfigToValue<Schema[K]> }
}

/**
 * The final PortValue union.
 * We wrap the union in EnsureJSONSerializable.
 */
export type PortValue = EnsureJSONSerializable<z.infer<typeof PortValueUnionSchema>>
