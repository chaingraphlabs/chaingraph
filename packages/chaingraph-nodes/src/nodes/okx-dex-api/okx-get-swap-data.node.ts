/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import type { SwapParams as SwapParamsApi } from '@okx-dex/okx-dex-sdk'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortObject,
} from '@badaitech/chaingraph-types'
import { OKXDexClient } from '@okx-dex/okx-dex-sdk'
import { NODE_CATEGORIES } from '../../categories'
import { mapSwapResponseData } from './mappers'
import { OKXConfig, SwapParams, SwapResponseData } from './types'

/**
 * Node for getting swap transaction data from the OKX DEX API
 *
 * This node provides comprehensive data needed to execute a token swap,
 * including the transaction data that can be sent to the blockchain.
 */
@Node({
  type: 'OKXGetSwapDataNode',
  title: 'OKX DEX: Get Swap Data',
  description: 'Fetches transaction data needed to execute a token swap on the blockchain',
  category: NODE_CATEGORIES.OKX_DEX,
  tags: ['okx', 'dex', 'swap', 'transaction', 'trading'],
})
class OKXGetSwapDataNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'OKX Configuration',
    description: 'API credentials and configuration for the OKX API',
    schema: OKXConfig,
  })
  config: OKXConfig = new OKXConfig()

  @Input()
  @PortObject({
    title: 'Swap Parameters',
    description: 'Parameters for the token swap',
    schema: SwapParams,
  })
  swapParams: SwapParams = new SwapParams()

  @Output()
  @PortObject({
    title: 'Swap Response Data',
    description: 'Comprehensive swap data including transaction details',
    schema: SwapResponseData,
  })
  swapResponseData: SwapResponseData = new SwapResponseData()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
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
      // Convert our SwapParams class to a plain object the SDK expects
      const params: SwapParamsApi = {
        chainId: this.swapParams.chainId,
        fromTokenAddress: this.swapParams.fromTokenAddress,
        toTokenAddress: this.swapParams.toTokenAddress,
        amount: this.swapParams.amount,
        userWalletAddress: this.swapParams.userWalletAddress,
        slippage: this.swapParams.slippage,
        autoSlippage: this.swapParams.autoSlippage,
        maxAutoSlippage: this.swapParams.maxAutoSlippage,
      }

      console.log(`[OKXGetSwapDataNode] Fetching swap data with params: ${JSON.stringify(params)}`)

      // Make the API call using the SDK
      const response = await client.dex.getSwapData(params)

      console.log(`[OKXGetSwapDataNode] API response: ${JSON.stringify(response)}`)

      // Check response validity
      if (!response || response.code !== '0') {
        console.error(`[OKXGetSwapDataNode] API error: ${JSON.stringify(response)}`)
        throw new Error(`API returned error: ${response?.msg || 'Unknown error'}`)
      }

      // Map API response to ChainGraph types
      this.swapResponseData = mapSwapResponseData(response)
    } catch (apiError: any) {
      throw new Error(`API Error: ${apiError.message || JSON.stringify(apiError)}`)
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

    // Validate swap parameters
    if (!this.swapParams.chainId)
      throw new Error('Chain ID is required')

    if (!this.swapParams.fromTokenAddress)
      throw new Error('Source token address is required')

    if (!this.swapParams.toTokenAddress)
      throw new Error('Destination token address is required')

    if (!this.swapParams.amount)
      throw new Error('Amount is required')

    // If auto slippage is disabled, slippage must be provided
    if (this.swapParams.autoSlippage === false && !this.swapParams.slippage) {
      throw new Error('Slippage is required when autoSlippage is disabled')
    }
  }
}

export default OKXGetSwapDataNode
