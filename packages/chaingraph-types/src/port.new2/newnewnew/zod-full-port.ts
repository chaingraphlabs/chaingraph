import type { PortConfig } from './zod-port-configs'
import type { PortValue } from './zod-port-values'
import { z } from 'zod'
import { PortConfigUnionSchema } from './zod-port-configs'
import { PortValueUnionSchema } from './zod-port-values'

// Define the full port type
interface FullPortType {
  config: PortConfig
  value: PortValue
}

// Full Port Schema combining config and value
export const FullPortSchema = z.object({
  config: PortConfigUnionSchema,
  value: PortValueUnionSchema,
}) as z.ZodType<FullPortType>

// Export inferred type
export type FullPort = z.infer<typeof FullPortSchema>
