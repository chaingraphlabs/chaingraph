/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { SerializedEdgeSchema } from '../edge'
import { SerializedNodeSchema } from '../node'

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
