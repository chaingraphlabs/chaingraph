import type { ConfigFromPortType } from '../config/types'
import { z } from 'zod'
import { Port } from '../base/port.base'
import { PortType } from '../config/constants'
import { stringValidationSchema } from '../config/types'

/**
 * String port implementation
 */
export class StringPort extends Port<ConfigFromPortType<PortType.String>, string> {
  /**
   * Get schema for validating string values
   */
  getValueSchema(): z.ZodType<string> {
    let schema = z.string()

    // Apply validation rules if configured
    if (this.config.validation) {
      const { minLength, maxLength } = this.config.validation

      if (typeof minLength === 'number') {
        schema = schema.min(minLength, `String must be at least ${minLength} characters long`)
      }

      if (typeof maxLength === 'number') {
        schema = schema.max(maxLength, `String must be at most ${maxLength} characters long`)
      }
    }

    return schema
  }

  /**
   * Get schema for validating string port configuration
   */
  getConfigSchema(): z.ZodType<ConfigFromPortType<PortType.String>> {
    return z.object({
      type: z.literal(PortType.String),
      validation: stringValidationSchema.optional(),
      defaultValue: z.string().optional(),
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
    return `StringPort(${this.hasValue() ? `"${this.getValue()}"` : 'undefined'})`
  }
}
