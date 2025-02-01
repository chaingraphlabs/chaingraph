import type { ZodObject, ZodRawShape } from 'zod'
import type { PortTypeEnum } from '../port-types.enum'
import { z } from 'zod'

// Define a JSONValue schema that matches the JSONValue type
const JSONValueSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JSONValueSchema),
    z.record(JSONValueSchema),
  ]),
)

// Base configuration fields shared by all ports
export const BasePortConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  metadata: z.record(JSONValueSchema).optional(),
})

/**
 * Factory function to create a port configuration schema.
 * Unlike the value wrapper, the config is a flat object.
 *
 * @param literal - A literal from PortTypeEnum (e.g. PortTypeEnum.String)
 * @param extraSchema - A Zod object schema for any additional fields specific to the port type.
 * @returns A Zod schema representing the full port configuration.
 */
export function createPortConfigSchema<T extends ZodRawShape>(
  literal: PortTypeEnum,
  extraSchema: ZodObject<T>,
) {
  return BasePortConfigSchema.merge(z.object({ type: z.literal(literal) })).merge(extraSchema)
}

// Export the JSONValue schema for use in other files
export { JSONValueSchema }
