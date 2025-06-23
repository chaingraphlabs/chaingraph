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
import { Amount, Token, Transaction } from './schemas'
import { encodeERC20Transfer, estimateGas, getDefaultRpcUrl, isValidAddress } from './utils'

/**
 * Node for building token transfer transactions (native or ERC20)
 */
@Node({
  type: 'BuildTransferNode',
  title: 'Build Transfer',
  description: 'Build a transfer transaction for native or ERC20 tokens',
  category: NODE_CATEGORIES.BLOCKCHAIN,
  tags: ['transfer', 'transaction', 'token', 'eth', 'erc20', 'send'],
})
export class BuildTransferNode extends BaseNode {
  @Input()
  @String({
    title: 'Recipient',
    description: 'Recipient wallet address',
    required: true,
  })
  recipient: string = ''

  @Input()
  @PortObject({
    title: 'Amount',
    description: 'Amount to transfer',
    schema: Amount,
    required: true,
  })
  amount: Amount = new Amount()

  @Input()
  @PortObject({
    title: 'Token',
    description: 'Token to transfer (optional, defaults to native token)',
    schema: Token,
    required: false,
  })
  token?: Token

  @Input()
  @String({
    title: 'From',
    description: 'Sender address (defaults to connected wallet)',
    defaultValue: '',
  })
  from: string = ''

  @Output()
  @PortObject({
    title: 'Transaction',
    description: 'Complete transaction object ready for signing',
    schema: Transaction,
  })
  transaction: Transaction = new Transaction()

  @Output()
  @String({
    title: 'Raw Transaction',
    description: 'Raw transaction data as hex string',
    defaultValue: '',
  })
  rawTransaction: string = ''

  @Output()
  @String({
    title: 'Readable',
    description: 'Human-readable transaction description',
    defaultValue: '',
  })
  readable: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const walletContext = context.getIntegration<WalletContext>('wallet')

    // Validate inputs
    if (!this.recipient) {
      throw new Error('Recipient address is required')
    }

    if (!isValidAddress(this.recipient)) {
      throw new Error('Invalid recipient address format')
    }

    if (!this.amount || !this.amount.value) {
      throw new Error('Valid amount is required')
    }

    // Get sender address
    let fromAddress = this.from
    if (!fromAddress && walletContext?.address) {
      fromAddress = walletContext.address
    }

    if (!fromAddress) {
      throw new Error('No sender address provided and no wallet connected')
    }

    // Determine chain ID from token or wallet
    const chainId = this.token?.chainId || walletContext?.chainId || 1

    // Get RPC URL for gas estimation
    let rpcUrl = walletContext?.rpcUrl
    if (!rpcUrl) {
      rpcUrl = getDefaultRpcUrl(chainId)
    }

    // Create transaction object
    this.transaction = new Transaction()
    this.transaction.from = fromAddress
    this.transaction.chainId = chainId
    this.transaction.amount = this.amount
    this.transaction.token = this.token

    // Build transaction based on whether token is provided
    if (!this.token) {
      // Native token transfer
      this.transaction.to = this.recipient
      this.transaction.value = this.amount.value
      this.transaction.data = '0x'
      this.transaction.gasLimit = '21000' // Standard gas for native transfers

      // Create readable description
      const nativeSymbol = chainId === 137 ? 'MATIC' : chainId === 56 ? 'BNB' : 'ETH'
      this.readable = `Send ${this.amount.formatted} ${nativeSymbol} to ${this.recipient}`
    } else {
      // ERC20 token transfer
      this.transaction.to = this.token.address
      this.transaction.value = '0' // No ETH value for ERC20 transfers
      this.transaction.data = encodeERC20Transfer(this.recipient, this.amount.value)

      // Estimate gas for ERC20 transfer
      try {
        const estimatedGas = await estimateGas(rpcUrl, {
          from: fromAddress,
          to: this.transaction.to,
          data: this.transaction.data,
          value: '0x0',
        })
        // Add 20% buffer to estimated gas
        const gasWithBuffer = BigInt(estimatedGas) * BigInt(120) / BigInt(100)
        this.transaction.gasLimit = gasWithBuffer.toString()
      } catch (error) {
        // Fallback gas limit for ERC20 transfers
        this.transaction.gasLimit = '100000'
      }

      // Create readable description
      this.readable = `Send ${this.amount.formatted} ${this.token.symbol} to ${this.recipient}`
    }

    // Build raw transaction hex
    // This is a simplified version - in production you'd use a proper library
    this.rawTransaction = this.buildRawTransaction()

    return {}
  }

  private buildRawTransaction(): string {
    // Create a hex representation of the transaction
    // Note: This is simplified - real implementation would properly encode RLP
    const txData = {
      to: this.transaction.to,
      value: `0x${BigInt(this.transaction.value).toString(16)}`,
      data: this.transaction.data,
      gasLimit: `0x${BigInt(this.transaction.gasLimit).toString(16)}`,
      chainId: this.transaction.chainId,
    }

    // For demonstration, return a JSON representation
    // In production, this would be properly RLP encoded
    return `0x${Buffer.from(JSON.stringify(txData)).toString('hex')}`
  }
}

export default BuildTransferNode
