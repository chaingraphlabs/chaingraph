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
  Boolean,
  Input,
  Node,
  Output,
  PortArray,
  PortObject,
  String,
} from '@badaitech/chaingraph-types'
import { OKXDexClient } from '@okx-dex/okx-dex-sdk'
import { NODE_CATEGORIES } from '../../categories'
import { mapArray, mapQuoteData } from './mappers'
import { OKXConfig, QuoteData } from './types'

/**
 * Node for fetching liquidity information from the OKX DEX API
 *
 * This node retrieves liquidity information for a specific blockchain
 * through the OKX DEX API using the official SDK.
 */
@Node({
  type: 'OKXGetLiquidityNode',
  title: 'OKX DEX: Get Liquidity',
  description: 'Fetches liquidity information from the OKX DEX API for a specific blockchain',
  category: NODE_CATEGORIES.OKX_DEX,
  tags: ['okx', 'dex', 'liquidity', 'swap', 'crypto', 'blockchain'],
})
class OKXGetLiquidityNode extends BaseNode {
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
    description: 'Blockchain network identifier (e.g., "1" for Ethereum, "56" for BSC)',
    required: true,
  })
  chainId: string = ''

  @Output()
  @PortArray({
    title: 'Liquidity Data',
    description: 'Liquidity information for the specified blockchain',
    itemConfig: {
      type: 'object',
      schema: QuoteData,
    },
  })
  liquidityData: QuoteData[] = []

  @Output()
  @Boolean({
    title: 'Success',
    description: 'Whether the API call was successful',
  })
  success: boolean = false

  @Output()
  @String({
    title: 'Error Message',
    description: 'Error message if the API call failed',
  })
  errorMessage: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      // Reset outputs
      this.liquidityData = []
      this.success = false
      this.errorMessage = ''

      // Validate inputs
      this.validateInputs()

      // Initialize the OKX DEX client
      const client = new OKXDexClient({
        apiKey: this.config.apiKey,
        secretKey: this.config.secretKey,
        apiPassphrase: this.config.apiPassphrase,
        projectId: this.config.projectId,
        baseUrl: this.config.baseUrl,
        timeout: this.config.timeout,
        maxRetries: this.config.maxRetries,
      })

      try {
        // Make the API call using the SDK
        const response = await client.dex.getLiquidity(this.chainId)

        // Check response validity
        if (!response || response.code !== '0') {
          throw new Error(`API returned error: ${response?.msg || 'Unknown error'}`)
        }

        // Map API response to ChainGraph types
        if (response.data && Array.isArray(response.data)) {
          this.liquidityData = mapArray(response.data, mapQuoteData)
        }

        this.success = true
      } catch (apiError: any) {
        throw new Error(`API Error: ${apiError.message || JSON.stringify(apiError)}`)
      }

      return {}
    } catch (error: any) {
      this.errorMessage = error.message || 'Unknown error occurred'
      this.success = false
      console.error(`[OKXGetLiquidityNode] Error: ${this.errorMessage}`)
      throw error
    }
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

    if (!this.chainId)
      throw new Error('Chain ID is required')
  }
}

export default OKXGetLiquidityNode
