/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { ArchAIContextSchema } from './arch-a-i-context'
import { WalletContextSchema } from './wallet-context'

export const IntegrationContextSchema = z.object({
  archai: ArchAIContextSchema.optional(),
  wallet: WalletContextSchema.optional(),
  external: z.record(z.any()).optional(),
}).catchall(z.any())

/**
 * Integration context that can be passed to executions
 */
export type IntegrationContext = z.infer<typeof IntegrationContextSchema>
