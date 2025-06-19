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
  Output,
  PortArray,
  PortBoolean,
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
      schema: {
        properties: {
          contractAddress: { type: 'string', title: 'Token Address', description: 'Contract address of the token' },
          rawBalance: { type: 'string', title: 'Raw Balance', description: 'Raw token balance (not divided by decimals)' },
          decimals: { type: 'number', title: 'Decimals', description: 'Number of decimal places for the token' },
          name: { type: 'string', title: 'Name', description: 'Token name' },
          symbol: { type: 'string', title: 'Symbol', description: 'Token symbol' },
          balance: { type: 'string', title: 'Balance', description: 'Formatted token balance' },
        },
      },
    },
  })
  tokenBalances: OwnedToken[] = []

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

      if (this.filterZeroBalances === false)
        this.tokenBalances = tokensList
      else
        this.tokenBalances = tokensList.filter(token => token.rawBalance !== '0')

      return {}
    } catch (error) {
      throw new Error(`Failed to fetch token balances: ${(error as Error).message}`)
    }
  }
}

export default AlchemyTokenBalancesWithMeta
