/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import {
  ObjectSchema,
  PortBoolean,
  PortNumber,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'

/**
 * ERC20 Token information
 */
@ObjectSchema({
  description: 'ERC20 Token information including metadata and chain',
  type: 'Token',
})
export class Token {
  @PortString({
    title: 'Address',
    description: 'Token contract address',
    required: true,
  })
  address: string = ''

  @PortString({
    title: 'Symbol',
    description: 'Token symbol (e.g., USDT, DAI)',
    required: false,
  })
  symbol: string = ''

  @PortString({
    title: 'Name',
    description: 'Token full name',
    required: false,
  })
  name: string = ''

  @PortNumber({
    title: 'Decimals',
    description: 'Number of decimal places',
    required: false,
    defaultValue: 18,
  })
  decimals: number = 18

  @PortNumber({
    title: 'Chain ID',
    description: 'Blockchain network ID',
    required: true,
    defaultValue: 1,
  })
  chainId: number = 1
}

/**
 * Native blockchain token (ETH, MATIC, BNB, etc.)
 */
@ObjectSchema({
  description: 'Native blockchain token information',
  type: 'NativeToken',
})
export class NativeToken extends Token {
  constructor(chainId: number = 1) {
    super()
    this.chainId = chainId
    this.decimals = 18
    this.address = '0x0000000000000000000000000000000000000000'

    // Set symbol and name based on chainId
    switch (chainId) {
      case 1: // Ethereum
      case 42161: // Arbitrum
      case 10: // Optimism
      case 8453: // Base
        this.symbol = 'ETH'
        this.name = 'Ether'
        break
      case 137: // Polygon
        this.symbol = 'MATIC'
        this.name = 'Polygon'
        break
      case 56: // BSC
        this.symbol = 'BNB'
        this.name = 'BNB'
        break
      default:
        this.symbol = 'ETH'
        this.name = 'Ether'
    }
  }
}

/**
 * Amount with multiple representations
 */
@ObjectSchema({
  description: 'Amount with raw value and formatted display',
  type: 'Amount',
})
export class Amount {
  @PortString({
    title: 'Value',
    description: 'Amount in smallest unit (wei, satoshi, etc.)',
    required: true,
    defaultValue: '0',
  })
  value: string = '0'

  @PortNumber({
    title: 'Decimals',
    description: 'Number of decimal places',
    required: true,
    defaultValue: 18,
  })
  decimals: number = 18

  @PortString({
    title: 'Formatted',
    description: 'Human-readable amount (e.g., "1.5")',
    required: false,
    defaultValue: '0.0',
  })
  formatted?: string = '0.0'
}

/**
 * Connected wallet information
 */
@ObjectSchema({
  description: 'Connected wallet information including address, network, and status',
  type: 'WalletInfo',
})
export class WalletInfo {
  @PortBoolean({
    title: 'Connected',
    description: 'Wallet connection status',
    required: true,
    defaultValue: false,
  })
  isConnected: boolean = false

  @PortString({
    title: 'Address',
    description: 'Wallet address',
    required: false,
    defaultValue: '',
  })
  address: string = ''

  @PortString({
    title: 'ENS Name',
    description: 'ENS name if available',
    required: false,
    defaultValue: '',
  })
  ensName: string = ''

  @PortNumber({
    title: 'Chain ID',
    description: 'Current network chain ID',
    required: false,
    defaultValue: 0,
  })
  chainId: number = 0

  @PortString({
    title: 'Chain Name',
    description: 'Human-readable network name',
    required: false,
    defaultValue: '',
  })
  chainName: string = ''
}

/**
 * Blockchain transaction
 */
@ObjectSchema({
  description: 'Blockchain transaction ready for signing',
  type: 'Transaction',
})
export class Transaction {
  @PortString({
    title: 'From',
    description: 'Sender address',
    required: false,
    defaultValue: '',
  })
  from: string = ''

  @PortString({
    title: 'To',
    description: 'Recipient address',
    required: true,
  })
  to: string = ''

  @PortString({
    title: 'Value (Wei)',
    description: 'Native token amount in wei',
    required: false,
    defaultValue: '0',
  })
  value: string = '0'

  @PortString({
    title: 'Data',
    description: 'Encoded transaction data',
    required: false,
    defaultValue: '0x',
  })
  data: string = '0x'

  @PortNumber({
    title: 'Chain ID',
    description: 'Target network chain ID',
    required: true,
    defaultValue: 1,
  })
  chainId: number = 1

  @PortString({
    title: 'Gas Limit',
    description: 'Estimated gas limit',
    required: false,
    defaultValue: '21000',
  })
  gasLimit: string = '21000'

  @PortObject({
    title: 'Amount',
    description: 'Transfer amount',
    schema: Amount,
    required: false,
  })
  amount?: Amount

  @PortObject({
    title: 'Token',
    description: 'Token being transferred (null for native)',
    schema: Token,
    required: false,
  })
  token?: Token
}

/**
 * Helper function to get chain name from chain ID
 */
export function getChainName(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'Ethereum'
    case 137:
      return 'Polygon'
    case 56:
      return 'BSC'
    case 42161:
      return 'Arbitrum'
    case 10:
      return 'Optimism'
    case 8453:
      return 'Base'
    default:
      return `Chain ${chainId}`
  }
}

/**
 * Helper function to create a native token for a chain
 */
export function createNativeToken(chainId: number): Token {
  return new NativeToken(chainId)
}

/**
 * Helper function to format amount
 */
export function formatAmount(raw: string, decimals: number): Amount {
  const amount = new Amount()
  amount.value = raw
  amount.decimals = decimals

  try {
    const rawBigInt = BigInt(raw)
    const divisor = BigInt(10 ** decimals)
    const quotient = rawBigInt / divisor
    const remainder = rawBigInt % divisor

    // Format with proper decimal places
    const decimalStr = remainder.toString().padStart(decimals, '0')
    const trimmedDecimal = decimalStr.replace(/0+$/, '') // Remove trailing zeros

    amount.formatted = trimmedDecimal.length > 0
      ? `${quotient}.${trimmedDecimal}`
      : quotient.toString()
  } catch (e) {
    amount.formatted = '0'
  }

  return amount
}

/**
 * Helper to check if a token is native
 */
export function isNativeToken(token: Token): boolean {
  return token.address === '0x0000000000000000000000000000000000000000'
    || token.address.toLowerCase() === '0x0000000000000000000000000000000000000000'
}
