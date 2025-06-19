/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Context for Web3 wallet integration
 */
export interface WalletContext {
  // Connection state
  isConnected: boolean

  // Wallet information
  address?: string
  chainId?: number

  // Provider type (metamask, walletconnect, etc.)
  providerType?: string

  // ENS name if available
  ensName?: string

  // Wallet capabilities
  capabilities?: {
    supportsBatchTransactions?: boolean
    supportsEIP1559?: boolean
    supportsEIP712?: boolean
  }

  // Last update timestamp
  lastUpdated?: number

  // RPC endpoint for read operations (if available)
  rpcUrl?: string
}
