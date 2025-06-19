/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useEffect } from 'react'
import { useConnect, useDisconnect, useAccount } from 'wagmi'
import { useUnit } from 'effector-react'
import { Button } from '@/components/ui/button'
import { $walletContext, initializeWalletConfig } from '@/store/wallet/wallet.store'
import { wagmiConfig } from '@/store/wallet/wagmi.config'

export function WalletConnect() {
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { address, isConnected } = useAccount()
  const walletContext = useUnit($walletContext)

  // Initialize wagmi config on mount
  useEffect(() => {
    initializeWalletConfig(wagmiConfig)
  }, [])

  const handleConnect = () => {
    // Use the first available connector (usually Injected/MetaMask)
    const connector = connectors[0]
    if (connector) {
      connect({ connector })
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  // Simple UI - just connection status and button
  return (
    <div className="flex items-center gap-4">
      {isConnected && address ? (
        <>
          <span className="text-sm text-muted-foreground">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </>
      ) : (
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleConnect}
        >
          Connect Wallet
        </Button>
      )}
    </div>
  )
}