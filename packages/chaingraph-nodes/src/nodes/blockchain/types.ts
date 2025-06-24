/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Transaction request that will be sent to frontend for signing
 */
export interface TransactionRequest {
  to: string
  from?: string
  value?: string // in wei
  data?: string
  gasLimit?: string
  gasPrice?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  nonce?: number
  chainId?: number
}

/**
 * Result of a transaction execution
 */
export interface TransactionResult {
  hash: string
  status: 'pending' | 'success' | 'failed'
  receipt?: any
  error?: string
}

/**
 * Types of blockchain operations that require frontend interaction
 */
export enum BlockchainOperationType {
  SIGN_TRANSACTION = 'signTransaction',
  SIGN_MESSAGE = 'signMessage',
  SWITCH_CHAIN = 'switchChain',
  ADD_CHAIN = 'addChain',
  REQUEST_ACCOUNTS = 'requestAccounts',
}

/**
 * Request for blockchain operation that needs frontend handling
 */
export interface BlockchainOperationRequest {
  type: BlockchainOperationType
  data: any
  nodeId: string
  executionId: string
}
