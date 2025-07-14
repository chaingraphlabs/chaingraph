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

      // Fetch token metadata for decimals
      const tokenAddresses = data.result.tokenBalances.map((token: any) => token.contractAddress)
      const tokenMetadata = await this.fetchTokenMetadata(url, tokenAddresses)

      const allTokens: TokenBalance[] = data.result.tokenBalances.map((token: any) => {
        const rawBalance = this.safeBigIntToString(token.tokenBalance)
        const decimals = tokenMetadata[token.contractAddress]?.decimals || 18

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

  /**
   * Fetches token metadata (decimals) for multiple token contracts
   * @param url - The Alchemy API endpoint URL
   * @param tokenAddresses - Array of token contract addresses
   * @returns Promise resolving to object mapping contract addresses to their metadata
   */
  private async fetchTokenMetadata(url: string, tokenAddresses: string[]): Promise<Record<string, { decimals: number }>> {
    if (tokenAddresses.length === 0)
      return {}

    const metadata: Record<string, { decimals: number }> = {}

    // Fetch metadata for each token individually
    await Promise.allSettled(
      tokenAddresses.map(async (contractAddress) => {
        try {
          const requestBody = {
            jsonrpc: '2.0',
            method: 'alchemy_getTokenMetadata',
            params: [contractAddress],
            id: 1,
          }

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.result && typeof data.result.decimals === 'number') {
              metadata[contractAddress] = { decimals: data.result.decimals }
            }
          }
        } catch {}
      }),
    )

    return metadata
  }
}

export default AlchemyTokenBalances
