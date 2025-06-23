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
  Output,
  PortObject,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { Amount, formatAmount, Token } from './schemas'
import { callContract, getDefaultRpcUrl } from './utils'

/**
 * Node for retrieving ERC20 token balance
 */
@Node({
  type: 'GetTokenBalanceNode',
  title: 'ERC20 Token Balance',
  description: 'Get ERC20 token balance for any address',
  category: NODE_CATEGORIES.BLOCKCHAIN,
  tags: ['token', 'erc20', 'balance', 'web3', 'blockchain', 'usdt', 'usdc'],
})
export class GetTokenBalanceNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'Token',
    description: 'Token information (connect from ERC20 Token Info or Token Selector)',
    schema: Token,
    required: true,
  })
  token: Token = new Token()

  @Input()
  @String({
    title: 'Address',
    description: 'Wallet address to check (defaults to connected wallet)',
    defaultValue: '',
  })
  address: string = ''

  @Output()
  @PortObject({
    title: 'Balance Decimal',
    description: 'Token balance amount with decimals',
    schema: Amount,
  })
  balance: Amount = new Amount()

  @Output()
  @String({
    title: 'Raw Balance',
    description: 'Balance in smallest unit',
    defaultValue: '0',
    ui: {
      hidden: true, // Hidden for backwards compatibility
    },
  })
  balanceRaw: string = '0'

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const walletContext = context.getIntegration<WalletContext>('wallet')

    if (!this.token.address) {
      throw new Error('Token address is required')
    }

    // Use provided address or default to connected wallet
    let targetAddress = this.address
    if (!targetAddress && walletContext?.address) {
      targetAddress = walletContext.address
    }

    if (!targetAddress) {
      throw new Error('No address provided and no wallet connected')
    }

    // Use token's chain ID or fall back to wallet/default
    const chainId = this.token.chainId || walletContext?.chainId || 1

    let rpcUrl = walletContext?.rpcUrl
    if (!rpcUrl) {
      rpcUrl = getDefaultRpcUrl(chainId)
    }

    try {
      // Get balance
      // balanceOf(address) selector
      const balanceOfSelector = '0x70a08231'
      // Pad address to 32 bytes
      const paddedAddress = targetAddress.slice(2).padStart(64, '0')
      const data = balanceOfSelector + paddedAddress

      const balanceRes = await callContract(rpcUrl, this.token.address, data)

      // Parse balance
      let rawBalance: string
      try {
        // Handle case where result is "0x" (empty) or "0x0"
        if (!balanceRes || balanceRes === '0x' || balanceRes === '0x0') {
          rawBalance = '0'
        } else {
          rawBalance = BigInt(balanceRes).toString()
        }
      } catch (e) {
        // If parsing fails, it might be because we're on the wrong chain or contract doesn't exist
        throw new Error(`Failed to parse balance response "${balanceRes}". Token might not exist on chain ${chainId} or the RPC endpoint returned an error.`)
      }

      // Create amount object
      const amount = formatAmount(rawBalance, this.token.decimals)

      // Set outputs
      this.balance = amount
      this.balanceRaw = rawBalance // For backwards compatibility
    } catch (error: any) {
      throw new Error(`Failed to get token balance: ${error.message}`)
    }

    return {}
  }
}

export default GetTokenBalanceNode
