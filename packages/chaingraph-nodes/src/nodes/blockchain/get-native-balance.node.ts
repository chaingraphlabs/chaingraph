/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult, WalletContext } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Number,
  Output,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

/**
 * Node for retrieving native token balance of an address
 */
@Node({
  type: 'GetNativeBalanceNode',
  title: 'Get Native Balance',
  description: 'Retrieves the native token balance (ETH, MATIC, BNB, etc.) of a wallet address',
  category: NODE_CATEGORIES.BLOCKCHAIN,
  tags: ['wallet', 'web3', 'blockchain', 'balance', 'native', 'evm'],
})
export class GetNativeBalanceNode extends BaseNode {
  @Input()
  @String({
    title: 'Address',
    description: 'The wallet address to check (defaults to connected wallet if not provided)',
    defaultValue: '',
  })
  address: string = ''

  @Output()
  @String({
    title: 'Balance (Wei)',
    description: 'The native token balance in Wei as a string',
    defaultValue: '0',
  })
  balanceWei: string = '0'

  @Output()
  @Number({
    title: 'Balance (Decimal)',
    description: 'The native token balance as a decimal number',
    defaultValue: 0,
  })
  balanceDecimal: number = 0

  @Output()
  @String({
    title: 'Formatted Balance',
    description: 'Human-readable formatted balance with native token symbol',
    defaultValue: '0',
  })
  formattedBalance: string = '0'

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Get wallet context from execution context
    const walletContext = context.getIntegration<WalletContext>('wallet')

    // Use provided address or default to connected wallet address
    let targetAddress = this.address
    if (!targetAddress && walletContext?.address) {
      targetAddress = walletContext.address
    }

    if (!targetAddress) {
      throw new Error('No address provided and no wallet connected')
    }

    // Determine RPC URL to use
    let rpcUrl = walletContext?.rpcUrl
    if (!rpcUrl) {
      // Default to public RPC based on chain ID
      const chainId = walletContext?.chainId || 1
      rpcUrl = this.getDefaultRpcUrl(chainId)
    }

    try {
      // Make RPC call to get balance
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [targetAddress, 'latest'],
          id: 1,
        }),
      })

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message || 'RPC error')
      }

      // Convert hex to decimal string (Wei)
      const balanceHex = data.result
      this.balanceWei = BigInt(balanceHex).toString()
      
      // Convert to decimal (divide by 10^18)
      this.balanceDecimal = parseFloat(this.balanceWei) / 1e18
      
      // Format for display with native token symbol
      const symbol = this.getNativeTokenSymbol(walletContext?.chainId || 1)
      this.formattedBalance = `${this.balanceDecimal.toFixed(6)} ${symbol}`
      
    } catch (error: any) {
      throw new Error(`Failed to get native balance: ${error.message}`)
    }

    return {}
  }

  private getDefaultRpcUrl(chainId: number): string {
    // Common public RPC endpoints
    switch (chainId) {
      case 1: // Ethereum Mainnet
        return 'https://eth.llamarpc.com'
      case 137: // Polygon
        return 'https://polygon-rpc.com'
      case 56: // BSC
        return 'https://bsc-dataseed.binance.org'
      case 42161: // Arbitrum
        return 'https://arb1.arbitrum.io/rpc'
      case 10: // Optimism
        return 'https://mainnet.optimism.io'
      default:
        throw new Error(`No default RPC URL for chain ID ${chainId}`)
    }
  }

  private getNativeTokenSymbol(chainId: number): string {
    switch (chainId) {
      case 1: // Ethereum Mainnet
        return 'ETH'
      case 137: // Polygon
        return 'MATIC'
      case 56: // BSC
        return 'BNB'
      case 42161: // Arbitrum
        return 'ETH'
      case 10: // Optimism
        return 'ETH'
      default:
        return 'ETH' // Default to ETH for unknown chains
    }
  }
}

export default GetNativeBalanceNode