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
  PortObject,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import type { TransactionRequest } from './types'

/**
 * Node for building a native token transfer transaction
 */
@Node({
  type: 'BuildNativeTransferNode',
  title: 'Build Native Transfer',
  description: 'Builds a transaction for transferring native tokens (ETH, MATIC, BNB, etc.) to another address',
  category: NODE_CATEGORIES.BLOCKCHAIN,
  tags: ['transaction', 'native', 'transfer', 'web3', 'blockchain', 'evm'],
})
export class BuildNativeTransferNode extends BaseNode {
  @Input()
  @String({
    title: 'To Address',
    description: 'The recipient address',
    required: true,
  })
  toAddress: string = ''

  @Input()
  @Number({
    title: 'Amount',
    description: 'Amount of native tokens to send (in decimal, e.g., 1.5 for 1.5 ETH/MATIC/BNB)',
    required: true,
    defaultValue: 0,
  })
  amount: number = 0

  @Input()
  @String({
    title: 'Gas Limit',
    description: 'Gas limit for the transaction (optional, will estimate if not provided)',
    defaultValue: '',
  })
  gasLimit: string = ''

  @Input()
  @String({
    title: 'Gas Price (Gwei)',
    description: 'Gas price in Gwei (optional, will use current gas price if not provided)',
    defaultValue: '',
  })
  gasPriceGwei: string = ''

  @Output()
  @PortObject({
    title: 'Transaction Data',
    description: 'The prepared transaction data ready for signing',
    schema: {
      type: 'object',
      properties: {
        to: { type: 'string' },
        from: { type: 'string' },
        value: { type: 'string' },
        gasLimit: { type: 'string' },
        gasPrice: { type: 'string' },
        chainId: { type: 'number' },
      },
    },
  })
  transactionData: TransactionRequest = {} as TransactionRequest

  @Output()
  @String({
    title: 'Transaction Type',
    description: 'Type identifier for frontend handling',
    defaultValue: 'native_transfer',
  })
  transactionType: string = 'native_transfer'

  @Output()
  @String({
    title: 'Estimated Gas',
    description: 'Estimated gas for the transaction',
    defaultValue: '',
  })
  estimatedGas: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Get wallet context
    const walletContext = context.getIntegration<WalletContext>('wallet')

    if (!walletContext || !walletContext.isConnected || !walletContext.address) {
      throw new Error('Wallet not connected')
    }

    // Validate inputs
    if (!this.toAddress) {
      throw new Error('Recipient address is required')
    }

    if (this.amount <= 0) {
      throw new Error('Amount must be greater than 0')
    }

    // Convert to Wei (all EVM native tokens use 18 decimals)
    const amountWei = Math.floor(this.amount * 1e18).toString()

    // Build transaction request
    this.transactionData = {
      from: walletContext.address,
      to: this.toAddress,
      value: amountWei,
      chainId: walletContext.chainId,
    }

    // Add gas parameters if provided
    if (this.gasLimit) {
      this.transactionData.gasLimit = this.gasLimit
    } else {
      // Standard gas limit for native token transfer
      this.transactionData.gasLimit = '21000'
      this.estimatedGas = '21000'
    }

    if (this.gasPriceGwei) {
      // Convert Gwei to Wei
      const gasPriceWei = Math.floor(parseFloat(this.gasPriceGwei) * 1e9).toString()
      this.transactionData.gasPrice = gasPriceWei
    }

    // Set transaction type for frontend
    this.transactionType = 'native_transfer'

    // The frontend will need to:
    // 1. Take this transaction data
    // 2. Present it to the user
    // 3. Have the user sign it with their wallet
    // 4. Broadcast the signed transaction

    return {}
  }
}

export default BuildNativeTransferNode