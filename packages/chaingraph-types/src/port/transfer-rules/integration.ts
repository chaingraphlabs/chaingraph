/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort } from '../base'
import { TransferEngine } from './engine'
import { defaultTransferRules } from './rules/default-rules'

/**
 * Singleton instance of the Transfer Engine with default rules
 */
let defaultEngine: TransferEngine | null = null

/**
 * Get the default Transfer Engine instance
 * This is the main entry point for the Transfer Rules System
 */
export function getDefaultTransferEngine(): TransferEngine {
  if (!defaultEngine) {
    defaultEngine = new TransferEngine(defaultTransferRules, {
      // debug: process.env.NODE_ENV === 'development',
      debug: false,
    })
  }
  return defaultEngine
}

/**
 * Check if two ports can be connected
 * This is a convenience function that uses the default engine
 */
export function canConnect(sourcePort: IPort, targetPort: IPort): boolean {
  return getDefaultTransferEngine().canConnect(sourcePort, targetPort)
}

/**
 * Reset the default engine (useful for testing)
 */
export function resetDefaultEngine(): void {
  defaultEngine = null
}

export * from './engine'
export * from './predicates'
export * from './rules/default-rules'
export * from './strategies'
/**
 * Export everything from the main modules for convenience
 */
export * from './types'
