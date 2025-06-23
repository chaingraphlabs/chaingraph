/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Default RPC URLs for supported chains
 */
export const DEFAULT_RPC_URLS: Record<number, string> = {
  1: 'https://eth.llamarpc.com', // Ethereum
  137: 'https://polygon-rpc.com', // Polygon
  56: 'https://bsc-dataseed.binance.org', // BSC
  42161: 'https://arb1.arbitrum.io/rpc', // Arbitrum
  10: 'https://mainnet.optimism.io', // Optimism
  8453: 'https://mainnet.base.org', // Base
}

/**
 * Get default RPC URL for a chain
 */
export function getDefaultRpcUrl(chainId: number): string {
  const url = DEFAULT_RPC_URLS[chainId]
  if (!url) {
    throw new Error(`No default RPC URL for chain ID ${chainId}`)
  }
  return url
}

/**
 * Get native token symbol for a chain
 */
export function getNativeTokenSymbol(chainId: number): string {
  switch (chainId) {
    case 1: // Ethereum Mainnet
    case 42161: // Arbitrum
    case 10: // Optimism
    case 8453: // Base
      return 'ETH'
    case 137: // Polygon
      return 'MATIC'
    case 56: // BSC
      return 'BNB'
    default:
      return 'ETH' // Default to ETH for unknown chains
  }
}

/**
 * Make an eth_call RPC request
 */
export async function callContract(
  rpcUrl: string,
  contractAddress: string,
  data: string,
): Promise<string> {
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
        data,
      }, 'latest'],
      id: 1,
    }),
  })

  const result = await response.json()
  if (result.error) {
    throw new Error(result.error.message || 'RPC error')
  }

  if (!result.result) {
    throw new Error(`Invalid RPC response: ${JSON.stringify(result)}`)
  }

  return result.result
}

/**
 * Decode a string from contract response
 */
export function decodeString(hex: string): string {
  // Remove 0x prefix
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex

  // If empty, return empty string
  if (!cleanHex || cleanHex === '0') {
    return ''
  }

  try {
    // ABI-encoded strings have offset (32 bytes) + length (32 bytes) + data
    // Skip the offset (first 64 chars)
    const lengthHex = cleanHex.slice(64, 128)
    const length = Number.parseInt(lengthHex, 16)

    // Get the actual string data
    const dataHex = cleanHex.slice(128, 128 + length * 2)

    // Convert hex to string
    const bytes: number[] = []
    for (let i = 0; i < dataHex.length; i += 2) {
      bytes.push(Number.parseInt(dataHex.slice(i, i + 2), 16))
    }

    // Use TextDecoder for proper UTF-8 decoding
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(new Uint8Array(bytes))
  } catch (e) {
    // Fallback for simple strings (not ABI encoded)
    try {
      const bytes: number[] = []
      for (let i = 0; i < cleanHex.length; i += 2) {
        const byte = Number.parseInt(cleanHex.slice(i, i + 2), 16)
        if (byte === 0)
          break // Stop at null terminator
        bytes.push(byte)
      }
      const decoder = new TextDecoder('utf-8')
      return decoder.decode(new Uint8Array(bytes))
    } catch {
      return ''
    }
  }
}

/**
 * Encode ERC20 transfer function data
 */
export function encodeERC20Transfer(to: string, amount: string): string {
  // transfer(address,uint256) selector
  const selector = '0xa9059cbb'

  // Remove 0x prefix and pad address to 32 bytes
  const paddedAddress = to.toLowerCase().replace('0x', '').padStart(64, '0')

  // Convert amount to hex and pad to 32 bytes
  const amountHex = BigInt(amount).toString(16).padStart(64, '0')

  return selector + paddedAddress + amountHex
}

/**
 * Encode ERC20 approve function data
 */
export function encodeERC20Approve(spender: string, amount: string): string {
  // approve(address,uint256) selector
  const selector = '0x095ea7b3'

  // Remove 0x prefix and pad address to 32 bytes
  const paddedAddress = spender.toLowerCase().replace('0x', '').padStart(64, '0')

  // Convert amount to hex and pad to 32 bytes
  const amountHex = BigInt(amount).toString(16).padStart(64, '0')

  return selector + paddedAddress + amountHex
}

/**
 * Estimate gas for a transaction
 */
export async function estimateGas(
  rpcUrl: string,
  transaction: {
    from?: string
    to: string
    value?: string
    data?: string
  },
): Promise<string> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_estimateGas',
      params: [transaction],
      id: 1,
    }),
  })

  const result = await response.json()
  if (result.error) {
    throw new Error(result.error.message || 'Gas estimation failed')
  }

  return BigInt(result.result).toString()
}

/**
 * Get current gas price
 */
export async function getGasPrice(rpcUrl: string): Promise<string> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_gasPrice',
      params: [],
      id: 1,
    }),
  })

  const result = await response.json()
  if (result.error) {
    throw new Error(result.error.message || 'Failed to get gas price')
  }

  return BigInt(result.result).toString()
}

/**
 * Format wei to decimal ETH
 */
export function formatEther(wei: string, decimals: number = 6): string {
  try {
    const weiBigInt = BigInt(wei)
    const etherBigInt = weiBigInt / BigInt(10 ** 18)
    const remainder = weiBigInt % BigInt(10 ** 18)

    if (remainder === 0n) {
      return etherBigInt.toString()
    }

    const remainderStr = remainder.toString().padStart(18, '0')
    const decimalPart = remainderStr.slice(0, decimals).replace(/0+$/, '')

    return decimalPart.length > 0
      ? `${etherBigInt}.${decimalPart}`
      : etherBigInt.toString()
  } catch {
    return '0'
  }
}

/**
 * Parse decimal string to wei
 */
export function parseEther(ether: string): string {
  try {
    const [whole, decimal = ''] = ether.split('.')
    const paddedDecimal = decimal.padEnd(18, '0').slice(0, 18)
    const wei = BigInt(whole) * BigInt(10 ** 18) + BigInt(paddedDecimal)
    return wei.toString()
  } catch {
    return '0'
  }
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Convert address to checksum format
 */
export function toChecksumAddress(address: string): string {
  // This is a simplified version - full implementation would use keccak256
  return address.toLowerCase()
}
