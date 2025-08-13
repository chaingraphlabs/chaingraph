/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '../../node'
import type { IPort, IPortConfig } from '../base'

/**
 * Predicate function for matching port configurations
 */
export type PortPredicate = (port: IPortConfig) => boolean

/**
 * Context provided to transfer strategies
 */
export interface TransferContext {
  sourcePort: IPort
  targetPort: IPort
  sourceConfig: IPortConfig
  targetConfig: IPortConfig
  sourceNode: INode
  targetNode: INode
}

/**
 * Result of a transfer operation
 */
export interface TransferResult {
  success: boolean
  schemaTransferred?: boolean
  valueTransferred?: boolean
  underlyingTypeSet?: boolean
  message?: string
  error?: Error
}

/**
 * Transfer strategy function
 */
export type TransferStrategy = (context: TransferContext) => TransferResult | Promise<TransferResult>

/**
 * Behaviors that define how a rule handles different scenarios
 */
export interface TransferBehaviors {
  /** Check if ports can be connected (before edge creation) */
  canConnect?: (sourceConfig: IPortConfig, targetConfig: IPortConfig) => boolean

  /** Execute when edge is created */
  onConnect?: (context: TransferContext) => TransferResult | Promise<TransferResult>

  /** Execute when edge is removed */
  onDisconnect?: (context: TransferContext) => TransferResult | Promise<TransferResult>

  /** Execute when source port updates on existing edge */
  onSourceUpdate?: (context: TransferContext) => TransferResult | Promise<TransferResult>

  /** Optional: validate before sync (for updates) */
  canSync?: (sourceConfig: IPortConfig, targetConfig: IPortConfig) => boolean
}

/**
 * A transfer rule defining all behaviors for a port type pair
 */
export interface TransferRule {
  /** Unique rule identifier */
  name: string

  /** Predicate to match source port */
  source: PortPredicate

  /** Predicate to match target port */
  target: PortPredicate

  /** Behaviors for different scenarios */
  behaviors: TransferBehaviors

  /** Rule priority (higher = checked first) */
  priority?: number

  /** Optional description for debugging */
  description?: string
}

/**
 * Options for the transfer engine
 */
export interface TransferEngineOptions {
  /** Enable debug logging */
  debug?: boolean

  /** Throw on transfer errors instead of returning them */
  throwOnError?: boolean

  /** Maximum number of rules to check before giving up */
  maxRuleChecks?: number
}
