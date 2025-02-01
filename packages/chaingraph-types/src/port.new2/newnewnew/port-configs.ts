import type { z } from 'zod'
import type { PortTypeEnum } from './port-types.enum'
import type { PortConfigUnionSchema } from './zod-port-configs'

/*
  Instead of manually defining each port config interface,
  we derive the complete union type from our unified Zod schema.
*/
export type IPortConfigUnion = z.infer<typeof PortConfigUnionSchema>

/*
  Specialized config types using Extract.
  This ensures that if the underlying schema changes, these types update automatically.
*/
export type IStringPortConfig = Extract<IPortConfigUnion, { type: PortTypeEnum.String }>
export type INumberPortConfig = Extract<IPortConfigUnion, { type: PortTypeEnum.Number }>
export type IBooleanPortConfig = Extract<IPortConfigUnion, { type: PortTypeEnum.Boolean }>
export type IEnumPortConfig = Extract<IPortConfigUnion, { type: PortTypeEnum.Enum }>
export type IArrayPortConfig<ItemConfig extends IPortConfigUnion = IPortConfigUnion> = Extract<
  IPortConfigUnion,
  { type: PortTypeEnum.Array, itemConfig: ItemConfig }
>
export type IObjectPortConfig<Schema extends Record<string, IPortConfigUnion> = Record<string, IPortConfigUnion>> = Extract<
  IPortConfigUnion,
  { type: PortTypeEnum.Object, schema: Schema }
>
export type IStreamPortConfig<ItemConfig extends IPortConfigUnion = IPortConfigUnion> = Extract<
  IPortConfigUnion,
  { type: PortTypeEnum.Stream, mode: 'input' | 'output', itemConfig: ItemConfig }
>
