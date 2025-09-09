/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'

export const WalletContextSchema = z.object({
  // Connection state
  isConnected: z.boolean(),

  // Wallet information
  address: z.string().optional(),
  chainId: z.number().optional(),

  // Provider type (metamask, walletconnect, etc.)
  providerType: z.string().optional(),

  // ENS name if available
  ensName: z.string().optional(),

  // Wallet capabilities
  capabilities: z.object({
    supportsBatchTransactions: z.boolean().optional(),
    supportsEIP1559: z.boolean().optional(),
    supportsEIP712: z.boolean().optional(),
  }).optional(),

  // Last update timestamp
  lastUpdated: z.number().optional(),

  // RPC endpoint for read operations (if available)
  rpcUrl: z.string().optional(),
})

/**
 * Context for Web3 wallet integration
 */
export type WalletContext = z.infer<typeof WalletContextSchema>
