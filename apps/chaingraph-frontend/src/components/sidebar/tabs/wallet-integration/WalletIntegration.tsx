/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { wagmiConfig } from '@/store/wallet/wagmi.config'
import { $walletContext, initializeWalletConfig } from '@/store/wallet/wallet.store'
import { useUnit } from 'effector-react'
import { AlertCircle, CheckCircle2, Wallet } from 'lucide-react'
import { useEffect } from 'react'
import { formatEther } from 'viem'
import { useAccount, useBalance, useChainId, useConnect, useDisconnect } from 'wagmi'

export function WalletIntegration() {
  const walletContext = useUnit($walletContext)
  const { address, isConnected, connector } = useAccount()
  const { connectors, connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()

  // Initialize wagmi config on mount
  useEffect(() => {
    initializeWalletConfig(wagmiConfig)
  }, [])

  // Get balance if connected
  const { data: balance } = useBalance({
    address,
    enabled: !!address,
  })

  const getChainName = (id: number) => {
    switch (id) {
      case 1: return 'Ethereum Mainnet'
      case 137: return 'Polygon'
      case 56: return 'BNB Smart Chain'
      case 42161: return 'Arbitrum One'
      case 10: return 'Optimism'
      case 8453: return 'Base'
      default: return `Chain ${id}`
    }
  }

  const handleConnect = () => {
    // Use the first available connector (usually injected/MetaMask)
    const injectedConnector = connectors.find(c => c.id === 'injected')
    if (injectedConnector) {
      connect({ connector: injectedConnector })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Wallet Integration</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Provide wallet context for blockchain nodes in your workflows. The wallet context enables nodes to read blockchain data and build transactions.
        </p>
      </div>

      <Separator />

      {!isConnected
        ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  No Wallet Connected
                </CardTitle>
                <CardDescription className="text-xs">
                  Connect your wallet to access blockchain features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleConnect}
                  disabled={isPending}
                  size="sm"
                  className="w-full"
                >
                  {isPending ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              </CardContent>
            </Card>
          )
        : (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Wallet Connected
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Address</span>
                      <code className="text-xs font-mono">
                        {address?.slice(0, 6)}
                        ...
                        {address?.slice(-4)}
                      </code>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Network</span>
                      <Badge variant="secondary" className="text-xs">
                        {getChainName(chainId)}
                      </Badge>
                    </div>

                    {balance && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Balance</span>
                        <span className="text-xs font-mono">
                          {Number.parseFloat(formatEther(balance.value)).toFixed(4)}
                          {' '}
                          {balance.symbol}
                        </span>
                      </div>
                    )}

                    {connector && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Wallet</span>
                        <span className="text-xs">{connector.name}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnect()}
                    className="w-full"
                  >
                    Disconnect
                  </Button>
                </CardContent>
              </Card>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-sm">Available Features</AlertTitle>
                <AlertDescription className="text-xs space-y-1 mt-2">
                  <div>• Get native token balance</div>
                  <div>• Get ERC20 token information and balances</div>
                  <div>• Check token allowances</div>
                  <div>• Build transfer transactions</div>
                  <div>• Multi-chain support</div>
                </AlertDescription>
              </Alert>
            </>
          )}

      <div className="pt-2">
        <h4 className="text-xs font-semibold mb-2">Integration Details</h4>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>
            • Wallet context is passed to all node executions
          </p>
          <p>
            • Blockchain nodes use this context to determine chain, RPC endpoints, and user address
          </p>
          <p>
            • External systems can provide their own wallet context through the execution API
          </p>
          <p>
            • This UI connection is a demonstration - production usage would provide context programmatically
          </p>
        </div>
      </div>
    </div>
  )
}
