import type { ZodType } from 'zod'
import type { PortTypeEnum } from '../port-types.enum'
import { z } from 'zod'

/**
 * Generic port wrapper interface.
 * Used for port values – they always have a "type" and a "value"
 */
export interface PortWrapper<T, Type extends PortTypeEnum> {
  type: Type
  value: T
}

/**
 * Factory function to create a Zod schema for a port wrapper.
 * This function will be used to generate the schema for port values.
 *
 * @param literal - A literal from PortTypeEnum (e.g. PortTypeEnum.String)
 * @param valueSchema - The inner Zod schema for the actual value data.
 * @returns A Zod schema matching the PortWrapper interface.
 */
export function createPortWrapperSchema<ValueType, Type extends PortTypeEnum>(
  literal: Type,
  valueSchema: ZodType<ValueType>,
): ZodType<PortWrapper<ValueType, Type>> {
  return z.object({
    type: z.literal(literal) as ZodType<Type>,
    value: valueSchema,
  }) as ZodType<PortWrapper<ValueType, Type>>
}
