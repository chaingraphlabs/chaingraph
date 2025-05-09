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
import { QuoteParams } from './types'

/**
 * Node for building OKX DEX quote parameters
 *
 * This utility node helps construct properly formatted parameter objects
 * for the OKX DEX Get Quote API.
 */
@Node({
  type: 'OKXQuoteParamsNode',
  title: 'OKX DEX: Quote Parameters',
  description: 'Constructs quote parameters for OKX DEX API calls',
  category: NODE_CATEGORIES.OKX_DEX,
  tags: ['okx', 'dex', 'parameters', 'quote', 'swap'],
})
class OKXQuoteParamsNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'Quote Parameters Input',
    description: 'Formatted parameters object for OKX DEX Quote API',
    schema: QuoteParams,
  })
  quoteParamsInput: QuoteParams = new QuoteParams()

  @Output()
  @PortObject({
    title: 'Quote Parameters',
    description: 'Formatted parameters object for OKX DEX Quote API',
    schema: QuoteParams,
  })
  quoteParams: QuoteParams = new QuoteParams()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate inputsx
    // this.validateInputs()

    // Build the quote parameters object
    this.quoteParams.slippage = this.quoteParamsInput.slippage
    this.quoteParams.chainId = this.quoteParamsInput.chainId
    this.quoteParams.fromTokenAddress = this.quoteParamsInput.fromTokenAddress
    this.quoteParams.toTokenAddress = this.quoteParamsInput.toTokenAddress
    this.quoteParams.amount = this.quoteParamsInput.amount
    this.quoteParams.userWalletAddress = this.quoteParamsInput.userWalletAddress

    return {}
  }

  /**
   * Validates the input parameters
   */
  // private validateInputs(): void {
  //   if (!this.quoteParamsInput.chainId)
  //     throw new Error('Chain ID is required')
  //
  //   if (!this.quoteParamsInput.fromTokenAddress)
  //     throw new Error('Source token address is required')
  //
  //   if (!this.quoteParamsInput.toTokenAddress)
  //     throw new Error('Destination token address is required')
  //
  //   if (!this.quoteParamsInput.amount)
  //     throw new Error('Amount is required')
  //
  //   if (!this.quoteParamsInput.slippage)
  //     throw new Error('Slippage is required')
  //
  //   // Validate slippage format
  //   const slippageNum = Number.parseFloat(this.quoteParamsInput.slippage)
  //   if (Number.isNaN(slippageNum) || slippageNum <= 0)
  //     throw new Error('Slippage must be a positive number')
  // }
}

export default OKXQuoteParamsNode
