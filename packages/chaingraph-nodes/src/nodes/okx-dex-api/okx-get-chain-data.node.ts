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
  PortObject,
  String,
} from '@badaitech/chaingraph-types'
import { OKXDexClient } from '@okx-dex/okx-dex-sdk'
import { NODE_CATEGORIES } from '../../categories'
import { mapArray, mapChainData } from './mappers'
import { ChainData, OKXConfig } from './types'

/**
 * Node for fetching blockchain information from the OKX DEX API
 *
 * This node retrieves information about a specific blockchain including
 * its name and token approval address.
 */
@Node({
  type: 'OKXGetChainDataNode',
  title: 'OKX DEX: Get Chain Data',
  description: 'Fetches blockchain information from the OKX DEX API',
  category: NODE_CATEGORIES.OKX_DEX,
  tags: ['okx', 'dex', 'blockchain', 'chain', 'network'],
})
class OKXGetChainDataNode extends BaseNode {
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
  @PortObject({
    title: 'Chain Data',
    description: 'Information about the specified blockchain',
    schema: ChainData,
  })
  chainData: ChainData = new ChainData()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    console.log(`[OKXGetChainDataNode] Executing with chainId: ${this.chainId}`)

    try {
      // Validate inputs
      this.validateInputs()

      // Initialize the OKX DEX client
      const client = new OKXDexClient({
        apiKey: this.config.apiKey,
        secretKey: this.config.secretKey,
        apiPassphrase: this.config.apiPassphrase,
        projectId: this.config.projectId,
        // Add other config options if needed
        // baseUrl: this.config.baseUrl ?? undefined,
        // timeout: this.config.timeout ?? undefined,
        // maxRetries: (this.config.maxRetries || 0) > 0 ? this.config.maxRetries : undefined,
      })

      console.log(`[OKXGetChainDataNode] Fetching chain data for chainId: ${this.chainId}`)

      // Make the API call using the SDK
      const response = await client.dex.getChainData(this.chainId)

      console.log(`[OKXGetChainDataNode] API response: ${JSON.stringify(
        response.data[0],
      )}`)

      // response.data[0].chainId

      // Check response validity
      if (!response || response.code !== '0') {
        throw new Error(`API returned error: ${response?.msg || 'Unknown error'}`)
      }

      // Map API response to ChainGraph types
      if (response.data && Array.isArray(response.data)) {
        const respChainData = mapArray(response.data, mapChainData)
        if (respChainData && respChainData.length > 0) {
          const chainData = respChainData[0]
          this.chainData.chainId = chainData.chainId.toString()
          this.chainData.chainName = chainData.chainName.toString()
          this.chainData.dexTokenApproveAddress = chainData.dexTokenApproveAddress
        } else {
          throw new Error('No chain data found in the response')
        }
      }
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

    if (!this.chainId)
      throw new Error('Chain ID is required')
  }
}

export default OKXGetChainDataNode
