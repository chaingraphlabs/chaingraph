/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useUnit } from 'effector-react'
import { AlertCircle, CheckCircle2, RefreshCw, Wallet } from 'lucide-react'
import { useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { $executionState } from '@/store/execution'
import {
  $autoRecreateEnabled,
  $balance,
  $connectionState,
  $connectors,
  $currentChainName,
  $formattedAddress,
  $walletContext,
  connectWallet,
  disableAutoRecreate,
  disconnectWallet,
  enableAutoRecreate,
  initializeWalletConfig,
  recreateExecutionWithCurrentWallet,
  refreshBalance,
} from '@/store/wallet'
import { wagmiConfig } from '@/store/wallet/wagmi.config'

export function WalletIntegration() {
  const walletContext = useUnit($walletContext)
  const autoRecreateEnabled = useUnit($autoRecreateEnabled)
  const executionState = useUnit($executionState)
  const balance = useUnit($balance)
  const connectionState = useUnit($connectionState)
  const connectors = useUnit($connectors)
  const formattedAddress = useUnit($formattedAddress)
  const chainName = useUnit($currentChainName)

  // Initialize wagmi config on mount
  useEffect(() => {
    initializeWalletConfig(wagmiConfig)
  }, [])

  const handleConnect = () => {
    connectWallet()
  }

  const handleDisconnect = () => {
    disconnectWallet()
  }

  const handleRefreshBalance = () => {
    refreshBalance()
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

      {!walletContext.isConnected
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
                  disabled={connectionState.isConnecting}
                  size="sm"
                  className="w-full"
                >
                  {connectionState.isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
                {connectionState.error && (
                  <p className="text-xs text-red-500 mt-2">
                    Error:
                    {' '}
                    {connectionState.error.message}
                  </p>
                )}
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
                        {formattedAddress}
                      </code>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Network</span>
                      <Badge variant="secondary" className="text-xs">
                        {chainName}
                      </Badge>
                    </div>

                    {balance && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Balance</span>
                        <span className="text-xs font-mono">
                          {balance.formatted}
                          {' '}
                          {balance.symbol}
                        </span>
                      </div>
                    )}

                    {connectors.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Wallet</span>
                        <span className="text-xs">{connectors[0].name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshBalance}
                      disabled={!balance}
                      className="flex-1"
                    >
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnect}
                      disabled={connectionState.isDisconnecting}
                      className="flex-1"
                    >
                      {connectionState.isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                    </Button>
                  </div>
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

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Auto-recreate Executions
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Automatically restart executions when wallet state changes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-recreate" className="text-xs">
                      Enable auto-recreate
                    </Label>
                    <Switch
                      id="auto-recreate"
                      checked={autoRecreateEnabled}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          enableAutoRecreate()
                        } else {
                          disableAutoRecreate()
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    When enabled, active executions will automatically restart with updated wallet context when you switch accounts or chains.
                  </p>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => recreateExecutionWithCurrentWallet()}
                    className="w-full mt-3"
                    disabled={!executionState.executionId}
                  >
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Refresh Execution
                  </Button>
                  {executionState.executionId && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Active execution:
                      {' '}
                      {executionState.executionId.slice(0, 8)}
                      ...
                    </p>
                  )}
                </CardContent>
              </Card>
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
