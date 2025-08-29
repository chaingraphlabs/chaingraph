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
      // Step 1: Get token balances using alchemy_getTokenBalances
      const balancesParams: any[] = [this.walletAddress]
      
      if (this.contractAddresses.length > 0) {
        balancesParams.push(this.contractAddresses)
      }

      const balancesRequestBody = {
        jsonrpc: '2.0',
        method: 'alchemy_getTokenBalances',
        params: balancesParams,
        id: 1,
      }

      const balancesResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(balancesRequestBody),
      })

      if (!balancesResponse.ok) {
        throw new Error(`HTTP error! status: ${balancesResponse.status}`)
      }

      const balancesData = await balancesResponse.json()

      if (balancesData.error) {
        throw new Error(`Alchemy API error: ${balancesData.error.message}`)
      }

      const tokenBalances = balancesData.result.tokenBalances || []

      // Step 2: Filter tokens and track which ones need metadata
      const tokensNeedingMetadata: Array<{ token: any; originalIndex: number }> = []
      
      tokenBalances.forEach((token: any, index: number) => {
        const rawBalance = token.tokenBalance || '0x0'
        // Include token if it has non-zero balance or if we're not filtering
        if (rawBalance !== '0x0' || !this.filterZeroBalances) {
          tokensNeedingMetadata.push({ token, originalIndex: index })
        }
      })

      if (tokensNeedingMetadata.length === 0) {
        this.tokenBalances = []
        return {}
      }

      // Step 3: Get metadata for tokens using batch request
      const metadataRequests = tokensNeedingMetadata.map((item, index) => ({
        jsonrpc: '2.0',
        method: 'alchemy_getTokenMetadata',
        params: [item.token.contractAddress],
        id: index + 1,
      }))

      const metadataResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadataRequests),
      })

      if (!metadataResponse.ok) {
        throw new Error(`HTTP error! status: ${metadataResponse.status}`)
      }

      const metadataData = await metadataResponse.json()

      // Create a map of metadata by request id
      const metadataMap = new Map()
      if (Array.isArray(metadataData)) {
        metadataData.forEach((response: any) => {
          if (response.result) {
            metadataMap.set(response.id - 1, response.result)
          }
        })
      } else if (metadataData.result) {
        metadataMap.set(0, metadataData.result)
      }

      // Step 4: Combine balances with metadata
      const processedTokens: TokenBalanceWithMeta[] = []
      
      tokensNeedingMetadata.forEach((item, index) => {
        const { token } = item
        const rawBalance = token.tokenBalance || '0x0'
        
        const metadata = metadataMap.get(index) || {}
        const decimals = metadata.decimals != null && typeof metadata.decimals === 'number' 
          ? metadata.decimals 
          : 18

        const tokenBalance = new TokenBalanceWithMeta()

        // Set token information
        tokenBalance.token = new Token()
        tokenBalance.token.address = token.contractAddress
        tokenBalance.token.symbol = metadata.symbol || ''
        tokenBalance.token.name = metadata.name || ''
        tokenBalance.token.decimals = decimals
        tokenBalance.token.chainId = getChainId(this.network)

        // Convert hex balance to decimal string
        const balanceValue = rawBalance === '0x0' ? '0' : BigInt(rawBalance).toString()
        
        // Set balance
        tokenBalance.balance = formatAmount(balanceValue, decimals)
        
        processedTokens.push(tokenBalance)
      })

      this.tokenBalances = processedTokens

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
