import type { BooleanPort, NumberPort, StringPort } from './port-full'
import { z } from 'zod'
import { BasePortConfigSchema } from './common/portConfigSchema'
import { PortTypeEnum } from './port-types.enum'
import { BooleanPortValueSchema, NumberPortValueSchema, StringPortValueSchema } from './zod-port-values'

/**
 * Refined schema for StringPort type.
 * This schema narrows FullPortSchema to specifically validate StringPort structure.
 */
export const StringPortSchema = z.object({
  config: BasePortConfigSchema.merge(z.object({
    type: z.literal(PortTypeEnum.String),
  })),
  value: StringPortValueSchema,
}) as z.ZodType<StringPort>

/**
 * Refined schema for NumberPort type.
 */
export const NumberPortSchema = z.object({
  config: BasePortConfigSchema.merge(z.object({
    type: z.literal(PortTypeEnum.Number),
  })),
  value: NumberPortValueSchema,
}) as z.ZodType<NumberPort>

/**
 * Refined schema for BooleanPort type.
 */
export const BooleanPortSchema = z.object({
  config: BasePortConfigSchema.merge(z.object({
    type: z.literal(PortTypeEnum.Boolean),
  })),
  value: BooleanPortValueSchema,
}) as z.ZodType<BooleanPort>
