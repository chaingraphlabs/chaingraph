import { z } from 'zod'
import { PortConfigUnionSchema } from './zod-port-configs'
import { PortValueUnionSchema } from './zod-port-values'

// Full Port Schema combining config and value
export const FullPortSchema = z.object({
  config: PortConfigUnionSchema,
  value: PortValueUnionSchema,
})

// Export inferred type
export type FullPort = z.infer<typeof FullPortSchema>
