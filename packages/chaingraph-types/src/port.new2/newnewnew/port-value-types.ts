import type { z } from 'zod'
import type { EnsureJSONSerializable } from './json'
import type { IPortConfigUnion } from './port-configs'
import type { PortTypeEnum } from './port-types.enum'
import type { PortValueUnionSchema } from './zod-port-values'

/*
  Instead of manually writing interfaces for each port value type,
  we define a unified PortValue type from the PortValueUnionSchema.
*/
export type PortValue = EnsureJSONSerializable<z.infer<typeof PortValueUnionSchema>>

/*
  Specialized value types using Extract.
  This ensures that if the underlying schema changes, these types update automatically.
*/
export type IStringPortValue = Extract<PortValue, { type: PortTypeEnum.String }>
export type INumberPortValue = Extract<PortValue, { type: PortTypeEnum.Number }>
export type IBooleanPortValue = Extract<PortValue, { type: PortTypeEnum.Boolean }>
export type IEnumPortValue = Extract<PortValue, { type: PortTypeEnum.Enum }>

/*
  Generic array and object value types that maintain their relationship
  with the corresponding config types.
*/
export type IGenericArrayPortValue<ItemConfig extends IPortConfigUnion> = Extract<
  PortValue,
  {
    type: PortTypeEnum.Array
    value: Array<PortValue>
  }
>

export type IGenericObjectPortValue<Schema extends { [key: string]: IPortConfigUnion }> = Extract<
  PortValue,
  {
    type: PortTypeEnum.Object
    value: { [K in keyof Schema]: PortValue }
  }
>

/*
  Helper type to map from a config type to its corresponding value type.
  This maintains the type relationships while using the unified schema.
*/
export type MapPortConfigToValue<T extends IPortConfigUnion> = T extends { type: infer Type }
  ? Type extends PortTypeEnum.String
    ? IStringPortValue
    : Type extends PortTypeEnum.Number
      ? INumberPortValue
      : Type extends PortTypeEnum.Boolean
        ? IBooleanPortValue
        : Type extends PortTypeEnum.Enum
          ? IEnumPortValue
          : Type extends PortTypeEnum.Array
            ? T extends { itemConfig: infer ItemConfig }
              ? IGenericArrayPortValue<ItemConfig & IPortConfigUnion>
              : never
            : Type extends PortTypeEnum.Object
              ? T extends { schema: infer Schema }
                ? IGenericObjectPortValue<Schema & { [key: string]: IPortConfigUnion }>
                : never
              : never
  : never
