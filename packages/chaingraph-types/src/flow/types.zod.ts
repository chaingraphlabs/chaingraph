import { SerializedEdgeSchema } from '@chaingraph/types/edge/types.zod'
import { SerializedNodeSchema } from '@chaingraph/types/node/types.zod'
import { z } from 'zod'

export const SerializedFlowMetadataSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export const SerializedFlowSchema = z.object({
  id: z.string(),
  metadata: SerializedFlowMetadataSchema,
  nodes: z.array(SerializedNodeSchema),
  edges: z.array(SerializedEdgeSchema),
})

export type SerializedFlow = z.infer<typeof SerializedFlowSchema>
