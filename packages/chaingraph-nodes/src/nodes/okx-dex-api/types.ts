/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EncryptedSecretValue } from '@badaitech/chaingraph-types'
import { PortSecret } from '@badaitech/chaingraph-types'
import {
  ObjectSchema,
  PortArray,
  PortBoolean,
  PortNumber,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'

/**
 * TokenInfo provides detailed information about a token on a blockchain
 *
 * Contains essential data like contract address, symbol, decimal precision,
 * and security indicators like honeypot detection and tax rates.
 */
@ObjectSchema({
  description: 'Information about a specific token on the blockchain',
})
export class TokenInfo {
  @PortString({
    title: 'Decimal Precision',
    description: 'Number of decimal places used by the token',
    required: true,
  })
  decimal: string = ''

  @PortBoolean({
    title: 'Honeypot Status',
    description: 'Flag indicating if the token is identified as a scam/honeypot',
  })
  isHoneyPot: boolean = false

  @PortString({
    title: 'Tax Rate',
    description: 'Fee percentage charged when transferring this token',
    required: true,
  })
  taxRate: string = ''

  @PortString({
    title: 'Contract Address',
    description: 'Blockchain address where the token smart contract is deployed',
    required: true,
  })
  tokenContractAddress: string = ''

  @PortString({
    title: 'Token Symbol',
    description: 'Trading symbol for the token (e.g., ETH, BTC)',
    required: true,
  })
  tokenSymbol: string = ''

  @PortString({
    title: 'Token Unit Price',
    description: 'Current price of one token unit in quote currency',
    required: true,
  })
  tokenUnitPrice: string = ''
}

/**
 * TokenInfoList represents a single token info entry
 * This is a type alias for TokenInfo in the original API
 */
@ObjectSchema({
  description: 'A single token information entry (alias for TokenInfo)',
})
export class TokenInfoList extends TokenInfo { }

/**
 * TokenListResponse contains basic information about a token
 * Used when listing multiple tokens without full details
 */
@ObjectSchema({
  description: 'Basic token information returned in token listing responses',
})
export class TokenListResponse {
  @PortString({
    title: 'Decimal Precision',
    description: 'Number of decimal places used by the token',
    required: true,
  })
  decimals: string = ''

  @PortString({
    title: 'Contract Address',
    description: 'Blockchain address where the token smart contract is deployed',
    required: true,
  })
  tokenContractAddress: string = ''

  @PortString({
    title: 'Token Logo URL',
    description: 'URL to the token\'s logo image (optional)',
  })
  tokenLogoUrl?: string

  @PortString({
    title: 'Token Name',
    description: 'Full name of the token (optional)',
  })
  tokenName?: string

  @PortString({
    title: 'Token Symbol',
    description: 'Trading symbol for the token (e.g., ETH, BTC)',
    required: true,
  })
  tokenSymbol: string = ''
}

/**
 * TokenListInfo is an alias for TokenListResponse
 */
@ObjectSchema({
  description: 'Token list information (alias for TokenListResponse)',
})
export class TokenListInfo extends TokenListResponse { }

/**
 * DexProtocol represents a decentralized exchange protocol
 * with its contribution percentage to a swap route
 */
@ObjectSchema({
  description: 'Information about a DEX protocol used in a swap route',
})
export class DexProtocol {
  @PortString({
    title: 'DEX Name',
    description: 'Name of the decentralized exchange (e.g., Uniswap, SushiSwap)',
    required: true,
  })
  dexName: string = ''

  @PortString({
    title: 'Usage Percentage',
    description: 'Percentage of the total swap that uses this DEX protocol',
    required: true,
  })
  percent: string = ''
}

/**
 * SubRouterInfo represents a segment of a swap route
 * showing which DEX protocols are used for this segment
 */
@ObjectSchema({
  description: 'Information about a sub-route in a complex swap path',
})
export class SubRouterInfo {
  @PortArray({
    title: 'DEX Protocols',
    description: 'List of DEX protocols used in this sub-route',
    itemConfig: {
      type: 'object',
      schema: DexProtocol,
    },
  })
  dexProtocol: DexProtocol[] = []

  @PortObject({
    title: 'Source Token',
    description: 'Token that is being swapped from in this sub-route',
    schema: TokenInfo,
  })
  fromToken: TokenInfo = new TokenInfo()

  @PortObject({
    title: 'Destination Token',
    description: 'Token that is being swapped to in this sub-route',
    schema: TokenInfo,
  })
  toToken: TokenInfo = new TokenInfo()
}

/**
 * DexRouter represents a router contract and its usage
 * in a complex swap route with multiple hops
 */
@ObjectSchema({
  description: 'Information about a DEX router used in swap execution',
})
export class DexRouter {
  @PortString({
    title: 'Router Address',
    description: 'Smart contract address of the DEX router',
  })
  router: string = ''

  @PortString({
    title: 'Router Usage Percentage',
    description: 'Percentage of the total swap amount routed through this router',
  })
  routerPercent: string = ''

  @PortArray({
    title: 'Sub-Routes',
    description: 'Detailed breakdown of routes within this router',
    itemConfig: {
      type: 'object',
      schema: SubRouterInfo,
    },
  })
  subRouterList: SubRouterInfo[] = []
}

/**
 * ComparisonQuote provides comparative pricing data
 * from different DEXes for the same swap
 */
@ObjectSchema({
  description: 'Comparative quote from a specific DEX for price comparison',
})
export class ComparisonQuote {
  @PortString({
    title: 'Output Amount',
    description: 'Amount of destination tokens received from this DEX',
  })
  amountOut: string = ''

  @PortString({
    title: 'DEX Logo URL',
    description: 'URL to the logo image of the DEX',
  })
  dexLogo: string = ''

  @PortString({
    title: 'DEX Name',
    description: 'Name of the decentralized exchange',
  })
  dexName: string = ''

  @PortString({
    title: 'Trading Fee',
    description: 'Fee charged by this DEX for the swap',
  })
  tradeFee: string = ''
}

/**
 * RouterResult contains comprehensive data about a swap route
 * including price impact, gas fees, and comparative quotes
 */
@ObjectSchema({
  description: 'Detailed result of a swap routing calculation',
})
export class RouterResult {
  @PortString({
    title: 'Chain ID',
    description: 'Blockchain network identifier',
  })
  chainId: string = ''

  @PortArray({
    title: 'DEX Routers',
    description: 'List of DEX routers used in the swap route',
    itemConfig: {
      type: 'object',
      schema: DexRouter,
    },
  })
  dexRouterList: DexRouter[] = []

  @PortString({
    title: 'Estimated Gas Fee',
    description: 'Estimated gas fee for executing the swap',
  })
  estimateGasFee: string = ''

  @PortObject({
    title: 'Source Token',
    description: 'Token that is being swapped from',
    schema: TokenInfo,
  })
  fromToken: TokenInfo = new TokenInfo()

  @PortObject({
    title: 'Destination Token',
    description: 'Token that is being swapped to',
    schema: TokenInfo,
  })
  toToken: TokenInfo = new TokenInfo()

  @PortString({
    title: 'Source Amount',
    description: 'Amount of source tokens to swap',
  })
  fromTokenAmount: string = ''

  @PortString({
    title: 'Destination Amount',
    description: 'Amount of destination tokens expected to receive',
  })
  toTokenAmount: string = ''

  @PortString({
    title: 'Price Impact',
    description: 'Percentage impact on market price caused by this swap',
  })
  priceImpactPercentage: string = ''

  @PortArray({
    title: 'Comparative Quotes',
    description: 'List of comparative quotes from different DEXes',
    itemConfig: {
      type: 'object',
      schema: ComparisonQuote,
    },
  })
  quoteCompareList: ComparisonQuote[] = []

  @PortString({
    title: 'Trading Fee',
    description: 'Total trading fee for the swap',
  })
  tradeFee: string = ''
}

/**
 * TransactionData contains the raw transaction details
 * needed to execute a swap on the blockchain
 */
@ObjectSchema({
  description: 'Raw transaction data needed to execute a swap on the blockchain',
})
export class TransactionData {
  @PortString({
    title: 'Transaction Data',
    description: 'Hex-encoded calldata for the transaction',
    required: true,
  })
  data: string = ''

  @PortString({
    title: 'Sender Address',
    description: 'Blockchain address initiating the transaction',
    required: true,
  })
  from: string = ''

  @PortString({
    title: 'Gas Limit',
    description: 'Maximum gas units allowed for transaction execution',
    required: true,
  })
  gas: string = ''

  @PortString({
    title: 'Gas Price',
    description: 'Price per gas unit in wei',
    required: true,
  })
  gasPrice: string = ''

  @PortString({
    title: 'Priority Fee',
    description: 'Maximum priority fee per gas (for EIP-1559 transactions)',
    required: true,
  })
  maxPriorityFeePerGas: string = ''

  @PortString({
    title: 'Minimum Receive Amount',
    description: 'Minimum acceptable amount of tokens to receive',
    required: true,
  })
  minReceiveAmount: string = ''

  @PortArray({
    title: 'Signature Data',
    description: 'Digital signatures needed for transaction authorization',
    itemConfig: { type: 'string' },
    required: true,
  })
  signatureData: string[] = []

  @PortString({
    title: 'Slippage Tolerance',
    description: 'Maximum allowed price movement as a percentage',
    required: true,
  })
  slippage: string = ''

  @PortString({
    title: 'Recipient Address',
    description: 'Destination contract address for the transaction',
    required: true,
  })
  to: string = ''

  @PortString({
    title: 'Transaction Value',
    description: 'Amount of native currency (ETH, BNB, etc.) sent with transaction',
    required: true,
  })
  value: string = ''
}

/**
 * QuoteData extends RouterResult to include transaction data
 * Provides complete information for both quote and execution
 */
@ObjectSchema({
  description: 'Complete quote data including route and optional transaction details',
})
export class QuoteData {
  @PortString({
    title: 'Chain ID',
    description: 'Blockchain network identifier',
    required: true,
  })
  chainId: string = ''

  @PortArray({
    title: 'DEX Routers',
    description: 'List of DEX routers used in the swap route',
    itemConfig: {
      type: 'object',
      schema: DexRouter,
    },
  })
  dexRouterList: DexRouter[] = []

  @PortString({
    title: 'Estimated Gas Fee',
    description: 'Estimated gas fee for executing the swap',
    required: true,
  })
  estimateGasFee: string = ''

  @PortObject({
    title: 'Source Token',
    description: 'Token that is being swapped from',
    schema: TokenInfo,
    required: true,
  })
  fromToken: TokenInfo = new TokenInfo()

  @PortObject({
    title: 'Destination Token',
    description: 'Token that is being swapped to',
    schema: TokenInfo,
    required: true,
  })
  toToken: TokenInfo = new TokenInfo()

  @PortString({
    title: 'Source Amount',
    description: 'Amount of source tokens to swap (bigint string, e.g., "1000000000000000000" for 1 token for decimal 18)',
    required: true,
  })
  fromTokenAmount: string = ''

  @PortString({
    title: 'Destination Amount',
    description: 'Amount of destination tokens expected to receive',
    required: true,
  })
  toTokenAmount: string = ''

  @PortString({
    title: 'Price Impact',
    description: 'Percentage impact on market price caused by this swap',
    required: true,
  })
  priceImpactPercentage: string = ''

  @PortArray({
    title: 'Comparative Quotes',
    description: 'List of comparative quotes from different DEXes',
    itemConfig: {
      type: 'object',
      schema: ComparisonQuote,
    },
  })
  quoteCompareList: ComparisonQuote[] = []

  @PortString({
    title: 'Trading Fee',
    description: 'Total trading fee for the swap',
    required: true,
  })
  tradeFee: string = ''

  @PortObject({
    title: 'Router Result',
    description: 'Optional detailed router result',
    schema: RouterResult,
  })
  routerResult?: RouterResult

  @PortObject({
    title: 'Transaction Data',
    description: 'Optional transaction data for execution',
    schema: TransactionData,
  })
  tx?: TransactionData
}

/**
 * ChainData provides information about a blockchain network
 */
@ObjectSchema({
  description: 'Information about a blockchain network',
})
export class ChainData {
  @PortString({
    title: 'Chain ID',
    description: 'Unique identifier for the blockchain network',
    required: true,
  })
  chainId: string = ''

  @PortString({
    title: 'Chain Name',
    description: 'Human-readable name of the blockchain network',
    required: true,
  })
  chainName: string = ''

  @PortString({
    title: 'DEX Token Approval Address',
    description: 'Address used for token approvals on this chain (null if not applicable)',
    required: true,
  })
  dexTokenApproveAddress: string = ''
}

/**
 * SwapExecutionData contains the routing result and transaction details
 * needed to execute a swap
 */
@ObjectSchema({
  description: 'Data required to execute a swap transaction',
})
export class SwapExecutionData {
  @PortObject({
    title: 'Router Result',
    description: 'Detailed routing information for the swap',
    schema: RouterResult,
    required: true,
  })
  routerResult: RouterResult = new RouterResult()

  @PortObject({
    title: 'Transaction Data',
    description: 'Optional transaction data for execution',
    schema: TransactionData,
  })
  tx?: TransactionData
}

/**
 * SwapResponseData represents the API response for a swap request
 */
@ObjectSchema({
  description: 'API response structure for swap requests',
})
export class SwapResponseData {
  @PortArray({
    title: 'Response Data',
    description: 'Array of swap execution data',
    itemConfig: {
      type: 'object',
      schema: SwapExecutionData,
    },
  })
  data: SwapExecutionData[] = []

  @PortString({
    title: 'Response Code',
    description: 'API response status code (0 indicates success)',
  })
  code: string = ''

  @PortString({
    title: 'Response Message',
    description: 'Human-readable status message or error details',
  })
  msg: string = ''
}

/**
 * APIResponse is a generic wrapper for API responses
 * with standard code, message, and data fields
 */
@ObjectSchema({
  description: 'Generic API response wrapper',
})
export class APIResponse<T> {
  @PortString({
    title: 'Response Code',
    description: 'API response status code (0 indicates success)',
  })
  code: string = ''

  @PortString({
    title: 'Response Message',
    description: 'Human-readable status message or error details',
  })
  msg: string = ''

  @PortArray({
    title: 'Response Data',
    description: 'Array of response data objects',
    itemConfig: {
      type: 'any',
    },
  })
  data: any[] = []
}

/**
 * SolanaConfig provides configuration for the Solana blockchain
 */
@ObjectSchema({
  description: 'Configuration for Solana blockchain connections',
})
export class SolanaConfig {
  @PortObject({
    title: 'Connection Settings',
    description: 'Network connection parameters for Solana',
    schema: {
      type: 'object',
      properties: {
        rpcUrl: {
          type: 'string',
          title: 'RPC URL',
          description: 'JSON-RPC endpoint URL for the Solana network',
        },
        wsEndpoint: {
          type: 'string',
          title: 'WebSocket Endpoint',
          description: 'WebSocket endpoint for real-time updates (optional)',
        },
        confirmTransactionInitialTimeout: {
          type: 'number',
          title: 'Confirmation Timeout',
          description: 'Initial timeout for transaction confirmation in milliseconds (optional)',
        },
      },
    },
  })
  connection: {
    rpcUrl: string
    wsEndpoint?: string
    confirmTransactionInitialTimeout?: number
  } = { rpcUrl: '' }

  @PortString({
    title: 'Wallet Address',
    description: 'Solana wallet public address',
  })
  walletAddress: string = ''

  @PortString({
    title: 'Private Key',
    description: 'Private key for the Solana wallet (sensitive data)',
    ui: { isPassword: true },
  })
  privateKey: string = ''

  @PortNumber({
    title: 'Compute Units',
    description: 'Maximum compute units for Solana transactions (optional)',
    integer: true,
  })
  computeUnits?: number

  @PortNumber({
    title: 'Max Retries',
    description: 'Maximum number of retry attempts for failed requests (optional)',
    integer: true,
    min: 0,
  })
  maxRetries?: number
}

/**
 * SuiConfig provides configuration for the Sui blockchain
 */
@ObjectSchema({
  description: 'Configuration for Sui blockchain connections',
})
export class SuiConfig {
  @PortString({
    title: 'Private Key',
    description: 'Private key for the Sui wallet (sensitive data)',
    ui: { isPassword: true },
  })
  privateKey: string = ''

  @PortString({
    title: 'Wallet Address',
    description: 'Sui wallet public address',
  })
  walletAddress: string = ''

  @PortObject({
    title: 'Connection Settings',
    description: 'Network connection parameters for Sui (optional)',
    schema: {
      type: 'object',
      properties: {
        rpcUrl: {
          type: 'string',
          title: 'RPC URL',
          description: 'JSON-RPC endpoint URL for the Sui network',
        },
        wsEndpoint: {
          type: 'string',
          title: 'WebSocket Endpoint',
          description: 'WebSocket endpoint for real-time updates (optional)',
        },
      },
    },
  })
  connection?: {
    rpcUrl: string
    wsEndpoint?: string
  }
}

/**
 * EVMConfig provides configuration for Ethereum Virtual Machine compatible blockchains
 */
@ObjectSchema({
  description: 'Configuration for EVM-compatible blockchain connections',
})
export class EVMConfig {
  @PortString({
    title: 'Wallet Address',
    description: 'EVM wallet public address',
  })
  walletAddress: string = ''

  @PortString({
    title: 'Private Key',
    description: 'Private key for the EVM wallet (sensitive data)',
    ui: { isPassword: true },
  })
  privateKey: string = ''

  @PortNumber({
    title: 'Gas Multiplier',
    description: 'Multiplier applied to estimated gas (optional)',
    min: 1,
  })
  gasMultiplier?: number

  @PortObject({
    title: 'Connection Settings',
    description: 'Network connection parameters for EVM (optional)',
    schema: {
      type: 'object',
      properties: {
        rpcUrl: {
          type: 'string',
          title: 'RPC URL',
          description: 'JSON-RPC endpoint URL for the EVM network',
        },
        wsEndpoint: {
          type: 'string',
          title: 'WebSocket Endpoint',
          description: 'WebSocket endpoint for real-time updates (optional)',
        },
      },
    },
  })
  connection?: {
    rpcUrl: string
    wsEndpoint?: string
  }
}

/**
 * ChainConfig provides configuration for a specific blockchain network
 */
@ObjectSchema({
  description: 'Configuration for a specific blockchain network',
})
export class ChainConfig {
  @PortString({
    title: 'Chain ID',
    description: 'Unique identifier for the blockchain network',
  })
  id: string = ''

  @PortString({
    title: 'Block Explorer URL',
    description: 'Base URL for the blockchain explorer',
  })
  explorer: string = ''

  @PortString({
    title: 'Default Slippage',
    description: 'Default slippage percentage for swaps on this chain',
  })
  defaultSlippage: string = ''

  @PortString({
    title: 'Maximum Slippage',
    description: 'Maximum allowed slippage percentage for swaps on this chain',
  })
  maxSlippage: string = ''

  @PortNumber({
    title: 'Compute Units',
    description: 'Computation units for specific chains like Solana (optional)',
    integer: true,
  })
  computeUnits?: number

  @PortNumber({
    title: 'Confirmation Timeout',
    description: 'Transaction confirmation timeout in milliseconds (optional)',
    integer: true,
  })
  confirmationTimeout?: number

  @PortNumber({
    title: 'Max Retries',
    description: 'Maximum number of retry attempts for failed requests (optional)',
    integer: true,
    min: 0,
  })
  maxRetries?: number

  @PortString({
    title: 'DEX Contract Address',
    description: 'Smart contract address for the DEX on this chain (optional)',
  })
  dexContractAddress?: string
}

/**
 * OKXConfig provides the main configuration for the OKX DEX API
 */
@ObjectSchema({
  description: 'Main configuration for OKX DEX API integration',
})
export class OKXConfig {
  @PortSecret<'OkxDexApi'>({
    title: ' API Secrets',
    secretType: 'OkxDexApi',
    description: 'API credentials for accessing the OKX DEX API',
    ui: { isPassword: true },
  })
  secrets?: EncryptedSecretValue<'OkxDexApi'>

  @PortString({
    title: 'Project ID',
    description: 'OKX project identifier',
    required: true,
  })
  projectId: string = ''

  @PortString({
    title: 'Base URL',
    description: 'Base URL for API requests (optional)',
  })
  baseUrl?: string

  @PortObject({
    title: 'Network Configurations',
    description: 'Configuration settings for different blockchain networks (optional)',
    schema: {
      type: 'object',
      properties: {},
    },
    isSchemaMutable: true,
  })
  networks?: Record<string, ChainConfig>

  @PortObject({
    title: 'Solana Configuration',
    description: 'Configuration for Solana blockchain (optional)',
    schema: SolanaConfig,
  })
  solana?: SolanaConfig

  @PortObject({
    title: 'Sui Configuration',
    description: 'Configuration for Sui blockchain (optional)',
    schema: SuiConfig,
  })
  sui?: SuiConfig

  @PortObject({
    title: 'EVM Configuration',
    description: 'Configuration for EVM-compatible blockchains (optional)',
    schema: EVMConfig,
  })
  evm?: EVMConfig

  @PortNumber({
    title: 'Request Timeout',
    description: 'API request timeout in milliseconds (optional)',
    integer: true,
    min: 1000,
  })
  timeout?: number

  @PortNumber({
    title: 'Max Retries',
    description: 'Maximum number of retry attempts for failed requests (optional)',
    integer: true,
    min: 0,
  })
  maxRetries?: number
}

/**
 * APIRequestParams represents a map of key-value parameters for API requests
 */
@ObjectSchema({
  description: 'Key-value parameters for API requests',
  // isSchemaMutable: true,
})
export class APIRequestParams {
  [key: string]: string | undefined;
}

/**
 * SlippageOptions provides configuration for swap slippage tolerance
 */
@ObjectSchema({
  description: 'Options for configuring slippage tolerance in swaps',
})
export class SlippageOptions {
  @PortString({
    title: 'Slippage',
    description: 'Manual slippage percentage (optional)',
  })
  slippage?: string

  @PortBoolean({
    title: 'Auto Slippage',
    description: 'Whether to use automatic slippage calculation (optional)',
  })
  autoSlippage?: boolean

  @PortString({
    title: 'Max Auto Slippage',
    description: 'Maximum slippage percentage when using auto slippage (optional)',
  })
  maxAutoSlippage?: string
}

/**
 * SwapParams extends BaseParams with slippage configuration options
 */
@ObjectSchema({
  description: 'Parameters for executing a token swap',
})
export class SwapParams {
  @PortString({
    title: 'Chain ID',
    description: 'Blockchain network identifier',
    required: true,
  })
  chainId: string = ''

  @PortString({
    title: 'Source Token Address',
    description: 'Contract address of the token to swap from',
    required: true,
  })
  fromTokenAddress: string = ''

  @PortString({
    title: 'Destination Token Address',
    description: 'Contract address of the token to swap to',
    required: true,
  })
  toTokenAddress: string = ''

  @PortString({
    title: 'Amount',
    description: 'Amount of source tokens to swap (bigint string, e.g., "1000000000000000000" for 1 token for decimal 18)',
    required: true,
  })
  amount: string = ''

  @PortString({
    title: 'User Wallet Address',
    description: 'Wallet address for the user performing the swap (optional)',
  })
  userWalletAddress?: string

  @PortString({
    title: 'Slippage',
    description: 'Manual slippage percentage (optional)',
  })
  slippage?: string

  @PortBoolean({
    title: 'Auto Slippage',
    description: 'Whether to use automatic slippage calculation (optional)',
  })
  autoSlippage?: boolean

  @PortString({
    title: 'Max Auto Slippage',
    description: 'Maximum slippage percentage when using auto slippage (optional)',
  })
  maxAutoSlippage?: string
}

/**
 * QuoteParams extends BaseParams with required slippage parameter
 */
@ObjectSchema({
  description: 'Parameters for requesting a swap quote',
})
export class QuoteParams {
  @PortString({
    title: 'Chain ID',
    description: 'Blockchain network identifier',
    required: true,
  })
  chainId: string = ''

  @PortString({
    title: 'Source Token Address',
    description: 'Contract address of the token to swap from',
    required: true,
  })
  fromTokenAddress: string = ''

  @PortString({
    title: 'Destination Token Address',
    description: 'Contract address of the token to swap to',
    required: true,
  })
  toTokenAddress: string = ''

  @PortString({
    title: 'Amount',
    description: 'Amount of source tokens to swap (bigint string, e.g., "1000000000000000000" for 1 token for decimal 18)',
    required: true,
  })
  amount: string = ''

  @PortString({
    title: 'User Wallet Address',
    description: 'Wallet address for the user performing the swap (optional)',
  })
  userWalletAddress?: string

  @PortString({
    title: 'Slippage',
    description: 'Slippage percentage for the quote calculation',
    required: true,
  })
  slippage: string = ''
}

/**
 * SwapResult provides information about a completed swap transaction
 */
@ObjectSchema({
  description: 'Result of a completed swap transaction',
})
export class SwapResult {
  @PortBoolean({
    title: 'Success',
    description: 'Whether the swap was successful',
    required: true,
  })
  success: boolean = false

  @PortString({
    title: 'Transaction ID',
    description: 'Blockchain transaction identifier',
    required: true,
  })
  transactionId: string = ''

  @PortString({
    title: 'Explorer URL',
    description: 'URL to view the transaction in a blockchain explorer',
    required: true,
  })
  explorerUrl: string = ''

  @PortObject({
    title: 'Swap Details',
    description: 'Detailed information about the completed swap (optional)',
    schema: {
      type: 'object',
      properties: {
        fromToken: {
          type: 'object',
          schema: {
            properties: {
              symbol: { type: 'string', title: 'Token Symbol' },
              amount: { type: 'string', title: 'Amount Swapped' },
              decimal: { type: 'string', title: 'Decimal Precision' },
            },
          },
        },
        toToken: {
          type: 'object',
          schema: {
            properties: {
              symbol: { type: 'string', title: 'Token Symbol' },
              amount: { type: 'string', title: 'Amount Received' },
              decimal: { type: 'string', title: 'Decimal Precision' },
            },
          },
        },
        priceImpact: { type: 'string', title: 'Price Impact Percentage' },
      },
    },
  })
  details?: {
    fromToken: {
      symbol: string
      amount: string
      decimal: string
    }
    toToken: {
      symbol: string
      amount: string
      decimal: string
    }
    priceImpact: string
  }
}

/**
 * FormattedSwapResponse provides a user-friendly representation of a swap quote
 */
@ObjectSchema({
  description: 'User-friendly formatted swap response with summary',
})
export class FormattedSwapResponse {
  @PortBoolean({
    title: 'Success',
    description: 'Whether the swap quote was successfully generated',
  })
  success: boolean = false

  @PortObject({
    title: 'Quote Information',
    description: 'Detailed information about the swap quote',
    schema: {
      type: 'object',
      properties: {
        fromToken: {
          type: 'object',
          schema: {
            properties: {
              symbol: { type: 'string', title: 'Token Symbol' },
              amount: { type: 'string', title: 'Amount to Swap' },
              decimal: { type: 'string', title: 'Decimal Precision' },
              unitPrice: { type: 'string', title: 'Token Unit Price' },
            },
          },
        },
        toToken: {
          type: 'object',
          schema: {
            properties: {
              symbol: { type: 'string', title: 'Token Symbol' },
              amount: { type: 'string', title: 'Amount to Receive' },
              decimal: { type: 'string', title: 'Decimal Precision' },
              unitPrice: { type: 'string', title: 'Token Unit Price' },
            },
          },
        },
        priceImpact: { type: 'string', title: 'Price Impact Percentage' },
        dexRoutes: {
          type: 'array',
          itemConfig: {
            type: 'object',
            schema: {
              properties: {
                dex: { type: 'string', title: 'DEX Name' },
                amountOut: { type: 'string', title: 'Output Amount' },
                fee: { type: 'string', title: 'Trading Fee' },
              },
            },
          },
        },
      },
    },
  })
  quote: {
    fromToken: {
      symbol: string
      amount: string
      decimal: string
      unitPrice: string
    }
    toToken: {
      symbol: string
      amount: string
      decimal: string
      unitPrice: string
    }
    priceImpact: string
    dexRoutes: {
      dex: string
      amountOut: string
      fee: string
    }[]
  } = {
      fromToken: {
        symbol: '',
        amount: '',
        decimal: '',
        unitPrice: '',
      },
      toToken: {
        symbol: '',
        amount: '',
        decimal: '',
        unitPrice: '',
      },
      priceImpact: '',
      dexRoutes: [],
    }

  @PortString({
    title: 'Summary',
    description: 'Human-readable summary of the swap details',
  })
  summary: string = ''

  @PortObject({
    title: 'Transaction Data',
    description: 'Optional raw transaction data',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'string', title: 'Transaction Data' },
      },
    },
  })
  tx?: {
    data: string
  }
}

