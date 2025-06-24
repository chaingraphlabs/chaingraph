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
  PortNumber,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { Amount, formatAmount, NativeToken } from './schemas'
import { getDefaultRpcUrl } from './utils'

/**
 * Node for retrieving native token balance of an address
 */
@Node({
  type: 'GetNativeBalanceNode',
  title: 'Native Token Balance',
  description: 'Get native token balance (ETH, MATIC, BNB, etc.) for any address',
  category: NODE_CATEGORIES.BLOCKCHAIN,
  tags: ['wallet', 'web3', 'blockchain', 'balance', 'native', 'eth', 'matic', 'bnb'],
})
export class GetNativeBalanceNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Address',
    description: 'The wallet address to check (defaults to connected wallet if not provided)',
    defaultValue: '',
  })
  address: string = ''

  @Input()
  @PortNumber({
    title: 'Chain ID',
    description: 'Override chain ID (defaults to connected wallet chain)',
    defaultValue: 0,
    ui: {
      hidden: false, // Visible but optional
    },
  })
  chainId: number = 0

  @Output()
  @PortObject({
    title: 'Balance Decimal',
    description: 'Native token balance amount with decimals',
    schema: Amount,
    ui: {
      hidePropertyEditor: true,
    },
  })
  balance: Amount = new Amount()

  @Output()
  @PortString({
    title: 'Raw Balance',
    description: 'Balance in wei as string',
    defaultValue: '0',
    ui: {
      hidden: true, // Hidden by default for backwards compatibility
    },
  })
  balanceWei: string = '0'

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

    // Determine chain ID and RPC URL to use
    const chainId = this.chainId > 0
      ? this.chainId
      : (walletContext?.chainId || 1)

    let rpcUrl = walletContext?.rpcUrl
    if (!rpcUrl) {
      // Default to public RPC based on chain ID
      rpcUrl = getDefaultRpcUrl(chainId)
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
      const rawBalance = BigInt(balanceHex).toString()

      // Create native token for this chain
      const nativeToken = new NativeToken(chainId)

      // Create amount object
      const amount = formatAmount(rawBalance, nativeToken.decimals)

      // Set outputs
      this.balance = amount
      this.balanceWei = rawBalance // For backwards compatibility
    } catch (error: any) {
      throw new Error(`Failed to get native balance: ${error.message}`)
    }

    return {}
  }
}

export default GetNativeBalanceNode
