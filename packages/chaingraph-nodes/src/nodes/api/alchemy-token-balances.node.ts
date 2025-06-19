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
  Boolean,
  Input,
  Node,
  Output,
  PortArray,
  PortSecret,
  String,
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

interface RefinedTokenBalance {
  tokenAddress: string
  rawBalance: string
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
  @Boolean({
    title: 'Filter zero balances',
    description: 'Remove tokens that user has interacted with, but the current balance is 0',
    defaultValue: true,
  })
  filterZeroBalances: boolean = true

  @Input()
  @String({
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
      schema: {
        properties: {
          tokenAddress: {
            type: 'string',
            title: 'Token Address',
            description: 'Contract address of the token',
          },
          rawBalance: {
            type: 'string',
            title: 'Raw balance in wei',
            description: 'Token balance in wei format as string',
          },
        },
      },
    },
  })
  tokenBalances: RefinedTokenBalance[] = []

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

      const allTokens: RefinedTokenBalance[] = response.tokenBalances.map(token => ({
        tokenAddress: token.contractAddress,
        rawBalance: this.safeBigIntToString(token.tokenBalance),
      }))

      if (this.filterZeroBalances === false)
        this.tokenBalances = allTokens
      else
        this.tokenBalances = allTokens.filter(token => token.rawBalance !== '0')

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
}

export default AlchemyTokenBalances
