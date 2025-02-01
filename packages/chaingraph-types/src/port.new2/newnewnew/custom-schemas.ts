import type { BooleanPort, NumberPort, StringPort } from './port-full'
import { z } from 'zod'
import { PortTypeEnum } from './port-types.enum'
import { BasePortConfigSchema } from './zod-port-configs'

/**
 * Refined schema for StringPort type.
 * This schema narrows FullPortSchema to specifically validate StringPort structure.
 */
export const StringPortSchema: z.ZodType<StringPort> = z.object({
  config: BasePortConfigSchema.extend({
    type: z.literal(PortTypeEnum.String),
  }),
  value: z.object({
    type: z.literal(PortTypeEnum.String),
    value: z.string(),
  }),
})

/**
 * Refined schema for NumberPort type.
 */
export const NumberPortSchema: z.ZodType<NumberPort> = z.object({
  config: BasePortConfigSchema.extend({
    type: z.literal(PortTypeEnum.Number),
  }),
  value: z.object({
    type: z.literal(PortTypeEnum.Number),
    value: z.number(),
  }),
})

/**
 * Refined schema for BooleanPort type.
 */
export const BooleanPortSchema: z.ZodType<BooleanPort> = z.object({
  config: BasePortConfigSchema.extend({
    type: z.literal(PortTypeEnum.Boolean),
  }),
  value: z.object({
    type: z.literal(PortTypeEnum.Boolean),
    value: z.boolean(),
  }),
})
