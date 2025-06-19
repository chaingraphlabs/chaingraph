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
  Boolean,
  Input,
  Node,
  Number,
  Output,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

/**
 * Node for checking ERC20 token allowance
 */
@Node({
  type: 'CheckTokenAllowanceNode',
  title: 'Check Token Allowance',
  description: 'Checks the ERC20 token allowance for a spender address',
  category: NODE_CATEGORIES.BLOCKCHAIN,
  tags: ['token', 'erc20', 'allowance', 'approval', 'web3', 'blockchain'],
})
export class CheckTokenAllowanceNode extends BaseNode {
  @Input()
  @String({
    title: 'Token Address',
    description: 'The ERC20 token contract address',
    required: true,
  })
  tokenAddress: string = ''

  @Input()
  @String({
    title: 'Spender Address',
    description: 'The address that will spend the tokens',
    required: true,
  })
  spenderAddress: string = ''

  @Input()
  @String({
    title: 'Owner Address',
    description: 'The token owner address (defaults to connected wallet if not provided)',
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

  @Output()
  @String({
    title: 'Allowance (Raw)',
    description: 'The allowance in smallest unit',
    defaultValue: '0',
  })
  allowanceRaw: string = '0'

  @Output()
  @Number({
    title: 'Allowance (Decimal)',
    description: 'The allowance as a decimal number',
    defaultValue: 0,
  })
  allowanceDecimal: number = 0

  @Output()
  @String({
    title: 'Formatted Allowance',
    description: 'Human-readable formatted allowance',
    defaultValue: '0',
  })
  formattedAllowance: string = '0'

  @Output()
  @Boolean({
    title: 'Is Unlimited',
    description: 'Whether the allowance is set to maximum (unlimited)',
    defaultValue: false,
  })
  isUnlimited: boolean = false

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const walletContext = context.getIntegration<WalletContext>('wallet')

    if (!this.tokenAddress) {
      throw new Error('Token address is required')
    }

    if (!this.spenderAddress) {
      throw new Error('Spender address is required')
    }

    // Use provided address or default to connected wallet
    let targetOwner = this.ownerAddress
    if (!targetOwner && walletContext?.address) {
      targetOwner = walletContext.address
    }

    if (!targetOwner) {
      throw new Error('No owner address provided and no wallet connected')
    }

    // Determine RPC URL
    let rpcUrl = walletContext?.rpcUrl
    if (!rpcUrl) {
      const chainId = walletContext?.chainId || 1
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

      // Get allowance
      // allowance(address owner, address spender) selector
      const allowanceSelector = '0xdd62ed3e'
      // Pad addresses to 32 bytes each
      const paddedOwner = targetOwner.slice(2).padStart(64, '0')
      const paddedSpender = this.spenderAddress.slice(2).padStart(64, '0')
      const data = allowanceSelector + paddedOwner + paddedSpender

      const allowanceRes = await this.callContract(rpcUrl, this.tokenAddress, data)

      // Set outputs
      const allowanceBigInt = BigInt(allowanceRes)
      this.allowanceRaw = allowanceBigInt.toString()

      // Check if unlimited (max uint256)
      const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
      this.isUnlimited = allowanceBigInt === maxUint256

      if (this.isUnlimited) {
        this.allowanceDecimal = Number.MAX_SAFE_INTEGER
        this.formattedAllowance = 'Unlimited'
      } else {
        this.allowanceDecimal = parseFloat(this.allowanceRaw) / 10 ** tokenDecimals
        this.formattedAllowance = this.allowanceDecimal.toFixed(6)
      }
    } catch (error: any) {
      throw new Error(`Failed to check token allowance: ${error.message}`)
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
      default:
        throw new Error(`No default RPC URL for chain ID ${chainId}`)
    }
  }
}

export default CheckTokenAllowanceNode
