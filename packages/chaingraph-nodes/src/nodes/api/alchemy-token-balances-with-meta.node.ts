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
import type { OwnedToken } from 'alchemy-sdk'
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
 * ERC20 Token information
 */
@ObjectSchema({
  description: 'ERC20 Token information including metadata and chain',
})
class Token {
  @PortString({
    title: 'Address',
    description: 'Token contract address',
    required: true,
  })
  address: string = ''

  @PortString({
    title: 'Symbol',
    description: 'Token symbol (e.g., USDT, DAI)',
    required: false,
  })
  symbol: string = ''

  @PortString({
    title: 'Name',
    description: 'Token full name',
    required: false,
  })
  name: string = ''

  @PortNumber({
    title: 'Decimals',
    description: 'Number of decimal places',
    required: false,
    defaultValue: 18,
  })
  decimals: number = 18

  @PortNumber({
    title: 'Chain ID',
    description: 'Blockchain network ID',
    required: true,
    defaultValue: 1,
  })
  chainId: number = 1
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
  description: 'Token balance with metadata',
})
class TokenBalanceWithMeta {
  @PortObject({
    title: 'Token',
    description: 'Token information',
    schema: Token,
  })
  token: Token = new Token()

  @PortObject({
    title: 'Balance',
    description: 'Token balance amount with decimals',
    schema: Amount,
  })
  balance: Amount = new Amount()
}

@Node({
  type: 'AlchemyTokenBalancesWithMeta',
  title: 'Alchemy: token balances with metadata',
  description: 'Fetches token balances with metadata for a given wallet address using Alchemy API',
  category: NODE_CATEGORIES.API,
  tags: ['blockchain', 'token', 'balance', 'alchemy'],
})
class AlchemyTokenBalancesWithMeta extends BaseNode {
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
      schema: TokenBalanceWithMeta,
    },
  })
  tokenBalances: TokenBalanceWithMeta[] = []

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
      let pageKey: string | undefined
      const tokensList: OwnedToken[] = []

      do {
        const response = await alchemy.core.getTokensForOwner(
          this.walletAddress,
          {
            ...(this.contractAddresses.length > 0 ? { contractAddresses: this.contractAddresses } : {}),
            ...(pageKey ? { pageKey } : {}),
          },
        )

        pageKey = response.pageKey
        tokensList.push(...response.tokens)
      } while (pageKey)

      const processedTokens = tokensList.map((token) => {
        const rawBalance = token.rawBalance || '0'
        const decimals = token.decimals || 18

        const tokenBalance = new TokenBalanceWithMeta()

        // Set token information
        tokenBalance.token = new Token()
        tokenBalance.token.address = token.contractAddress
        tokenBalance.token.symbol = token.symbol || ''
        tokenBalance.token.name = token.name || ''
        tokenBalance.token.decimals = decimals
        tokenBalance.token.chainId = this.getChainId(this.network)

        // Set balance
        tokenBalance.balance = this.formatAmount(rawBalance, decimals)
        return tokenBalance
      })

      if (this.filterZeroBalances === false)
        this.tokenBalances = processedTokens
      else
        this.tokenBalances = processedTokens.filter(token => token.balance.value !== '0')

      return {}
    } catch (error) {
      throw new Error(`Failed to fetch token balances: ${(error as Error).message}`)
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

  private getChainId(network: string): number {
    // Map Alchemy network names to chain IDs
    const networkToChainId: Record<string, number> = {
      'eth-mainnet': 1,
      'eth-sepolia': 11155111,
      'polygon-mainnet': 137,
      'polygon-mumbai': 80001,
      'arb-mainnet': 42161,
      'arb-sepolia': 421614,
      'opt-mainnet': 10,
      'opt-sepolia': 11155420,
      'base-mainnet': 8453,
      'base-sepolia': 84532,
    }
    return networkToChainId[network] || 1
  }
}

export default AlchemyTokenBalancesWithMeta
