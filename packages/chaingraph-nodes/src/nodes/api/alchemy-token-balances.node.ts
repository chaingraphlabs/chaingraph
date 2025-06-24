/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  EncryptedSecretValue,
  ExecutionContext,
  IPortConfig,
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
  PortObject,
  PortSecret,
  PortString,
  StringEnum,
} from '@badaitech/chaingraph-types'
import { Alchemy, Network } from 'alchemy-sdk'
import { NODE_CATEGORIES } from '../../categories'

class Networks {
  static get networkIds() {
    return Object.values(Network)
  }

  static get defaultNetwork() {
    return Network.ETH_MAINNET
  }

  static getOptions() {
    return Object.entries(Network).map(([key, value]) => ({
      id: value,
      title: key.replace(/_/g, ' '),
      type: 'string',
      defaultValue: value,
    })) as IPortConfig[]
  }
}

/**
 * Amount with multiple representations
 */
@ObjectSchema({
  description: 'Amount with raw value and formatted display',
})
class Amount {
  @PortString({
    title: 'Value',
    description: 'Amount in smallest unit (wei, satoshi, etc.)',
    required: true,
    defaultValue: '0',
  })
  value: string = '0'

  @PortNumber({
    title: 'Decimals',
    description: 'Number of decimal places',
    required: true,
    defaultValue: 18,
  })
  decimals: number = 18

  @PortString({
    title: 'Formatted',
    description: 'Human-readable amount (e.g., "1.5")',
    required: false,
    defaultValue: '0.0',
  })
  formatted?: string = '0.0'
}

@ObjectSchema({
  description: 'Token balance information',
})
class TokenBalance {
  @PortString({
    title: 'Token Address',
    description: 'Contract address of the token',
  })
  tokenAddress: string = ''

  @PortObject({
    title: 'Balance',
    description: 'Token balance amount with decimals',
    schema: Amount,
  })
  balance: Amount = new Amount()
}

@Node({
  type: 'AlchemyTokenBalances',
  title: 'Alchemy: token balances',
  description: 'Fetches token balances for a wallet address using Alchemy API',
  category: NODE_CATEGORIES.API,
  tags: ['blockchain', 'token', 'balance', 'alchemy'],
})
class AlchemyTokenBalances extends BaseNode {
  @Input()
  @PortSecret<'alchemy'>({
    title: 'API Key',
    secretType: 'alchemy',
    description: 'Alchemy API Key',
    ui: { isPassword: true },
    required: true,
  })
  apiKey?: EncryptedSecretValue<'alchemy'>

  @Input()
  @StringEnum(Networks.networkIds, {
    name: 'Network',
    description: 'Network to query',
    defaultValue: Networks.defaultNetwork,
    options: Networks.getOptions(),
  })
  network: string = Networks.defaultNetwork

  @Input()
  @PortBoolean({
    title: 'Filter zero balances',
    description: 'Remove tokens that user has interacted with, but the current balance is 0',
    defaultValue: true,
  })
  filterZeroBalances: boolean = true

  @Input()
  @PortString({
    title: 'Wallet Address',
    description: 'Wallet address to check token balances for',
    required: true,
  })
  walletAddress: string = ''

  @Input()
  @PortArray({
    title: 'Token Addresses',
    description: 'List of token contract addresses to check balances for',
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
    isMutable: true,
    ui: {
      hideEditor: false,
      addItemFormHidden: false,
    },
  })
  contractAddresses: string[] = []

  @Output()
  @PortArray({
    title: 'Token Balances',
    description: 'List of token balances for the specified wallet',
    itemConfig: {
      type: 'object',
      schema: TokenBalance,
    },
  })
  tokenBalances: TokenBalance[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.apiKey) {
      throw new Error('Alchemy API Key is required')
    }

    if (!this.walletAddress) {
      throw new Error('Wallet address is required')
    }

    const { apiKey } = await this.apiKey.decrypt(context)

    const settings = {
      apiKey,
      network: this.network as Network,
    }
    const alchemy = new Alchemy(settings)

    try {
      const response = this.contractAddresses.length > 0
        ? await alchemy.core.getTokenBalances(this.walletAddress, this.contractAddresses)
        : await alchemy.core.getTokenBalances(this.walletAddress)

      const allTokens: TokenBalance[] = response.tokenBalances.map((token) => {
        const rawBalance = this.safeBigIntToString(token.tokenBalance)
        // Default to 18 decimals for ERC20 tokens when not specified
        const decimals = 18

        const tokenBalance = new TokenBalance()
        tokenBalance.tokenAddress = token.contractAddress
        tokenBalance.balance = this.formatAmount(rawBalance, decimals)
        return tokenBalance
      })

      if (this.filterZeroBalances === false)
        this.tokenBalances = allTokens
      else
        this.tokenBalances = allTokens.filter(token => token.balance.value !== '0')

      return {}
    } catch (error) {
      throw new Error(`Failed to fetch token balances: ${(error as Error).message}`)
    }
  }

  private safeBigIntToString(value: string | null): string {
    if (!value || value === '0x')
      return '0'
    try {
      return BigInt(value).toString()
    } catch (error) {
      throw new Error(`Invalid token balance value: ${value}`)
    }
  }

  private formatAmount(raw: string, decimals: number): Amount {
    const amount = new Amount()
    amount.value = raw
    amount.decimals = decimals

    try {
      const rawBigInt = BigInt(raw)
      const divisor = BigInt(10 ** decimals)
      const quotient = rawBigInt / divisor
      const remainder = rawBigInt % divisor

      // Format with proper decimal places
      const decimalStr = remainder.toString().padStart(decimals, '0')
      const trimmedDecimal = decimalStr.replace(/0+$/, '') // Remove trailing zeros

      amount.formatted = trimmedDecimal.length > 0
        ? `${quotient}.${trimmedDecimal}`
        : quotient.toString()
    } catch (e) {
      amount.formatted = '0'
    }

    return amount
  }
}

export default AlchemyTokenBalances
