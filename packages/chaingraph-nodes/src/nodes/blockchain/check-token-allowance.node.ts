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
  PortBoolean,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { Amount, formatAmount, Token } from './schemas'
import { callContract, getDefaultRpcUrl } from './utils'

/**
 * Node for checking ERC20 token allowance
 */
@Node({
  type: 'CheckTokenAllowanceNode',
  title: 'ERC20 Token Allowance',
  description: 'Check ERC20 token spending allowance for any address',
  category: NODE_CATEGORIES.BLOCKCHAIN,
  tags: ['token', 'erc20', 'allowance', 'approval', 'web3', 'blockchain'],
})
export class CheckTokenAllowanceNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'Token',
    description: 'Token to check allowance for',
    schema: Token,
    required: true,
  })
  token: Token = new Token()

  @Input()
  @PortString({
    title: 'Spender',
    description: 'Address that will spend the tokens',
    required: true,
  })
  spender: string = ''

  @Input()
  @PortString({
    title: 'Owner',
    description: 'Token owner address (defaults to connected wallet)',
    defaultValue: '',
  })
  owner: string = ''

  @Output()
  @PortObject({
    title: 'Allowance Decimal',
    description: 'Token allowance amount with decimals',
    schema: Amount,
  })
  allowance: Amount = new Amount()

  @Output()
  @PortBoolean({
    title: 'Is Unlimited',
    description: 'Whether the allowance is set to maximum (unlimited)',
    defaultValue: false,
  })
  isUnlimited: boolean = false

  @Output()
  @PortString({
    title: 'Raw Allowance',
    description: 'Allowance in smallest unit',
    defaultValue: '0',
    ui: {
      hidden: true, // Hidden for backwards compatibility
    },
  })
  allowanceRaw: string = '0'

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const walletContext = context.getIntegration<WalletContext>('wallet')

    if (!this.token.address) {
      throw new Error('Token is required')
    }

    if (!this.spender) {
      throw new Error('Spender address is required')
    }

    // Use provided address or default to connected wallet
    let targetOwner = this.owner
    if (!targetOwner && walletContext?.address) {
      targetOwner = walletContext.address
    }

    if (!targetOwner) {
      throw new Error('No owner address provided and no wallet connected')
    }

    // Use token's chain ID or fall back to wallet/default
    const chainId = this.token.chainId || walletContext?.chainId || 1

    let rpcUrl = walletContext?.rpcUrl
    if (!rpcUrl) {
      rpcUrl = getDefaultRpcUrl(chainId)
    }

    try {
      // Get allowance
      // allowance(address owner, address spender) selector
      const allowanceSelector = '0xdd62ed3e'
      // Pad addresses to 32 bytes each
      const paddedOwner = targetOwner.slice(2).padStart(64, '0')
      const paddedSpender = this.spender.slice(2).padStart(64, '0')
      const data = allowanceSelector + paddedOwner + paddedSpender

      const allowanceRes = await callContract(rpcUrl, this.token.address, data)

      // Parse allowance
      const allowanceBigInt = BigInt(allowanceRes)
      const rawAllowance = allowanceBigInt.toString()

      // Check if unlimited (max uint256)
      const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
      this.isUnlimited = allowanceBigInt === maxUint256

      // Create amount object
      const amount = formatAmount(rawAllowance, this.token.decimals)

      if (this.isUnlimited) {
        amount.formatted = 'Unlimited'
      }

      // Set outputs
      this.allowance = amount
      this.allowanceRaw = rawAllowance // For backwards compatibility
    } catch (error: any) {
      throw new Error(`Failed to check token allowance: ${error.message}`)
    }

    return {}
  }
}

export default CheckTokenAllowanceNode