/**
 * ApproveTokenParams contains parameters for token approval transactions
 */
@ObjectSchema({
  description: 'Parameters for requesting a token approval transaction',
})
export class ApproveTokenParams {
  @PortString({
    title: 'Chain ID',
    description: 'Blockchain network identifier',
    required: true,
  })
  chainId: string = ''

  @PortString({
    title: 'Token Contract Address',
    description: 'Address of the token contract to approve',
    required: true,
  })
  tokenContractAddress: string = ''

  @PortString({
    title: 'Approve Amount',
    description: 'Amount of tokens to approve for spending',
    required: true,
  })
  approveAmount: string = ''
}

/**
 * ApproveTokenResult provides information about a completed token approval
 */
@ObjectSchema({
  description: 'Result of a token approval transaction',
})
export class ApproveTokenResult {
  @PortBoolean({
    title: 'Success',
    description: 'Whether the approval transaction was successful',
    required: true,
  })
  success: boolean = false

  @PortString({
    title: 'Transaction Hash',
    description: 'Blockchain transaction hash/identifier',
    required: true,
  })
  transactionHash: string = ''

  @PortString({
    title: 'Explorer URL',
    description: 'URL to view the transaction in a blockchain explorer',
    required: true,
  })
  explorerUrl: string = ''
}
