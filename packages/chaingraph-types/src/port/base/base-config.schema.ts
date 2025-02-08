/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { JSONValueSchema } from './json'
import { PortDirection } from './types'
import { basePortConfigUISchema } from './ui-config.schema'

/**
 * Base Zod schema for all port configurations
 * This schema should be used as the foundation for all concrete port config schemas
 * to ensure consistent validation and structure across all port types.
 */
export const basePortConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  metadata: z.record(z.string(), JSONValueSchema).optional(),
  required: z.boolean().optional(),
  parentId: z.string().optional(),
  nodeId: z.string().optional(),
  key: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  direction: z.nativeEnum(PortDirection).optional(),
  ui: basePortConfigUISchema.optional(),
}).passthrough()

/**
 * Helper type to extract the inferred type from the base schema
 */
export type BasePortConfigType = z.infer<typeof basePortConfigSchema>
