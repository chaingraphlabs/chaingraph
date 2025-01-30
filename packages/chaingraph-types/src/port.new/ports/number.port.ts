import type { ConfigFromPortType } from '../config/types'
import { z } from 'zod'
import { Port } from '../base/port.base'
import { PortType } from '../config/constants'
import { numberValidationSchema } from '../config/types'

/**
 * Number port implementation
 */
export class NumberPort extends Port<ConfigFromPortType<PortType.Number>, number> {
  /**
   * Get schema for validating number values
   */
  getValueSchema(): z.ZodType<number> {
    let schema = z.number()

    // Apply validation rules if configured
    if (this.config.validation) {
      const { min, max, integer } = this.config.validation

      if (typeof min === 'number') {
        schema = schema.min(min, `Number must be greater than or equal to ${min}`)
      }

      if (typeof max === 'number') {
        schema = schema.max(max, `Number must be less than or equal to ${max}`)
      }

      if (integer) {
        schema = schema.int('Number must be an integer')
      }
    }

    return schema
  }

  /**
   * Get schema for validating number port configuration
   */
  getConfigSchema(): z.ZodType<ConfigFromPortType<PortType.Number>> {
    return z.object({
      type: z.literal(PortType.Number),
      validation: numberValidationSchema.optional(),
      defaultValue: z.number().optional(),
      id: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      optional: z.boolean().optional(),
      metadata: z.record(z.unknown()).optional(),
    })
  }

  /**
   * Convert value to string representation
   */
  toString(): string {
    return `NumberPort(${this.hasValue() ? this.getValue() : 'undefined'})`
  }
}
