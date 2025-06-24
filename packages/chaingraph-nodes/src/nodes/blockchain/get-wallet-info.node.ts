/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult, WalletContext } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Node,
  Output,
  PortBoolean,
  PortObject,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { getChainName, WalletInfo } from './schemas'

/**
 * Node for retrieving current wallet connection information
 */
@Node({
  type: 'GetWalletInfoNode',
  title: 'Wallet Info',
  description: 'Get current wallet connection status and information',
  category: NODE_CATEGORIES.BLOCKCHAIN,
  tags: ['wallet', 'web3', 'blockchain', 'address', 'status'],
})
export class GetWalletInfoNode extends BaseNode {
  @Output()
  @PortObject({
    title: 'Wallet',
    description: 'Complete wallet information',
    schema: WalletInfo,
    ui: {
      hidePropertyEditor: true,
    },
  })
  wallet: WalletInfo = new WalletInfo()

  @Output()
  @PortBoolean({
    title: 'Connected',
    description: 'Quick connection status check',
    defaultValue: false,
    ui: {
      hidden: true, // Hidden by default, available for simple checks
    },
  })
  isConnected: boolean = false

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Get wallet context from execution context
    const walletContext = context.getIntegration<WalletContext>('wallet')

    // Create wallet info object
    this.wallet = new WalletInfo()

    if (!walletContext) {
      // No wallet context available - wallet not connected
      this.wallet.isConnected = false
      this.isConnected = false
      return {}
    }

    // Populate wallet info from context
    this.wallet.isConnected = walletContext.isConnected || false
    this.wallet.address = walletContext.address || ''
    this.wallet.chainId = walletContext.chainId || 0
    this.wallet.ensName = walletContext.ensName || ''

    // Set chain name based on chain ID
    if (this.wallet.chainId > 0) {
      this.wallet.chainName = getChainName(this.wallet.chainId)
    }

    // Set simple connected flag
    this.isConnected = this.wallet.isConnected

    return {}
  }
}

export default GetWalletInfoNode
