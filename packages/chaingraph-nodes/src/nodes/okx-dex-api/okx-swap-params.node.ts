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
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { SwapParams } from './types'

/**
 * Node for building OKX DEX swap parameters
 *
 * This utility node helps construct properly formatted parameter objects
 * for the OKX DEX Get Swap Data API.
 */
@Node({
  type: 'OKXSwapParamsNode',
  title: 'OKX DEX: Swap Parameters',
  description: 'Constructs swap parameters for OKX DEX API calls',
  category: NODE_CATEGORIES.OKX_DEX,
  tags: ['okx', 'dex', 'parameters', 'swap', 'transaction'],
})
class OKXSwapParamsNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'Swap Parameters Input',
    description: 'Formatted parameters object for OKX DEX Swap API',
    schema: SwapParams,
  })
  swapParamsInput: SwapParams = new SwapParams()

  @Output()
  @PortObject({
    title: 'Swap Parameters',
    description: 'Formatted parameters object for OKX DEX Swap API',
    schema: SwapParams,
  })
  swapParams: SwapParams = new SwapParams()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Build the swap parameters object
    this.swapParams.chainId = this.swapParamsInput.chainId
    this.swapParams.fromTokenAddress = this.swapParamsInput.fromTokenAddress
    this.swapParams.toTokenAddress = this.swapParamsInput.toTokenAddress
    this.swapParams.amount = this.swapParamsInput.amount
    this.swapParams.autoSlippage = this.swapParamsInput.autoSlippage
    this.swapParams.slippage = this.swapParamsInput.slippage
    this.swapParams.maxAutoSlippage = this.swapParamsInput.maxAutoSlippage
    this.swapParams.userWalletAddress = this.swapParamsInput.userWalletAddress

    return {}
  }
}

export default OKXSwapParamsNode
