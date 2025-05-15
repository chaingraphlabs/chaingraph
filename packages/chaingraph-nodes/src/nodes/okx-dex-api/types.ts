/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import {
  Boolean,
  Number,
  ObjectSchema,
  PortArray,
  PortObject,
  String,
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
  @String({
    title: 'Decimal Precision',
    description: 'Number of decimal places used by the token',
  })
  decimal: string = ''

  @Boolean({
    title: 'Honeypot Status',
    description: 'Flag indicating if the token is identified as a scam/honeypot',
  })
  isHoneyPot: boolean = false

  @String({
    title: 'Tax Rate',
    description: 'Fee percentage charged when transferring this token',
  })
  taxRate: string = ''

  @String({
    title: 'Contract Address',
    description: 'Blockchain address where the token smart contract is deployed',
  })
  tokenContractAddress: string = ''

  @String({
    title: 'Token Symbol',
    description: 'Trading symbol for the token (e.g., ETH, BTC)',
  })
  tokenSymbol: string = ''

  @String({
    title: 'Token Unit Price',
    description: 'Current price of one token unit in quote currency',
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
export class TokenInfoList extends TokenInfo {}

/**
 * TokenListResponse contains basic information about a token
 * Used when listing multiple tokens without full details
 */
@ObjectSchema({
  description: 'Basic token information returned in token listing responses',
})
export class TokenListResponse {
  @String({
    title: 'Decimal Precision',
    description: 'Number of decimal places used by the token',
  })
  decimals: string = ''

  @String({
    title: 'Contract Address',
    description: 'Blockchain address where the token smart contract is deployed',
  })
  tokenContractAddress: string = ''

  @String({
    title: 'Token Logo URL',
    description: 'URL to the token\'s logo image (optional)',
  })
  tokenLogoUrl?: string

  @String({
    title: 'Token Name',
    description: 'Full name of the token (optional)',
  })
  tokenName?: string

  @String({
    title: 'Token Symbol',
    description: 'Trading symbol for the token (e.g., ETH, BTC)',
  })
  tokenSymbol: string = ''
}

/**
 * TokenListInfo is an alias for TokenListResponse
 */
@ObjectSchema({
  description: 'Token list information (alias for TokenListResponse)',
})
export class TokenListInfo extends TokenListResponse {}

/**
 * DexProtocol represents a decentralized exchange protocol
 * with its contribution percentage to a swap route
 */
@ObjectSchema({
  description: 'Information about a DEX protocol used in a swap route',
})
export class DexProtocol {
  @String({
    title: 'DEX Name',
    description: 'Name of the decentralized exchange (e.g., Uniswap, SushiSwap)',
  })
  dexName: string = ''

  @String({
    title: 'Usage Percentage',
    description: 'Percentage of the total swap that uses this DEX protocol',
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
  @String({
    title: 'Router Address',
    description: 'Smart contract address of the DEX router',
  })
  router: string = ''

  @String({
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
  @String({
    title: 'Output Amount',
    description: 'Amount of destination tokens received from this DEX',
  })
  amountOut: string = ''

  @String({
    title: 'DEX Logo URL',
    description: 'URL to the logo image of the DEX',
  })
  dexLogo: string = ''

  @String({
    title: 'DEX Name',
    description: 'Name of the decentralized exchange',
  })
  dexName: string = ''

  @String({
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
  @String({
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

  @String({
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

  @String({
    title: 'Source Amount',
    description: 'Amount of source tokens to swap',
  })
  fromTokenAmount: string = ''

  @String({
    title: 'Destination Amount',
    description: 'Amount of destination tokens expected to receive',
  })
  toTokenAmount: string = ''

  @String({
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

  @String({
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
  @String({
    title: 'Transaction Data',
    description: 'Hex-encoded calldata for the transaction',
  })
  data: string = ''

  @String({
    title: 'Sender Address',
    description: 'Blockchain address initiating the transaction',
  })
  from: string = ''

  @String({
    title: 'Gas Limit',
    description: 'Maximum gas units allowed for transaction execution',
  })
  gas: string = ''

  @String({
    title: 'Gas Price',
    description: 'Price per gas unit in wei',
  })
  gasPrice: string = ''

  @String({
    title: 'Priority Fee',
    description: 'Maximum priority fee per gas (for EIP-1559 transactions)',
  })
  maxPriorityFeePerGas: string = ''

  @String({
    title: 'Minimum Receive Amount',
    description: 'Minimum acceptable amount of tokens to receive',
  })
  minReceiveAmount: string = ''

  @PortArray({
    title: 'Signature Data',
    description: 'Digital signatures needed for transaction authorization',
    itemConfig: { type: 'string' },
  })
  signatureData: string[] = []

  @String({
    title: 'Slippage Tolerance',
    description: 'Maximum allowed price movement as a percentage',
  })
  slippage: string = ''

  @String({
    title: 'Recipient Address',
    description: 'Destination contract address for the transaction',
  })
  to: string = ''

  @String({
    title: 'Transaction Value',
    description: 'Amount of native currency (ETH, BNB, etc.) sent with transaction',
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
  @String({
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

  @String({
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

  @String({
    title: 'Source Amount',
    description: 'Amount of source tokens to swap',
  })
  fromTokenAmount: string = ''

  @String({
    title: 'Destination Amount',
    description: 'Amount of destination tokens expected to receive',
  })
  toTokenAmount: string = ''

  @String({
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

  @String({
    title: 'Trading Fee',
    description: 'Total trading fee for the swap',
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
  @String({
    title: 'Chain ID',
    description: 'Unique identifier for the blockchain network',
  })
  chainId: string = ''

  @String({
    title: 'Chain Name',
    description: 'Human-readable name of the blockchain network',
  })
  chainName: string = ''

  @String({
    title: 'DEX Token Approval Address',
    description: 'Address used for token approvals on this chain (null if not applicable)',
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

  @String({
    title: 'Response Code',
    description: 'API response status code (0 indicates success)',
  })
  code: string = ''

  @String({
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
  @String({
    title: 'Response Code',
    description: 'API response status code (0 indicates success)',
  })
  code: string = ''

  @String({
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

  @String({
    title: 'Wallet Address',
    description: 'Solana wallet public address',
  })
  walletAddress: string = ''

  @String({
    title: 'Private Key',
    description: 'Private key for the Solana wallet (sensitive data)',
    ui: { isPassword: true },
  })
  privateKey: string = ''

  @Number({
    title: 'Compute Units',
    description: 'Maximum compute units for Solana transactions (optional)',
    integer: true,
  })
  computeUnits?: number

  @Number({
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
  @String({
    title: 'Private Key',
    description: 'Private key for the Sui wallet (sensitive data)',
    ui: { isPassword: true },
  })
  privateKey: string = ''

  @String({
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
  @String({
    title: 'Wallet Address',
    description: 'EVM wallet public address',
  })
  walletAddress: string = ''

  @String({
    title: 'Private Key',
    description: 'Private key for the EVM wallet (sensitive data)',
    ui: { isPassword: true },
  })
  privateKey: string = ''

  @Number({
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
  @String({
    title: 'Chain ID',
    description: 'Unique identifier for the blockchain network',
  })
  id: string = ''

  @String({
    title: 'Block Explorer URL',
    description: 'Base URL for the blockchain explorer',
  })
  explorer: string = ''

  @String({
    title: 'Default Slippage',
    description: 'Default slippage percentage for swaps on this chain',
  })
  defaultSlippage: string = ''

  @String({
    title: 'Maximum Slippage',
    description: 'Maximum allowed slippage percentage for swaps on this chain',
  })
  maxSlippage: string = ''

  @Number({
    title: 'Compute Units',
    description: 'Computation units for specific chains like Solana (optional)',
    integer: true,
  })
  computeUnits?: number

  @Number({
    title: 'Confirmation Timeout',
    description: 'Transaction confirmation timeout in milliseconds (optional)',
    integer: true,
  })
  confirmationTimeout?: number

  @Number({
    title: 'Max Retries',
    description: 'Maximum number of retry attempts for failed requests (optional)',
    integer: true,
    min: 0,
  })
  maxRetries?: number

  @String({
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
  @String({
    title: 'API Key',
    description: 'Authentication key for the OKX API',
    ui: { isPassword: true },
  })
  apiKey: string = ''

  @String({
    title: 'Secret Key',
    description: 'Secret key for signing API requests',
    ui: { isPassword: true },
  })
  secretKey: string = ''

  @String({
    title: 'API Passphrase',
    description: 'Passphrase for additional authentication',
    ui: { isPassword: true },
  })
  apiPassphrase: string = ''

  @String({
    title: 'Project ID',
    description: 'OKX project identifier',
  })
  projectId: string = ''

  @String({
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

  @Number({
    title: 'Request Timeout',
    description: 'API request timeout in milliseconds (optional)',
    integer: true,
    min: 1000,
  })
  timeout?: number

  @Number({
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
  @String({
    title: 'Slippage',
    description: 'Manual slippage percentage (optional)',
  })
  slippage?: string

  @Boolean({
    title: 'Auto Slippage',
    description: 'Whether to use automatic slippage calculation (optional)',
  })
  autoSlippage?: boolean

  @String({
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
  @String({
    title: 'Chain ID',
    description: 'Blockchain network identifier',
  })
  chainId: string = ''

  @String({
    title: 'Source Token Address',
    description: 'Contract address of the token to swap from',
  })
  fromTokenAddress: string = ''

  @String({
    title: 'Destination Token Address',
    description: 'Contract address of the token to swap to',
  })
  toTokenAddress: string = ''

  @String({
    title: 'Amount',
    description: 'Amount of source tokens to swap',
  })
  amount: string = ''

  @String({
    title: 'User Wallet Address',
    description: 'Wallet address for the user performing the swap (optional)',
  })
  userWalletAddress?: string

  @String({
    title: 'Slippage',
    description: 'Manual slippage percentage (optional)',
  })
  slippage?: string

  @Boolean({
    title: 'Auto Slippage',
    description: 'Whether to use automatic slippage calculation (optional)',
  })
  autoSlippage?: boolean

  @String({
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
  @String({
    title: 'Chain ID',
    description: 'Blockchain network identifier',
  })
  chainId: string = ''

  @String({
    title: 'Source Token Address',
    description: 'Contract address of the token to swap from',
  })
  fromTokenAddress: string = ''

  @String({
    title: 'Destination Token Address',
    description: 'Contract address of the token to swap to',
  })
  toTokenAddress: string = ''

  @String({
    title: 'Amount',
    description: 'Amount of source tokens to swap',
  })
  amount: string = ''

  @String({
    title: 'User Wallet Address',
    description: 'Wallet address for the user performing the swap (optional)',
  })
  userWalletAddress?: string

  @String({
    title: 'Slippage',
    description: 'Slippage percentage for the quote calculation',
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
  @Boolean({
    title: 'Success',
    description: 'Whether the swap was successful',
  })
  success: boolean = false

  @String({
    title: 'Transaction ID',
    description: 'Blockchain transaction identifier',
  })
  transactionId: string = ''

  @String({
    title: 'Explorer URL',
    description: 'URL to view the transaction in a blockchain explorer',
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
  @Boolean({
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

  @String({
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
  @String({
    title: 'Chain ID',
    description: 'Blockchain network identifier',
  })
  chainId: string = ''

  @String({
    title: 'Token Contract Address',
    description: 'Address of the token contract to approve',
  })
  tokenContractAddress: string = ''

  @String({
    title: 'Approve Amount',
    description: 'Amount of tokens to approve for spending',
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
  @Boolean({
    title: 'Success',
    description: 'Whether the approval transaction was successful',
  })
  success: boolean = false

  @String({
    title: 'Transaction Hash',
    description: 'Blockchain transaction hash/identifier',
  })
  transactionHash: string = ''

  @String({
    title: 'Explorer URL',
    description: 'URL to view the transaction in a blockchain explorer',
  })
  explorerUrl: string = ''
}
