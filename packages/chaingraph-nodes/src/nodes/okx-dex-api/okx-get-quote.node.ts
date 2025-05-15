/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import type { QuoteParams as QuoteParamsApi } from '@okx-dex/okx-dex-sdk'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortArray,
  PortObject,
} from '@badaitech/chaingraph-types'
import { OKXDexClient } from '@okx-dex/okx-dex-sdk'
import { NODE_CATEGORIES } from '../../categories'
import { mapArray, mapQuoteData } from './mappers'
import { OKXConfig, QuoteData, QuoteParams } from './types'

/**
 * Node for getting token swap quotes from the OKX DEX API
 *
 * This node provides pricing information, routing options, and gas estimates
 * for token swaps on supported blockchains.
 */
@Node({
  type: 'OKXGetQuoteNode',
  title: 'OKX DEX: Get Quote',
  description: 'Fetches swap quote information for tokens including price impact, routing, and fees',
  category: NODE_CATEGORIES.OKX_DEX,
  tags: ['okx', 'dex', 'swap', 'quote', 'price', 'trading'],
})
class OKXGetQuoteNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'OKX Configuration',
    description: 'API credentials and configuration for the OKX API',
    schema: OKXConfig,
  })
  config: OKXConfig = new OKXConfig()

  @Input()
  @PortObject({
    title: 'Quote Parameters',
    description: 'Parameters for the token swap quote',
    schema: QuoteParams,
  })
  quoteParams: QuoteParams = new QuoteParams()

  @Output()
  @PortArray({
    title: 'Quote Data',
    description: 'Comprehensive quote information including routing, fees, and price impact',
    itemConfig: {
      type: 'object',
      schema: QuoteData,
    },
  })
  quoteData: QuoteData[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Reset outputs
    this.quoteData = []

    // Validate inputs
    this.validateInputs()

    // Initialize the OKX DEX client
    const client = new OKXDexClient({
      apiKey: this.config.apiKey,
      secretKey: this.config.secretKey,
      apiPassphrase: this.config.apiPassphrase,
      projectId: this.config.projectId,
      // baseUrl: this.config.baseUrl,
      // timeout: this.config.timeout,
      // maxRetries: this.config.maxRetries,
    })

    try {
      // Convert our QuoteParams class to a plain object the SDK expects
      const params: QuoteParamsApi = {
        chainId: this.quoteParams.chainId,
        fromTokenAddress: this.quoteParams.fromTokenAddress,
        toTokenAddress: this.quoteParams.toTokenAddress,
        amount: this.quoteParams.amount,
        slippage: this.quoteParams.slippage,
        userWalletAddress: this.quoteParams.userWalletAddress,
      }

      console.log(`[OKXGetQuoteNode] Fetching quote with params: ${JSON.stringify(params)}`)

      // Make the API call using the SDK
      const response = await client.dex.getQuote(params)

      console.log(`[OKXGetQuoteNode] API response: ${JSON.stringify(response)}`)

      // return {}

      // Check response validity
      if (!response || response.code !== '0') {
        throw new Error(`API returned error: ${response?.msg || 'Unknown error'}`)
      }

      // Map API response to ChainGraph types
      if (response.data && Array.isArray(response.data)) {
        this.quoteData = mapArray(response.data, mapQuoteData)
      }
    } catch (apiError: any) {
      throw new Error(`API Error: ${apiError.message || apiError}`)
    }

    return {}
  }

  /**
   * Validates the input parameters
   */
  private validateInputs(): void {
    // Validate OKX config
    if (!this.config.apiKey)
      throw new Error('API Key is required')

    if (!this.config.secretKey)
      throw new Error('Secret Key is required')

    if (!this.config.apiPassphrase)
      throw new Error('API Passphrase is required')

    if (!this.config.projectId)
      throw new Error('Project ID is required')

    // Validate quote parameters
    if (!this.quoteParams.chainId)
      throw new Error('Chain ID is required')

    if (!this.quoteParams.fromTokenAddress)
      throw new Error('Source token address is required')

    if (!this.quoteParams.toTokenAddress)
      throw new Error('Destination token address is required')

    if (!this.quoteParams.amount)
      throw new Error('Amount is required')

    if (!this.quoteParams.slippage)
      throw new Error('Slippage is required')
  }
}

export default OKXGetQuoteNode
