/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'

export const ArchAIContextSchema = z.object({
  agentID: z.string().optional(),
  agentSession: z.string().optional(),
  chatID: z.string().optional(),
  messageID: z.number().optional(),
})

/**
 * Context for BadAI integration
 */
export type ArchAIContext = z.infer<typeof ArchAIContextSchema>
