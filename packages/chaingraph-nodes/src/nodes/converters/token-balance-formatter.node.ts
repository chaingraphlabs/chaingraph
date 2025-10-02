/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  ObjectSchema,
  Output,
  PortArray,
  PortNumber,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { Amount, Token } from '../blockchain/schemas'

/**
 * Raw balance input matching the output of alchemy-raw-balances node
 */
@ObjectSchema({
  description: 'Raw token balance input',
  type: 'RawBalanceInput',
})
class RawBalanceInput {
  @PortString({
    title: 'Token Address',
    description: 'Contract address of the token',
    required: true,
  })
  tokenAddress: string = ''

  @PortString({
    title: 'Balance',
    description: 'Raw balance as stringified BigInt (smallest unit)',
    required: true,
  })
  balance: string = '0'

  @PortNumber({
    title: 'Chain ID',
    description: 'Blockchain network ID',
    required: false,
    defaultValue: 1,
  })
  chainId?: number = 1
}

/**
 * Token balance with amount and token info
 */
@ObjectSchema({
  description: 'Token balance with formatted amount and metadata',
  type: 'TokenBalance',
})
class TokenBalance {
  @PortObject({
    title: 'Token',
    description: 'Token information',
    schema: Token,
    required: true,
  })
  token: Token = new Token()

  @PortObject({
    title: 'Amount',
    description: 'Balance amount with formatting',
    schema: Amount,
    required: true,
  })
  amount: Amount = new Amount()
}

@Node({
  type: 'TokenBalanceFormatter',
  title: 'Token Balance Formatter',
  description: 'Converts raw balances to formatted amounts using token metadata. Only processes tokens present in configuration.',
  category: NODE_CATEGORIES.CONVERTERS,
  tags: ['formatter', 'token', 'balance', 'converter'],
})
class TokenBalanceFormatter extends BaseNode {
  @Input()
  @PortArray({
    title: 'Raw Balances',
    description: 'Array of raw token balances as stringified BigInt',
    itemConfig: {
      type: 'object',
      schema: RawBalanceInput,
    },
    required: true,
  })
  rawBalances: RawBalanceInput[] = []

  @Input()
  @PortArray({
    title: 'Tokens Meta',
    description: 'Token metadata including decimals, symbol, and name. Only tokens in this list will be processed.',
    itemConfig: {
      type: 'object',
      schema: Token,
    },
    isMutable: true,
    required: true,
    ui: {
      hideEditor: false,
      addItemFormHidden: false,
    },
  })
  tokens: Token[] = []

  @Output()
  @PortArray({
    title: 'Token Balances',
    description: 'Array of formatted token balances',
    itemConfig: {
      type: 'object',
      schema: TokenBalance,
    },
  })
  tokenBalances: TokenBalance[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.rawBalances || this.rawBalances.length === 0) {
      this.tokenBalances = []
      return {}
    }

    // Create token map for quick lookup
    const tokenMap = new Map<string, Token>()
    for (const token of this.tokens) {
      if (token.address) {
        tokenMap.set(token.address.toLowerCase(), token)
      }
    }

    const allBalances: TokenBalance[] = []

    for (const rawBalance of this.rawBalances) {
      const tokenAddressLower = rawBalance.tokenAddress.toLowerCase()

      // Skip tokens not in configuration
      const tokenInfo = tokenMap.get(tokenAddressLower)
      if (!tokenInfo) {
        continue
      }

      // Skip zero balances
      if (rawBalance.balance === '0') {
        continue
      }

      // Format the balance
      const amount = this.formatAmount(rawBalance.balance, tokenInfo.decimals)

      const tokenBalance = new TokenBalance()
      tokenBalance.token = tokenInfo
      tokenBalance.amount = amount

      allBalances.push(tokenBalance)
    }

    this.tokenBalances = allBalances
    return {}
  }

  private formatAmount(rawValue: string, decimals: number): Amount {
    const amount = new Amount()
    amount.value = rawValue
    amount.decimals = decimals

    if (rawValue === '0') {
      amount.formatted = '0.0'
      return amount
    }

    try {
      const value = BigInt(rawValue)
      const divisor = BigInt(10 ** decimals)

      const integerPart = value / divisor
      const fractionalPart = value % divisor

      if (fractionalPart === 0n) {
        amount.formatted = `${integerPart.toString()}.0`
      } else {
        // Convert fractional part to string with leading zeros
        const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
        // Remove trailing zeros
        const trimmedFractional = fractionalStr.replace(/0+$/, '')

        if (trimmedFractional === '') {
          amount.formatted = `${integerPart.toString()}.0`
        } else {
          amount.formatted = `${integerPart.toString()}.${trimmedFractional}`
        }
      }
    } catch (error) {
      console.warn(`Failed to format balance: ${rawValue} with decimals: ${decimals}`)
      amount.formatted = '0.0'
    }

    return amount
  }
}

export default TokenBalanceFormatter
