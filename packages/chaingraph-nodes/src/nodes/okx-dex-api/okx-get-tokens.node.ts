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
  PortObject,
  String,
} from '@badaitech/chaingraph-types'
import { OKXDexClient } from '@okx-dex/okx-dex-sdk'
import { NODE_CATEGORIES } from '../../categories'
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
  @String({
    title: 'Chain ID',
    description: 'Blockchain network identifier (will be deprecated in the future)',
    required: false,
  })
  chainId?: string

  @Input()
  @String({
    title: 'Chain Index',
    description: 'Unique identifier for the chain (e.g., 1 for Ethereum)',
    required: false,
  })
  chainIndex?: string

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

      // Initialize the OKX DEX client
      const client = new OKXDexClient({
        apiKey: this.config.apiKey,
        secretKey: this.config.secretKey,
        apiPassphrase: this.config.apiPassphrase,
        projectId: this.config.projectId,
        // Add other configs as needed
      })

      // Make the API call using the SDK - adjust method name if needed
      const response = await client.dex.getTokens(this.chainId ?? this.chainIndex ?? '1')

      // console.log(`[OKXGetTokensNode] API response: ${JSON.stringify(response)}`)

      for (const row of response.data) {
        const token = row as any

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
    if (!this.config.apiKey)
      throw new Error('API Key is required')
    if (!this.config.secretKey)
      throw new Error('Secret Key is required')
    if (!this.config.apiPassphrase)
      throw new Error('API Passphrase is required')
    if (!this.config.projectId)
      throw new Error('Project ID is required')

    // At least one chain identifier should be provided
    if (!this.chainId && !this.chainIndex) {
      throw new Error('Either Chain ID or Chain Index must be provided')
    }
  }
}

export default OKXGetTokensNode
