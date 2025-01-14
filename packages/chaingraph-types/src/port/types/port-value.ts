import { MultiChannel } from '@chaingraph/types/port'
import Decimal from 'decimal.js'
import { z } from 'zod'

export type NumberPortValue = number | string | Decimal

export interface PortValueArray extends Array<PortValue> {}
export interface PortValueObject {
  [key: string]: PortValue
}

export type PortValue =
  | string
  | NumberPortValue
  | boolean
  | PortValueArray
  | PortValueObject
  | MultiChannel<any>
  | null

export const NumberPortValueSchema = z.union([
  z.number(),
  z.string(),
  z.instanceof(Decimal),
])

export const PortValueSchema: z.ZodType<PortValue> = z.lazy(() =>
  z.union([
    z.string(),
    NumberPortValueSchema,
    z.boolean(),
    z.array(PortValueSchema),
    z.record(z.string(), PortValueSchema),
    z.null(),
    z.instanceof(MultiChannel<any>),
    z.any(),
  ]),
)
