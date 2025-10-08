/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { WalletContext } from '@badaitech/chaingraph-types'
import type { Config } from 'wagmi'
import { combine, sample } from 'effector'
import { formatEther } from 'viem'
import { connect, disconnect, getAccount, getBalance, getChainId, getConnectors, reconnect, watchAccount, watchChainId } from 'wagmi/actions'
import { walletDomain } from '../domains'

// ============= Types =============
export interface ConnectionState {
  isPending: boolean
  isConnecting: boolean
  isDisconnecting: boolean
  error: Error | null
  status: 'idle' | 'connecting' | 'connected' | 'disconnecting' | 'error'
}

export interface BalanceData {
  value: bigint
  decimals: number
  symbol: string
  formatted: string
}

export interface ConnectorInfo {
  id: string
  name: string
  type: string
  icon?: string
  uid: string
}

// ============= Events =============
// Internal events (from watchers)
export const walletConnected = walletDomain.createEvent<{ address: string, chainId: number }>()
export const walletDisconnected = walletDomain.createEvent()
export const accountChanged = walletDomain.createEvent<{ address: string }>()
export const chainChanged = walletDomain.createEvent<{ chainId: number }>()
export const initializeWalletConfig = walletDomain.createEvent<Config>()

// User action events (for components)
export const connectWallet = walletDomain.createEvent()
export const disconnectWallet = walletDomain.createEvent()
export const refreshBalance = walletDomain.createEvent()

// ============= Stores =============
export const $walletContext = walletDomain.createStore<WalletContext>({
  isConnected: false,
})

export const $wagmiConfig = walletDomain.createStore<Config | null>(null)

export const $connectionState = walletDomain.createStore<ConnectionState>({
  isPending: false,
  isConnecting: false,
  isDisconnecting: false,
  error: null,
  status: 'idle',
})

export const $balance = walletDomain.createStore<BalanceData | null>(null)

export const $connectors = walletDomain.createStore<ConnectorInfo[]>([])

// ============= Derived Stores =============
export const $isWalletReady = combine(
  $wagmiConfig,
  $walletContext,
  (config, wallet) => config !== null && wallet.isConnected,
)

export const $formattedAddress = $walletContext.map(ctx =>
  ctx.address
    ? `${ctx.address.slice(0, 6)}...${ctx.address.slice(-4)}`
    : '',
)

export const $currentChainName = $walletContext.map((ctx) => {
  if (!ctx.chainId)
    return ''
  const chainMap: Record<number, string> = {
    1: 'Ethereum Mainnet',
    137: 'Polygon',
    56: 'BNB Smart Chain',
    42161: 'Arbitrum One',
    10: 'Optimism',
    8453: 'Base',
  }
  return chainMap[ctx.chainId] || `Chain ${ctx.chainId}`
})

