import type { ConfigFromPortType } from '../config/types'
import { z } from 'zod'
import { Port } from '../base/port.base'
import { PortType } from '../config/constants'

/**
 * Boolean port implementation
 */
export class BooleanPort extends Port<ConfigFromPortType<PortType.Boolean>, boolean> {
  /**
   * Get schema for validating boolean values
   */
  getValueSchema(): z.ZodType<boolean> {
    return z.boolean()
  }

  /**
   * Get schema for validating boolean port configuration
   */
  getConfigSchema(): z.ZodType<ConfigFromPortType<PortType.Boolean>> {
    return z.object({
      type: z.literal(PortType.Boolean),
      defaultValue: z.boolean().optional(),
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
    return `BooleanPort(${this.hasValue() ? this.getValue() : 'undefined'})`
  }
}
