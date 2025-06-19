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
 * Node for retrieving ERC20 token balance
 */
@Node({
  type: 'GetTokenBalanceNode',
  title: 'Get Token Balance',
  description: 'Retrieves the ERC20 token balance of a wallet address',
  category: NODE_CATEGORIES.BLOCKCHAIN,
  tags: ['token', 'erc20', 'balance', 'web3', 'blockchain'],
})
export class GetTokenBalanceNode extends BaseNode {
  @Input()
  @String({
    title: 'Token Address',
    description: 'The ERC20 token contract address',
    required: true,
  })
  tokenAddress: string = ''

  @Input()
  @String({
    title: 'Owner Address',
    description: 'The wallet address to check (defaults to connected wallet if not provided)',
    defaultValue: '',
  })
  ownerAddress: string = ''

  @Input()
  @Number({
    title: 'Token Decimals',
    description: 'Number of decimals for the token (optional, will fetch if not provided)',
    defaultValue: -1,
  })
  decimals: number = -1

  @Input()
  @Number({
    title: 'Chain ID (Optional)',
    description: 'Chain ID to use (defaults to connected wallet chain or mainnet)',
    defaultValue: 0,
  })
  chainIdOverride: number = 0

  @Output()
  @String({
    title: 'Balance (Raw)',
    description: 'The token balance in smallest unit',
    defaultValue: '0',
  })
  balanceRaw: string = '0'

  @Output()
  @Number({
    title: 'Balance (Decimal)',
    description: 'The token balance as a decimal number',
    defaultValue: 0,
  })
  balanceDecimal: number = 0

  @Output()
  @String({
    title: 'Formatted Balance',
    description: 'Human-readable formatted balance',
    defaultValue: '0',
  })
  formattedBalance: string = '0'

  @Output()
  @Number({
    title: 'Chain ID Used',
    description: 'The chain ID used for the query',
    defaultValue: 0,
  })
  usedChainId: number = 0

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const walletContext = context.getIntegration<WalletContext>('wallet')

    if (!this.tokenAddress) {
      throw new Error('Token address is required')
    }

    // Use provided address or default to connected wallet
    let targetAddress = this.ownerAddress
    if (!targetAddress && walletContext?.address) {
      targetAddress = walletContext.address
    }

    if (!targetAddress) {
      throw new Error('No address provided and no wallet connected')
    }

    // Determine chain ID and RPC URL
    const chainId = this.chainIdOverride > 0
      ? this.chainIdOverride
      : (walletContext?.chainId || 1)

    this.usedChainId = chainId

    let rpcUrl = walletContext?.rpcUrl
    if (!rpcUrl) {
      rpcUrl = this.getDefaultRpcUrl(chainId)
    }

    try {
      // If decimals not provided, fetch it first
      let tokenDecimals = this.decimals
      if (tokenDecimals < 0) {
        const decimalsSelector = '0x313ce567' // keccak256("decimals()")
        const decimalsRes = await this.callContract(rpcUrl, this.tokenAddress, decimalsSelector)
        tokenDecimals = parseInt(decimalsRes, 16)
      }

      // Get balance
      // balanceOf(address) selector
      const balanceOfSelector = '0x70a08231'
      // Pad address to 32 bytes
      const paddedAddress = targetAddress.slice(2).padStart(64, '0')
      const data = balanceOfSelector + paddedAddress

      const balanceRes = await this.callContract(rpcUrl, this.tokenAddress, data)

      // Set outputs
      try {
        // Handle case where result is "0x" (empty) or "0x0"
        if (!balanceRes || balanceRes === '0x' || balanceRes === '0x0') {
          this.balanceRaw = '0'
        } else {
          this.balanceRaw = BigInt(balanceRes).toString()
        }
      } catch (e) {
        // If parsing fails, it might be because we're on the wrong chain or contract doesn't exist
        throw new Error(`Failed to parse balance response "${balanceRes}". Token might not exist on chain ${chainId} or the RPC endpoint returned an error.`)
      }

      this.balanceDecimal = parseFloat(this.balanceRaw) / 10 ** tokenDecimals
      this.formattedBalance = this.balanceDecimal.toFixed(6)
    } catch (error: any) {
      throw new Error(`Failed to get token balance: ${error.message}`)
    }

    return {}
  }

  private async callContract(rpcUrl: string, contractAddress: string, data: string): Promise<string> {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: contractAddress,
          data,
        }, 'latest'],
        id: 1,
      }),
    })

    const result = await response.json()
    if (result.error) {
      throw new Error(result.error.message || 'RPC error')
    }

    if (!result.result) {
      throw new Error(`Invalid RPC response: ${JSON.stringify(result)}`)
    }

    return result.result
  }

  private getDefaultRpcUrl(chainId: number): string {
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
        throw new Error(`No default RPC URL for chain ID ${chainId}`)
    }
  }
}

export default GetTokenBalanceNode
