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
  Boolean,
  Node,
  Number,
  Output,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

/**
 * Node for retrieving current wallet connection information
 */
@Node({
  type: 'GetWalletInfoNode',
  title: 'Get Wallet Info',
  description: 'Retrieves current wallet connection information including address, chain ID, and connection status',
  category: NODE_CATEGORIES.BLOCKCHAIN,
  tags: ['wallet', 'web3', 'blockchain', 'address', 'status'],
})
export class GetWalletInfoNode extends BaseNode {
  @Output()
  @Boolean({
    title: 'Is Connected',
    description: 'Whether a wallet is currently connected',
    defaultValue: false,
  })
  isConnected: boolean = false

  @Output()
  @String({
    title: 'Address',
    description: 'The connected wallet address',
    defaultValue: '',
  })
  address: string = ''

  @Output()
  @Number({
    title: 'Chain ID',
    description: 'The current chain ID',
    defaultValue: 0,
  })
  chainId: number = 0

  @Output()
  @String({
    title: 'ENS Name',
    description: 'ENS name associated with the wallet address (if available)',
    defaultValue: '',
  })
  ensName: string = ''

  @Output()
  @String({
    title: 'Provider Type',
    description: 'The wallet provider type (e.g., metamask, walletconnect)',
    defaultValue: '',
  })
  providerType: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Get wallet context from execution context
    const walletContext = context.getIntegration<WalletContext>('wallet')

    if (!walletContext) {
      // No wallet context available - wallet not connected
      this.isConnected = false
      this.address = ''
      this.chainId = 0
      this.ensName = ''
      this.providerType = ''
      return {}
    }

    // Set outputs from wallet context
    this.isConnected = walletContext.isConnected || false
    this.address = walletContext.address || ''
    this.chainId = walletContext.chainId || 0
    this.ensName = walletContext.ensName || ''
    this.providerType = walletContext.providerType || ''

    return {}
  }
}

export default GetWalletInfoNode
