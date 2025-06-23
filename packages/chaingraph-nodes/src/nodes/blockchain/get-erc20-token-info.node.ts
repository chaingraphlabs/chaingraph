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
  Input,
  Node,
  Output,
  Number as PortNumber,
  PortObject,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { Token } from './schemas'
import { callContract, decodeString, getDefaultRpcUrl } from './utils'

/**
 * Node for retrieving ERC20 token information
 */
@Node({
  type: 'GetERC20TokenInfoNode',
  title: 'ERC20 Token Info',
  description: 'Get ERC20 token metadata (name, symbol, decimals)',
  category: NODE_CATEGORIES.BLOCKCHAIN,
  tags: ['token', 'erc20', 'web3', 'blockchain', 'info', 'metadata'],
})
export class GetERC20TokenInfoNode extends BaseNode {
  @Input()
  @String({
    title: 'Token Address',
    description: 'The ERC20 token contract address',
    required: true,
  })
  address: string = ''

  @Input()
  @PortNumber({
    title: 'Chain ID',
    description: 'Override chain ID (defaults to connected wallet chain)',
    defaultValue: 0,
  })
  chainId: number = 0

  @Output()
  @PortObject({
    title: 'Token',
    description: 'Complete token information',
    schema: Token,
  })
  token: Token = new Token()

  @Output()
  @String({
    title: 'Total Supply',
    description: 'Total supply in human-readable format',
    defaultValue: '0',
    ui: {
      hidden: true, // Hidden by default
    },
  })
  totalSupply: string = '0'

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Get wallet context from execution context
    const walletContext = context.getIntegration<WalletContext>('wallet')

    if (!this.address) {
      throw new Error('Token address is required')
    }

    // Determine chain ID and RPC URL to use
    const chainId = this.chainId > 0
      ? this.chainId
      : (walletContext?.chainId || 1)

    let rpcUrl = walletContext?.rpcUrl
    if (!rpcUrl) {
      rpcUrl = getDefaultRpcUrl(chainId)
    }

    try {
      // Prepare function signatures for ERC20 methods
      const nameSelector = '0x06fdde03' // keccak256("name()")
      const symbolSelector = '0x95d89b41' // keccak256("symbol()")
      const decimalsSelector = '0x313ce567' // keccak256("decimals()")
      const totalSupplySelector = '0x18160ddd' // keccak256("totalSupply()")

      // Make parallel RPC calls
      const [nameRes, symbolRes, decimalsRes, totalSupplyRes] = await Promise.all([
        callContract(rpcUrl, this.address, nameSelector),
        callContract(rpcUrl, this.address, symbolSelector),
        callContract(rpcUrl, this.address, decimalsSelector),
        callContract(rpcUrl, this.address, totalSupplySelector),
      ])

      // Create token object
      this.token = new Token()
      this.token.address = this.address
      this.token.name = decodeString(nameRes)
      this.token.symbol = decodeString(symbolRes)
      this.token.decimals = Number.parseInt(decimalsRes, 16)
      this.token.chainId = chainId

      // Calculate total supply
      const totalSupplyRaw = BigInt(totalSupplyRes).toString()
      const totalSupplyNumber = Number.parseFloat(totalSupplyRaw) / 10 ** this.token.decimals
      this.totalSupply = `${totalSupplyNumber.toLocaleString()} ${this.token.symbol}`
    } catch (error: any) {
      throw new Error(`Failed to get token info: ${error.message}`)
    }

    return {}
  }
}

export default GetERC20TokenInfoNode
