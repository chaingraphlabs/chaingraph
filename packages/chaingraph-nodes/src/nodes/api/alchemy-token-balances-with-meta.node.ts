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
import { NODE_CATEGORIES } from '../../categories'
import { formatAmount, getChainId, Networks } from './shared/alchemy-utils'

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

    const url = Networks.getAlchemyUrl(this.network, apiKey)

    try {
      let pageKey: string | undefined
      const tokensList: any[] = []

      do {
        const requestBody = {
          jsonrpc: '2.0',
          method: 'alchemy_getTokensForOwner',
          params: [
            this.walletAddress,
            {
              ...(this.contractAddresses.length > 0 ? { contractAddresses: this.contractAddresses } : {}),
              ...(pageKey ? { pageKey } : {}),
            },
          ],
          id: 1,
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(`Alchemy API error: ${data.error.message}`)
        }

        pageKey = data.result.pageKey
        tokensList.push(...data.result.tokens)
      } while (pageKey)

      /**
       * Process each token from the API response to create TokenBalanceWithMeta objects
       * Handles missing or invalid token metadata gracefully
       */
      const processedTokens = tokensList.map((token) => {
        const rawBalance = token.rawBalance || '0'
        const decimals = token.decimals != null && typeof token.decimals === 'number' ? token.decimals : 18

        const tokenBalance = new TokenBalanceWithMeta()

        // Set token information
        tokenBalance.token = new Token()
        tokenBalance.token.address = token.contractAddress
        tokenBalance.token.symbol = token.symbol || ''
        tokenBalance.token.name = token.name || ''
        tokenBalance.token.decimals = decimals
        tokenBalance.token.chainId = getChainId(this.network)

        // Set balance
        tokenBalance.balance = formatAmount(rawBalance, decimals)
        return tokenBalance
      })

      /**
       * Filter out tokens with zero balances if requested
       * This helps reduce noise in the output for users who only want active holdings
       */
      if (this.filterZeroBalances) {
        this.tokenBalances = processedTokens.filter(token => token.balance.value !== '0')
      } else {
        this.tokenBalances = processedTokens
      }

      return {}
    } catch (error) {
      const errorMessage = (error as Error).message
      // Remove any potential API key from error messages
      const sanitizedMessage = errorMessage.replace(new RegExp(apiKey, 'g'), '[REDACTED]')
      throw new Error(`Failed to fetch token balances: ${sanitizedMessage}`)
    }
  }
}

export default AlchemyTokenBalancesWithMeta
