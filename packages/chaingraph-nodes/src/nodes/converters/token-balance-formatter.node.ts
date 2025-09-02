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
  PortBoolean,
  PortNumber,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

/**
 * Token configuration with decimals and optional metadata
 */
@ObjectSchema({
  description: 'Token configuration for formatting',
})
class TokenConfig {
  @PortString({
    title: 'Token Address',
    description: 'Contract address of the token',
    required: true,
  })
  address: string = ''

  @PortNumber({
    title: 'Decimals',
    description: 'Number of decimals for this token',
    required: true,
    defaultValue: 18,
    min: 0,
    max: 36,
  })
  decimals: number = 18

  @PortString({
    title: 'Symbol',
    description: 'Token symbol (e.g., USDC, ETH)',
    required: false,
  })
  symbol?: string = ''

  @PortString({
    title: 'Name',
    description: 'Token name',
    required: false,
  })
  name?: string = ''
}

/**
 * Raw balance input
 */
@ObjectSchema({
  description: 'Raw token balance input',
})
class RawBalanceInput {
  @PortString({
    title: 'Token Address',
    description: 'Contract address of the token',
    required: true,
  })
  tokenAddress: string = ''

  @PortString({
    title: 'Balance Hex',
    description: 'Raw balance in hexadecimal format',
    required: true,
  })
  balanceHex: string = '0x0'

  @PortNumber({
    title: 'Chain ID',
    description: 'Blockchain network ID',
    required: false,
    defaultValue: 1,
  })
  chainId?: number = 1
}

/**
 * Formatted balance output
 */
@ObjectSchema({
  description: 'Formatted token balance',
})
class FormattedBalance {
  @PortString({
    title: 'Token Address',
    description: 'Contract address of the token',
    required: true,
  })
  tokenAddress: string = ''

  @PortString({
    title: 'Raw Value',
    description: 'Balance in smallest unit (wei)',
    required: true,
  })
  rawValue: string = '0'

  @PortString({
    title: 'Formatted Value',
    description: 'Human-readable balance',
    required: true,
  })
  formattedValue: string = '0.0'

  @PortNumber({
    title: 'Decimals',
    description: 'Number of decimal places used',
    required: true,
  })
  decimals: number = 18

  @PortString({
    title: 'Symbol',
    description: 'Token symbol',
    required: false,
  })
  symbol?: string = ''

  @PortString({
    title: 'Name',
    description: 'Token name',
    required: false,
  })
  name?: string = ''

  @PortNumber({
    title: 'Chain ID',
    description: 'Blockchain network ID',
    required: false,
  })
  chainId?: number = 1
}

@Node({
  type: 'TokenBalanceFormatter',
  title: 'Token Balance Formatter',
  description: 'Converts raw hex balances to formatted human-readable values using token configuration',
  category: NODE_CATEGORIES.CONVERTERS,
  tags: ['formatter', 'token', 'balance', 'converter'],
})
class TokenBalanceFormatter extends BaseNode {
  @Input()
  @PortArray({
    title: 'Raw Balances',
    description: 'Array of raw token balances in hex format',
    itemConfig: {
      type: 'object',
      schema: RawBalanceInput,
    },
    required: true,
  })
  rawBalances: RawBalanceInput[] = []

  @Input()
  @PortArray({
    title: 'Token Configurations',
    description: 'Token address to decimals and metadata mapping',
    itemConfig: {
      type: 'object',
      schema: TokenConfig,
    },
    required: false,
  })
  tokenConfigs: TokenConfig[] = []

  @Input()
  @PortNumber({
    title: 'Default Decimals',
    description: 'Default decimals for tokens not in configuration (standard ERC20 is 18)',
    defaultValue: 18,
    min: 0,
    max: 36,
  })
  defaultDecimals: number = 18

  @Input()
  @PortBoolean({
    title: 'Filter Zero Balances',
    description: 'Remove tokens with zero balance',
    defaultValue: true,
  })
  filterZeroBalances: boolean = true

  @Output()
  @PortArray({
    title: 'Formatted Balances',
    description: 'Array of formatted token balances',
    itemConfig: {
      type: 'object',
      schema: FormattedBalance,
    },
  })
  formattedBalances: FormattedBalance[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.rawBalances || this.rawBalances.length === 0) {
      this.formattedBalances = []
      return {}
    }

    // Create config map for quick lookup
    const configMap = new Map<string, TokenConfig>()
    for (const config of this.tokenConfigs) {
      if (config.address) {
        configMap.set(config.address.toLowerCase(), config)
      }
    }

    const allBalances: FormattedBalance[] = []

    for (const rawBalance of this.rawBalances) {
      const tokenAddressLower = rawBalance.tokenAddress.toLowerCase()
      const config = configMap.get(tokenAddressLower)

      // Get decimals from config or use default
      const decimals = config?.decimals ?? this.defaultDecimals

      // Convert hex to decimal string
      const rawValue = this.hexToDecimal(rawBalance.balanceHex)

      // Skip zero balances if filter is enabled
      if (this.filterZeroBalances && rawValue === '0') {
        continue
      }

      // Format the balance
      const formattedValue = this.formatBalance(rawValue, decimals)

      const formattedBalance = new FormattedBalance()
      formattedBalance.tokenAddress = rawBalance.tokenAddress
      formattedBalance.rawValue = rawValue
      formattedBalance.formattedValue = formattedValue
      formattedBalance.decimals = decimals
      formattedBalance.symbol = config?.symbol
      formattedBalance.name = config?.name
      formattedBalance.chainId = rawBalance.chainId

      allBalances.push(formattedBalance)
    }

    this.formattedBalances = allBalances
    return {}
  }

  private hexToDecimal(hex: string): string {
    if (!hex || hex === '0x' || hex === '0x0') {
      return '0'
    }
    try {
      return BigInt(hex).toString()
    } catch (error) {
      console.warn(`Invalid hex value: ${hex}`)
      return '0'
    }
  }

  private formatBalance(rawValue: string, decimals: number): string {
    if (rawValue === '0') {
      return '0.0'
    }

    try {
      const value = BigInt(rawValue)
      const divisor = BigInt(10 ** decimals)

      const integerPart = value / divisor
      const fractionalPart = value % divisor

      if (fractionalPart === 0n) {
        return `${integerPart.toString()}.0`
      }

      // Convert fractional part to string with leading zeros
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
      // Remove trailing zeros
      const trimmedFractional = fractionalStr.replace(/0+$/, '')

      if (trimmedFractional === '') {
        return `${integerPart.toString()}.0`
      }

      return `${integerPart.toString()}.${trimmedFractional}`
    } catch (error) {
      console.warn(`Failed to format balance: ${rawValue} with decimals: ${decimals}`)
      return '0.0'
    }
  }
}

export default TokenBalanceFormatter
