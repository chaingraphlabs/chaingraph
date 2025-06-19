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
  Number,
  Output,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

// Minimal ERC20 ABI for reading token info
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
]

/**
 * Node for retrieving ERC20 token information
 */
@Node({
  type: 'GetERC20TokenInfoNode',
  title: 'Get ERC20 Token Info',
  description: 'Retrieves information about an ERC20 token including name, symbol, decimals, and total supply',
  category: NODE_CATEGORIES.BLOCKCHAIN,
  tags: ['token', 'erc20', 'web3', 'blockchain', 'info'],
})
export class GetERC20TokenInfoNode extends BaseNode {
  @Input()
  @String({
    title: 'Token Address',
    description: 'The ERC20 token contract address',
    required: true,
  })
  tokenAddress: string = ''

  @Input()
  @Number({
    title: 'Chain ID (Optional)',
    description: 'Chain ID to use (defaults to connected wallet chain or mainnet)',
    defaultValue: 0,
  })
  chainIdOverride: number = 0

  @Output()
  @String({
    title: 'Token Address',
    description: 'The token contract address (echoed from input)',
    defaultValue: '',
  })
  tokenAddressOutput: string = ''

  @Output()
  @String({
    title: 'Name',
    description: 'The token name',
    defaultValue: '',
  })
  name: string = ''

  @Output()
  @String({
    title: 'Symbol',
    description: 'The token symbol',
    defaultValue: '',
  })
  symbol: string = ''

  @Output()
  @Number({
    title: 'Decimals',
    description: 'The number of decimals the token uses',
    defaultValue: 0,
  })
  decimals: number = 0

  @Output()
  @String({
    title: 'Total Supply',
    description: 'The total supply of tokens (as a string to handle large numbers)',
    defaultValue: '0',
  })
  totalSupply: string = '0'

  @Output()
  @String({
    title: 'Formatted Total Supply',
    description: 'Human-readable formatted total supply',
    defaultValue: '0',
  })
  formattedTotalSupply: string = '0'

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Get wallet context from execution context
    const walletContext = context.getIntegration<WalletContext>('wallet')

    if (!this.tokenAddress) {
      throw new Error('Token address is required')
    }

    // Echo the token address to output
    this.tokenAddressOutput = this.tokenAddress

    // Determine chain ID and RPC URL to use
    const chainId = this.chainIdOverride > 0 
      ? this.chainIdOverride 
      : (walletContext?.chainId || 1)
      
    let rpcUrl = walletContext?.rpcUrl
    if (!rpcUrl) {
      rpcUrl = this.getDefaultRpcUrl(chainId)
    }

    try {
      // Prepare function signatures for ERC20 methods
      const nameSelector = '0x06fdde03' // keccak256("name()")
      const symbolSelector = '0x95d89b41' // keccak256("symbol()")
      const decimalsSelector = '0x313ce567' // keccak256("decimals()")
      const totalSupplySelector = '0x18160ddd' // keccak256("totalSupply()")

      // Make parallel RPC calls
      const [nameRes, symbolRes, decimalsRes, totalSupplyRes] = await Promise.all([
        this.callContract(rpcUrl, this.tokenAddress, nameSelector),
        this.callContract(rpcUrl, this.tokenAddress, symbolSelector),
        this.callContract(rpcUrl, this.tokenAddress, decimalsSelector),
        this.callContract(rpcUrl, this.tokenAddress, totalSupplySelector),
      ])

      // Decode responses
      this.name = this.decodeString(nameRes)
      this.symbol = this.decodeString(symbolRes)
      this.decimals = parseInt(decimalsRes, 16)
      this.totalSupply = BigInt(totalSupplyRes).toString()

      // Format total supply with decimals
      const totalSupplyNumber = parseFloat(this.totalSupply) / Math.pow(10, this.decimals)
      this.formattedTotalSupply = `${totalSupplyNumber.toLocaleString()} ${this.symbol}`

    } catch (error: any) {
      throw new Error(`Failed to get token info: ${error.message}`)
    }

    return {}
  }

  private async callContract(rpcUrl: string, contractAddress: string, data: string): Promise<string> {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: contractAddress,
          data: data,
        }, 'latest'],
        id: 1,
      }),
    })

    const result = await response.json()
    if (result.error) {
      throw new Error(result.error.message || 'RPC error')
    }

    return result.result
  }

  private decodeString(hex: string): string {
    // Remove 0x prefix
    hex = hex.slice(2)
    
    // Skip offset (32 bytes) and length (32 bytes)
    const dataHex = hex.slice(128)
    
    // Convert hex to string using Buffer
    const bytes = []
    for (let i = 0; i < dataHex.length; i += 2) {
      const byte = parseInt(dataHex.substr(i, 2), 16)
      if (byte === 0) break
      bytes.push(byte)
    }
    
    // Use Buffer to convert bytes to string
    return Buffer.from(bytes).toString('utf8')
  }

  private getDefaultRpcUrl(chainId: number): string {
    switch (chainId) {
      case 1:
        return 'https://eth.llamarpc.com'
      case 137:
        return 'https://polygon-rpc.com'
      case 56:
        return 'https://bsc-dataseed.binance.org'
      case 42161:
        return 'https://arb1.arbitrum.io/rpc'
      case 10:
        return 'https://mainnet.optimism.io'
      case 8453: // Base
        return 'https://mainnet.base.org'
      default:
        throw new Error(`No default RPC URL for chain ID ${chainId}`)
    }
  }
}

export default GetERC20TokenInfoNode