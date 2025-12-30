/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { EdgeStatus } from './types'

/**
 * Schema for edge anchor control points
 */
export const EdgeAnchorSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  index: z.number(),
  parentNodeId: z.string().optional(),
  selected: z.boolean().optional(),
})

/**
 * Schema for edge metadata
 */
export const EdgeMetadataSchema = z.object({
  label: z.string().optional(),
  anchors: z.array(EdgeAnchorSchema).optional(),
  version: z.number().optional(),
}).passthrough()

export const SerializedEdgeSchema = z.object({
  id: z.string(),
  metadata: EdgeMetadataSchema.optional(),
  status: z.nativeEnum(EdgeStatus),
  sourceNodeId: z.string(),
  sourcePortId: z.string(),
  targetNodeId: z.string(),
  targetPortId: z.string(),
})

export type SerializedEdge = z.infer<typeof SerializedEdgeSchema>
