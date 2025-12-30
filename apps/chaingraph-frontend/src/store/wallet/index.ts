/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// Export effects for auto-recreation
export * from './effects'

// Export types
export type { BalanceData, ConnectionState, ConnectorInfo } from './wallet.store'

// Export stores
export {
  $balance,
  $connectionState,
  $connectors,
  $currentChainName,
  $formattedAddress,
  $isWalletReady,
  $wagmiConfig,
  $walletContext,
} from './wallet.store'

// Export user action events
export {
  connectWallet,
  disconnectWallet,
  initializeWalletConfig,
  refreshBalance,
} from './wallet.store'

// Export helper functions
export { getWalletContextForExecution } from './wallet.store'

// Note: effects.ts is already included via `export * from './effects'` above
// The WALLET_EFFECTS_INITIALIZED marker export prevents tree-shaking
