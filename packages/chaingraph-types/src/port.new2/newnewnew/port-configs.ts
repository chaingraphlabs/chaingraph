import type { z } from 'zod'
import type {
  ArrayPortConfigSchema,
  BooleanPortConfigSchema,
  EnumPortConfigSchema,
  NumberPortConfigSchema,
  ObjectPortConfigSchema,
  PortConfigUnionSchema,
  StringPortConfigSchema,
} from './zod-port-configs'

/**
 * String Port Config
 */
export type IStringPortConfig = z.infer<typeof StringPortConfigSchema>

/**
 * Number Port Config
 */
export type INumberPortConfig = z.infer<typeof NumberPortConfigSchema>

/**
 * Boolean Port Config
 */
export type IBooleanPortConfig = z.infer<typeof BooleanPortConfigSchema>

/**
 * Enum Port Config, with an "options" field that is an array of full port configs.
 */
export type IEnumPortConfig = z.infer<typeof EnumPortConfigSchema>

/**
 * Generic Array Port Config – parameterized by ItemConfig.
 * The "itemConfig" field fully describes the configuration for each array element.
 */
export type IArrayPortConfig<ItemConfig extends IPortConfigUnion> = z.infer<typeof ArrayPortConfigSchema> & {
  itemConfig: ItemConfig
}

/**
 * Generic Object Port Config – parameterized by Schema.
 * "schema" is a record mapping field names to port configurations.
 */
export type IObjectPortConfig<Schema extends { [key: string]: IPortConfigUnion }> = z.infer<typeof ObjectPortConfigSchema> & {
  schema: Schema
}

/**
 * The union of all possible port configuration types.
 * (For IArrayPortConfig and IObjectPortConfig we use a generic form.)
 */
export type IPortConfigUnion = z.infer<typeof PortConfigUnionSchema>
