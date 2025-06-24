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
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { Amount, Token, Transaction } from './schemas'
import { encodeERC20Transfer, estimateGas, getDefaultRpcUrl, isValidAddress } from './utils'

/**
 * Node for building token transfer transactions (native or ERC20)
 */
@Node({
  type: 'BuildTransferNode',
  title: 'Build Token Transfer',
  description: 'Build a transfer transaction for native or ERC20 tokens',
  category: NODE_CATEGORIES.BLOCKCHAIN,
  tags: ['transfer', 'transaction', 'token', 'eth', 'erc20', 'send'],
})
export class BuildTransferNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Recipient',
    description: 'Recipient wallet address',
    required: true,
  })
  recipient: string = ''

  @Input()
  @PortObject({
    title: 'Amount Decimal',
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
  token: Token = new Token()

  @Input()
  @PortString({
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
  @PortString({
    title: 'Raw Transaction',
    description: 'Raw transaction data as hex string',
    defaultValue: '',
  })
  rawTransaction: string = ''

  @Output()
  @PortString({
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

    if (!this.amount || !this.amount.value || this.amount.value === '0') {
      throw new Error('Valid amount is required')
    }
    
    // Validate amount is a valid number string
    try {
      BigInt(this.amount.value)
    } catch (e) {
      throw new Error(`Invalid amount value: "${this.amount.value}". Must be a valid number string.`)
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
    const chainId = (this.token && this.token.chainId) || walletContext?.chainId || 1

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

    console.log('token', this.token, this.token?.symbol)

    // Build transaction based on whether token is provided
    // Check if token has actual data (address is required for ERC20)
    if (!this.token.address) {
      // Native token transfer
      this.transaction.to = this.recipient
      this.transaction.value = this.amount.value
      this.transaction.data = '0x'
      this.transaction.gasLimit = '21000' // Standard gas for native transfers

      // Create readable description
      const nativeSymbol = chainId === 137 ? 'MATIC' : chainId === 56 ? 'BNB' : 'ETH'
      // Ensure amount is properly formatted (native tokens typically have 18 decimals)
      const formattedAmount = this.amount.formatted || this.formatTokenAmount(this.amount.value, 18)
      this.readable = `Send ${formattedAmount} ${nativeSymbol} to ${this.recipient}`
    } else {
      // ERC20 token transfer
      // Reconstruct token data to handle serialization issues
      const tokenData = {
        address: this.token.address || this.token.address || '',
        symbol: this.token.symbol || this.token.symbol || 'TOKEN',
        name: this.token.name || this.token.name || '',
        decimals: this.token.decimals || 18,
        chainId: this.token.chainId || 1,
      }

      this.transaction.to = tokenData.address
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
      // Ensure amount is properly formatted with token decimals
      const formattedAmount = this.amount.formatted || this.formatTokenAmount(this.amount.value, tokenData.decimals)

      this.readable = `Send ${formattedAmount} ${tokenData.symbol} to ${this.recipient}`
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
      value: `0x${BigInt(this.transaction.value || '0').toString(16)}`,
      data: this.transaction.data || '0x',
      gasLimit: `0x${BigInt(this.transaction.gasLimit || '21000').toString(16)}`,
      chainId: this.transaction.chainId,
    }

    // For demonstration, return a JSON representation
    // In production, this would be properly RLP encoded
    // Convert string to hex without using Buffer (for browser compatibility)
    const jsonStr = JSON.stringify(txData)
    let hex = ''
    for (let i = 0; i < jsonStr.length; i++) {
      hex += jsonStr.charCodeAt(i).toString(16).padStart(2, '0')
    }
    return `0x${hex}`
  }

  private formatTokenAmount(value: string, decimals: number): string {
    try {
      const rawBigInt = BigInt(value)
      const divisor = BigInt(10 ** decimals)
      const quotient = rawBigInt / divisor
      const remainder = rawBigInt % divisor

      // Format with proper decimal places
      const decimalStr = remainder.toString().padStart(decimals, '0')
      const trimmedDecimal = decimalStr.replace(/0+$/, '') // Remove trailing zeros

      return trimmedDecimal.length > 0
        ? `${quotient}.${trimmedDecimal}`
        : quotient.toString()
    } catch (e) {
      return '0'
    }
  }
}

export default BuildTransferNode
