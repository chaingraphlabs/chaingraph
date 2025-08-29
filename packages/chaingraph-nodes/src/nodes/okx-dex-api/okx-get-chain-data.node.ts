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
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { mapArray, mapChainData } from './mappers'
import { createDexApiClient } from './okx-dex-client'
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
  @PortString({
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
    ui: {
      hidePropertyEditor: true,
    },
  })
  chainData: ChainData = new ChainData()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      // Validate inputs
      this.validateInputs()

      // Decrypt secrets
      if (!this.config.secrets)
        throw new Error('Secrets configuration is required')

      const client = await createDexApiClient(context, this.config)

      // Make the API call using the SDK
      const response = await client.dex.getChainData(this.chainId)

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
    if (!this.config.projectId)
      throw new Error('Project ID is required')

    if (!this.chainId)
      throw new Error('Chain ID is required')
  }
}

export default OKXGetChainDataNode
