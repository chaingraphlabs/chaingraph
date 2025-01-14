import { EdgeStatus } from '@chaingraph/types'
import { z } from 'zod'

export const SerializedEdgeSchema = z.object({
  id: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  status: z.nativeEnum(EdgeStatus),
  sourceNodeId: z.string(),
  sourcePortId: z.string(),
  targetNodeId: z.string(),
  targetPortId: z.string(),
})
