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
  PortNumber,
  PortSecret,
  PortString,
  StringEnum,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { getChainId, Networks } from './shared/alchemy-utils'

/**
 * Raw token balance as stringified BigInt
 */
@ObjectSchema({
  description: 'Raw token balance as stringified BigInt',
})
class RawTokenBalance {
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
    required: true,
    defaultValue: 1,
  })
  chainId: number = 1
}

@Node({
  type: 'AlchemyRawBalances',
  title: 'Alchemy: Raw Balances',
  description: 'Fetches raw token balances as stringified BigInt values. Single API call, no formatting or decimals conversion.',
  category: NODE_CATEGORIES.API,
  tags: ['blockchain', 'token', 'balance', 'alchemy', 'raw'],
})
class AlchemyRawBalances extends BaseNode {
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
  @PortString({
    title: 'Wallet Address',
    description: 'Wallet address to check token balances for',
    required: true,
  })
  walletAddress: string = ''

  @Input()
  @PortArray({
    title: 'Token Addresses',
    description: 'Optional list of specific token contract addresses to check',
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
    isMutable: true,
    required: false,
    ui: {
      hideEditor: false,
      addItemFormHidden: false,
    },
  })
  contractAddresses: string[] = []

  @Output()
  @PortArray({
    title: 'Raw Balances',
    description: 'List of raw token balances as stringified BigInt',
    itemConfig: {
      type: 'object',
      schema: RawTokenBalance,
    },
  })
  rawBalances: RawTokenBalance[] = []

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

      const chainId = getChainId(this.network)

      // Convert hex to stringified BigInt
      this.rawBalances = data.result.tokenBalances.map((token: any) => {
        const rawBalance = new RawTokenBalance()
        rawBalance.tokenAddress = token.contractAddress

        // Convert hex to stringified BigInt
        const hexBalance = token.tokenBalance || '0x0'
        if (!hexBalance || hexBalance === '0x' || hexBalance === '0x0') {
          rawBalance.balance = '0'
        } else {
          try {
            rawBalance.balance = BigInt(hexBalance).toString()
          } catch (e) {
            console.warn(`Failed to parse balance ${hexBalance} for token ${token.contractAddress}`)
            rawBalance.balance = '0'
          }
        }

        rawBalance.chainId = chainId
        return rawBalance
      })

      return {}
    } catch (error) {
      const errorMessage = (error as Error).message
      // Remove any potential API key from error messages
      const sanitizedMessage = errorMessage.replace(new RegExp(apiKey, 'g'), '[REDACTED]')
      throw new Error(`Failed to fetch raw balances: ${sanitizedMessage}`)
    }
  }
}

export default AlchemyRawBalances