// ============= Effects =============
const initializeWalletWatchersFx = walletDomain.createEffect(async (config: Config) => {
  // Try to reconnect to previously connected wallet
  // This properly waits for storage rehydration
  try {
    const reconnectResult = await reconnect(config)
    // If reconnect succeeded and we have accounts, trigger walletConnected
    if (reconnectResult.length > 0 && reconnectResult[0].accounts.length > 0) {
      walletConnected({
        address: reconnectResult[0].accounts[0],
        chainId: reconnectResult[0].chainId,
      })
    }
  } catch (error) {
    // Reconnect failed (no previous session or user rejected) - this is fine
    console.debug('[chaingraph] Auto-reconnect skipped:', error)
  }

  // Watch for account changes
  const unsubAccount = watchAccount(config, {
    onChange(account, prevAccount) {
      // Check if address actually changed
      if (prevAccount?.address && account.address && prevAccount.address !== account.address) {
        // Treat as reconnection with new address
        walletConnected({
          address: account.address,
          chainId: getChainId(config),
        })
      } else if (account.address && !prevAccount?.address) {
        // New connection
        walletConnected({
          address: account.address,
          chainId: getChainId(config),
        })
      } else if (!account.address && prevAccount?.address) {
        // Disconnection
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

export const connectWalletFx = walletDomain.createEffect(async (config: Config) => {
  // Check if already connected
  const currentAccount = getAccount(config)

  // If already connected with an address, just return the current account
  if (currentAccount.isConnected && currentAccount.address) {
    return currentAccount
  }

  // If not connected, find injected connector and connect
  const connectors = getConnectors(config)
  const injected = connectors.find(c => c.id === 'injected')
  if (!injected) {
    throw new Error('No injected wallet found (e.g., MetaMask, Coinbase Wallet)')
  }

  // If connector is connected but account shows disconnected, disconnect first
  if (currentAccount.isConnected && !currentAccount.address) {
    await disconnect(config)
  }

  // Now connect
  await connect(config, { connector: injected })
  return getAccount(config)
})

export const disconnectWalletFx = walletDomain.createEffect(async (config: Config) => {
  await disconnect(config)
})

export const getBalanceFx = walletDomain.createEffect(async ({
  config,
  address,
}: {
  config: Config
  address: string
}): Promise<BalanceData> => {
  const balance = await getBalance(config, { address: address as `0x${string}` })
  return {
    value: balance.value,
    decimals: balance.decimals,
    symbol: balance.symbol,
    formatted: formatEther(balance.value),
  }
})

export const getConnectorsFx = walletDomain.createEffect(async (config: Config): Promise<ConnectorInfo[]> => {
  const connectors = getConnectors(config)
  return connectors.map(connector => ({
    id: connector.id,
    name: connector.name,
    type: connector.type,
    icon: connector.icon,
    uid: connector.uid,
  }))
})

// ============= Store Reactions to Effects =============
$connectionState
  .on(connectWalletFx.pending, (state, pending) => ({
    ...state,
    isPending: pending,
    isConnecting: pending,
    status: pending ? 'connecting' : state.status,
    error: null,
  }))
  .on(connectWalletFx.done, state => ({
    ...state,
    isPending: false,
    isConnecting: false,
    status: 'connected',
    error: null,
  }))
  .on(connectWalletFx.fail, (state, { error }) => ({
    ...state,
    isPending: false,
    isConnecting: false,
    status: 'error',
    error,
  }))
  .on(disconnectWalletFx.pending, (state, pending) => ({
    ...state,
    isPending: pending,
    isDisconnecting: pending,
  }))
  .on(disconnectWalletFx.done, state => ({
    ...state,
    isPending: false,
    isDisconnecting: false,
    status: 'idle',
    error: null,
  }))
  .on(walletConnected, state => ({
    ...state,
    status: 'connected' as const,
  }))
  .on(walletDisconnected, state => ({
    ...state,
    status: 'idle' as const,
  }))

$balance
  .on(getBalanceFx.doneData, (_, balance) => balance)
  .reset(walletDisconnected)

$connectors
  .on(getConnectorsFx.doneData, (_, connectors) => connectors)

// ============= Store Updates =============
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

// ============= Reactive Flows (User Actions) =============
// Connect wallet when user clicks connect
sample({
  clock: connectWallet,
  source: $wagmiConfig,
  filter: (config): config is Config => config !== null,
  target: connectWalletFx,
})

// Explicitly trigger walletConnected when connect completes
// This ensures the state updates even if the watcher doesn't fire (race condition)
sample({
  clock: connectWalletFx.done,
  source: $wagmiConfig,
  filter: (config, { result }) => config !== null && !!result.address,
  fn: (config, { result }) => ({
    address: result.address!,
    chainId: result.chainId || getChainId(config!),
  }),
  target: walletConnected,
})

// Disconnect wallet when user clicks disconnect
sample({
  clock: disconnectWallet,
  source: $wagmiConfig,
  filter: (config): config is Config => config !== null,
  target: disconnectWalletFx,
})

// Trigger walletDisconnected when disconnect completes
sample({
  clock: disconnectWalletFx.done,
  target: walletDisconnected,
})

// Auto-fetch balance when wallet connects
sample({
  clock: walletConnected,
  source: $wagmiConfig,
  filter: (config, { address }) => config !== null && !!address,
  fn: (config, { address }) => ({ config: config as Config, address }),
  target: getBalanceFx,
})

// Refresh balance on demand
sample({
  clock: refreshBalance,
  source: combine($wagmiConfig, $walletContext),
  filter: ([config, wallet]) => config !== null && wallet.isConnected && !!wallet.address,
  fn: ([config, wallet]) => ({ config: config as Config, address: wallet.address as string }),
  target: getBalanceFx,
})

// Fetch connectors when config initialized
sample({
  clock: initializeWalletConfig,
  target: getConnectorsFx,
})

// Helper to get wallet context for execution
export function getWalletContextForExecution(): WalletContext {
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
