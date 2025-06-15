/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { EdgeStatus } from './types'

export const SerializedEdgeSchema = z.object({
  id: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  status: z.nativeEnum(EdgeStatus),
  sourceNodeId: z.string(),
  sourcePortId: z.string(),
  targetNodeId: z.string(),
  targetPortId: z.string(),
})

export type SerializedEdgeType = z.infer<typeof SerializedEdgeSchema>
