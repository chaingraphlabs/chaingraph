/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortArray,
  PortNumber,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { createDexApiClient } from './okx-dex-client'
import { OKXConfig, TokenListInfo } from './types'

/**
 * Node for fetching tokens from the OKX DEX API using the official SDK
 */
@Node({
  type: 'OKXGetTokensNode',
  title: 'OKX DEX: Get Tokens',
  description: 'Fetches a list of available tokens from the OKX DEX API for a specific blockchain',
  category: NODE_CATEGORIES.OKX_DEX,
  tags: ['okx', 'dex', 'token', 'crypto', 'blockchain', 'api'],
})
class OKXGetTokensNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'OKX Configuration',
    description: 'API credentials and configuration for the OKX API',
    schema: OKXConfig,
  })
  config: OKXConfig = new OKXConfig()

  @Input()
  @PortString({
    title: 'Chain ID',
    description: 'Blockchain network identifier (will be deprecated in the future)',
    required: false,
  })
  chainId?: string

  @Input()
  @PortString({
    title: 'Chain Index',
    description: 'Unique identifier for the chain (e.g., 1 for Ethereum)',
    required: false,
  })
  chainIndex?: string

  @Input()
  @PortString({
    title: 'Query',
    description: 'Filter tokens by name or symbol (case-insensitive, partial match)',
    required: false,
  })
  query?: string

  @Input()
  @PortNumber({
    title: 'Limit',
    description: 'Maximum number of tokens to return',
    required: false,
  })
  limit?: number

  @Output()
  @PortArray({
    title: 'Tokens',
    description: 'List of available tokens on the selected chain',
    itemConfig: {
      type: 'object',
      schema: TokenListInfo,
    },
  })
  tokens: TokenListInfo[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      // Reset outputs
      this.tokens = []

      // Validate inputs
      this.validateInputs()

      // Decrypt secrets
      if (!this.config.secrets)
        throw new Error('Secrets configuration is required')

      const client = await createDexApiClient(context, this.config)

      // Make the API call using the SDK - adjust method name if needed
      const response = await client.dex.getTokens(this.chainId ?? this.chainIndex ?? '1')

      // Apply filtering if query is provided
      let filteredTokens = response.data
      if (this.query) {
        const searchQuery = this.query.toLowerCase()
        filteredTokens = filteredTokens.filter((token: TokenListInfo) => {
          return (
            token.tokenName?.toLowerCase().includes(searchQuery)
            || token.tokenSymbol.toLowerCase().includes(searchQuery)
          )
        })
      }

      // Apply limit if provided
      if (this.limit && this.limit > 0) {
        filteredTokens = filteredTokens.slice(0, this.limit)
      }

      for (const row of filteredTokens) {
        const token = row as TokenListInfo

        // Map the API response to the desired output format
        const mappedToken = new TokenListInfo()

        mappedToken.decimals = token.decimals
        mappedToken.tokenContractAddress = token.tokenContractAddress
        mappedToken.tokenLogoUrl = token.tokenLogoUrl
        mappedToken.tokenName = token.tokenName
        mappedToken.tokenSymbol = token.tokenSymbol

        this.tokens.push(mappedToken)
      }

      return {}

      // Use our mapper to convert API response to ChainGraph types
      // if (response && response.data && Array.isArray(response.data)) {
      // this.tokens = mapArray(response.data, mapTokenListResponse)
      // }
    } catch (apiError: any) {
      throw new Error(`API Error: ${apiError.message || JSON.stringify(apiError)}`)
    }

    return {}
  }

  /**
   * Validates the input parameters
   */
  private validateInputs(): void {
    if (!this.config.projectId)
      throw new Error('Project ID is required')

    // At least one chain identifier should be provided
    if (!this.chainId && !this.chainIndex) {
      throw new Error('Either Chain ID or Chain Index must be provided')
    }
  }
}

export default OKXGetTokensNode
