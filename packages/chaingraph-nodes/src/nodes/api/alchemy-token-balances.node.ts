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
  ExecutionEventEnum,
  Input,
  Node,
  Number,
  ObjectSchema,
  Output,
  PortArray,
  PortSecret,
  String,
  StringEnum,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

// Network configuration class
class Networks {
  // Network definitions with API endpoint and display title
  static networks = {
    ETH_MAINNET: { id: 'eth-mainnet', title: 'Ethereum Mainnet' },
    ETH_SEPOLIA: { id: 'eth-sepolia', title: 'Ethereum Sepolia' },
    ARB_MAINNET: { id: 'arb-mainnet', title: 'Arbitrum Mainnet' },
    OPT_MAINNET: { id: 'opt-mainnet', title: 'Optimism Mainnet' },
    POLYGON: { id: 'polygon-mainnet', title: 'Polygon Mainnet' },
    BASE: { id: 'base-mainnet', title: 'Base Mainnet' },
  }

  // Get all network IDs
  static get networkIds() {
    return Object.values(this.networks).map(network => network.id)
  }

  // Get default network ID
  static get defaultNetwork() {
    return this.networks.ETH_MAINNET.id
  }

  // Generate options array for PortEnum
  static getOptions() {
    return Object.values(this.networks).map(network => ({
      id: network.id,
      title: network.title,
      type: 'string',
      defaultValue: network.id,
    })) as IPortConfig[]
  }
}

// Define the schema for token balance output
@ObjectSchema({
  description: 'Token Balance Information',
})
class TokenBalance {
  @String({
    title: 'Token Address',
    description: 'Contract address of the token',
  })
  tokenAddress: string = ''

  @String({
    title: 'Balance in Wei',
    description: 'Raw token balance (not divided by decimals)',
  })
  weiBalance: string = ''
}

@Node({
  type: 'AlchemyGetTokensByAddress',
  title: 'Alchemy get ERC20 token balances',
  description: 'Fetches ERC20 token balances for a wallet address using Alchemy API',
  category: NODE_CATEGORIES.API,
  tags: ['blockchain', 'ethereum', 'erc20', 'token', 'balance', 'alchemy'],
})
class TokenBalanceFetcherNode extends BaseNode {
  @Input()
  @StringEnum(Networks.networkIds, {
    name: 'Network',
    description: 'EVM network to query',
    defaultValue: Networks.defaultNetwork,
    options: Networks.getOptions(),
  })
  network: string = Networks.defaultNetwork

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
  @String({
    title: 'Wallet Address',
    description: 'Ethereum wallet address to check token balances for',
    pattern: '^0x[a-fA-F0-9]{40}$',
    required: true,
  })
  walletAddress: string = ''

  @Input()
  @Number({
    title: 'Max Tokens',
    description: 'Limits the amount of tokens in the response',
    defaultValue: 20,
    min: 1,
  })
  maxTokens: number = 20

  @Input()
  @PortArray({
    title: 'Token Addresses',
    description: 'List of ERC20 token contract addresses to check balances for',
    itemConfig: {
      type: 'string',
      defaultValue: '',
      pattern: '^0x[a-fA-F0-9]{40}$',
    },
    isMutable: true,
    ui: {
      hideEditor: false,
      addItemFormHidden: false,
    },
  })
  tokenAddresses: string[] = []

  @Output()
  @PortArray({
    title: 'Token Balances',
    description: 'List of token balances for the specified wallet',
    itemConfig: { type: 'object', schema: TokenBalance },
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
    const apiUrl = `https://${this.network}.g.alchemy.com/v2/${apiKey}`

    const payload = {
      id: 1,
      jsonrpc: '2.0',
      method: 'alchemy_getTokenBalances',
      params: [
        this.walletAddress,
        this.tokenAddresses.length > 0 ? this.tokenAddresses : 'erc20',
        { maxCount: this.maxTokens },
      ],
    }
    this.debugLog(context, JSON.stringify(payload))

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Alchemy API error: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(`Alchemy API error: ${data.error.message}`)
      }

      this.tokenBalances = data.result.tokenBalances.map((item: any) => {
        return {
          tokenAddress: item.contractAddress,
          weiBalance: BigInt(item.tokenBalance).toString(),
        }
      })

      return {}
    } catch (error) {
      throw new Error(`Failed to fetch token balances: ${(error as Error).message}`)
    }
  }

  /**
   * Send a debug log event to the execution context
   */
  private async debugLog(context: ExecutionContext, message: string): Promise<void> {
    await context.sendEvent({
      index: 0,
      type: ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
      timestamp: new Date(),
      data: {
        node: this.clone(),
        log: message,
      },
    })
  }
}

export default TokenBalanceFetcherNode
