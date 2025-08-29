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
 * Token decimals configuration
 */
@ObjectSchema({
  description: 'Token address to decimals mapping',
})
class TokenDecimalsConfig {
  @PortString({
    title: 'Token Address',
    description: 'Token contract address (e.g., 0xA0b86991...)',
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

  @PortNumber({
    title: 'Chain ID',
    description: 'Blockchain network ID',
    required: true,
    defaultValue: 1,
  })
  chainId: number = 1
}

@Node({
  type: 'AlchemyTokenBalances',
  title: 'Alchemy: token balances',
  description: 'Lightweight single-call token balance fetcher. For token metadata (names, symbols, precise decimals), use the "with metadata" variant.',
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

  @Input()
  @PortArray({
    title: 'Token Decimals',
    description: 'Optional array of token addresses and their decimals (takes priority over default)',
    itemConfig: {
      type: 'object',
      schema: TokenDecimalsConfig,
    },
    isMutable: true,
    required: false,
    ui: {
      hideEditor: false,
      addItemFormHidden: false,
    },
  })
  tokenDecimals: TokenDecimalsConfig[] = []

  @Input()
  @PortNumber({
    title: 'Default Decimals',
    description: 'Default decimals for tokens not in the array above (standard ERC20 is 18)',
    defaultValue: 18,
    min: 0,
    max: 36,
  })
  defaultDecimals: number = 18

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

    const url = Networks.getAlchemyUrl(this.network, apiKey)

    const requestBody = {
      jsonrpc: '2.0',
      method: 'alchemy_getTokenBalances',
      params: this.contractAddresses.length > 0
        ? [this.walletAddress, this.contractAddresses]
        : [this.walletAddress],
      id: 1,
    }

    try {
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

      // Create a map for quick decimals lookup
      const decimalsMap = new Map<string, number>()
      for (const config of this.tokenDecimals) {
        if (config.address) {
          decimalsMap.set(config.address.toLowerCase(), config.decimals)
        }
      }

      const allTokens: TokenBalance[] = data.result.tokenBalances.map((token: any) => {
        const rawBalance = this.safeBigIntToString(token.tokenBalance)
        const tokenAddressLower = token.contractAddress.toLowerCase()

        // Use specific decimals if provided, otherwise use default
        const decimals = decimalsMap.get(tokenAddressLower) ?? this.defaultDecimals

        const tokenBalance = new TokenBalance()
        tokenBalance.tokenAddress = token.contractAddress
        tokenBalance.balance = formatAmount(rawBalance, decimals)
        tokenBalance.chainId = getChainId(this.network)
        return tokenBalance
      })

      if (this.filterZeroBalances) {
        this.tokenBalances = allTokens.filter(token => token.balance.value !== '0')
      } else {
        this.tokenBalances = allTokens
      }

      return {}
    } catch (error) {
      const errorMessage = (error as Error).message
      // Remove any potential API key from error messages
      const sanitizedMessage = errorMessage.replace(new RegExp(apiKey, 'g'), '[REDACTED]')
      throw new Error(`Failed to fetch token balances: ${sanitizedMessage}`)
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
}

export default AlchemyTokenBalances
