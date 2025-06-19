/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { createEffect, createEvent, createStore, sample } from 'effector'
import type { WalletContext } from '@badaitech/chaingraph-types'
import type { Config } from 'wagmi'
import { getAccount, getChainId, watchAccount, watchChainId } from 'wagmi/actions'

// Events
export const walletConnected = createEvent<{ address: string; chainId: number }>()
export const walletDisconnected = createEvent()
export const accountChanged = createEvent<{ address: string }>()
export const chainChanged = createEvent<{ chainId: number }>()
export const initializeWalletConfig = createEvent<Config>()

// Stores
export const $walletContext = createStore<WalletContext>({
  isConnected: false,
})

export const $wagmiConfig = createStore<Config | null>(null)

// Effects
const initializeWalletWatchersFx = createEffect((config: Config) => {
  // Get initial state
  const account = getAccount(config)
  const chainId = getChainId(config)

  if (account.address) {
    walletConnected({
      address: account.address,
      chainId,
    })
  }

  // Watch for account changes
  const unsubAccount = watchAccount(config, {
    onChange(account) {
      if (account.address) {
        accountChanged({ address: account.address })
      } else {
        walletDisconnected()
      }
    },
  })

  // Watch for chain changes
  const unsubChain = watchChainId(config, {
    onChange(chainId) {
      chainChanged({ chainId })
    },
  })

  // Return cleanup function
  return () => {
    unsubAccount()
    unsubChain()
  }
})

// Update config store
sample({
  clock: initializeWalletConfig,
  target: $wagmiConfig,
})

// Initialize watchers when config is set
sample({
  clock: initializeWalletConfig,
  target: initializeWalletWatchersFx,
})

// Update wallet context on connection
sample({
  clock: walletConnected,
  source: $walletContext,
  fn: (context, { address, chainId }) => ({
    ...context,
    isConnected: true,
    address,
    chainId,
    lastUpdated: Date.now(),
  }),
  target: $walletContext,
})

// Update wallet context on disconnection
sample({
  clock: walletDisconnected,
  fn: () => ({
    isConnected: false,
  }),
  target: $walletContext,
})

// Update wallet context on account change
sample({
  clock: accountChanged,
  source: $walletContext,
  fn: (context, { address }) => ({
    ...context,
    address,
    lastUpdated: Date.now(),
  }),
  target: $walletContext,
})

// Update wallet context on chain change
sample({
  clock: chainChanged,
  source: $walletContext,
  fn: (context, { chainId }) => ({
    ...context,
    chainId,
    lastUpdated: Date.now(),
  }),
  target: $walletContext,
})

// Helper to get wallet context for execution
export const getWalletContextForExecution = (): WalletContext => {
  const context = $walletContext.getState()
  return {
    ...context,
    // Add default RPC URLs based on chain
    rpcUrl: context.chainId ? getDefaultRpcUrl(context.chainId) : undefined,
  }
}

function getDefaultRpcUrl(chainId: number): string | undefined {
  switch (chainId) {
    case 1:
      return 'https://eth.llamarpc.com'
    case 137:
      return 'https://polygon-rpc.com'
    case 56:
      return 'https://bsc-dataseed.binance.org'
    case 42161:
      return 'https://arb1.arbitrum.io/rpc'
    case 10:
      return 'https://mainnet.optimism.io'
    case 8453: // Base
      return 'https://mainnet.base.org'
    default:
      return undefined
  }
}