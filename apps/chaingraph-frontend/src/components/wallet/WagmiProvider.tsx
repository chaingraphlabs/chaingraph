/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ReactNode } from 'react'
import { useEffect } from 'react'

/**
 * @deprecated WagmiProvider is no longer needed and will be removed in v1.0.0.
 *
 * Chaingraph now uses Effector stores with wagmi Actions API instead of React Context.
 * This means no provider is needed - wallet functionality works without it.
 *
 * **Migration Guide:**
 *
 * For standalone apps:
 * ```tsx
 * // Old (still works but deprecated)
 * <WagmiProvider>
 *   <ChainGraphProvider>
 *     <Flow />
 *   </ChainGraphProvider>
 * </WagmiProvider>
 *
 * // New (recommended)
 * <ChainGraphProvider>
 *   <Flow />
 * </ChainGraphProvider>
 * ```
 *
 * For apps integrating chaingraph (Arch, CT, OKX):
 * ```tsx
 * import { initializeWalletConfig } from '@badaitech/chaingraph-frontend'
 *
 * // Initialize with your wagmi config
 * initializeWalletConfig(yourWagmiConfig)
 *
 * // Then use chaingraph normally - no provider conflicts!
 * <ChainGraphProvider>
 *   <Flow />
 * </ChainGraphProvider>
 * ```
 *
 * @see {@link https://docs.chaingraph.dev/wallet-integration Documentation}
 */
export function WagmiProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    console.warn(
      '[chaingraph] WagmiProvider is deprecated and will be removed in v1.0.0. '
      + 'Wallet functionality now uses Effector stores and works without this provider. '
      + 'See migration guide: https://docs.chaingraph.dev/wallet-integration',
    )
  }, [])

  // Passthrough - no longer wraps children in any provider
  return <>{children}</>
}
