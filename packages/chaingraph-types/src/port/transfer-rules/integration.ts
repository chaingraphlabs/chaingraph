/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '../../node'
import type { IPort } from '../base'
import type { IPortCompatibilityChecker } from '../compatibility/port-compatibility-checker'
import type { TransferResult } from './types'
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
      debug: true,
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
 * Transfer data and configuration between ports
 * This is a convenience function that uses the default engine
 */
export async function transfer(
  sourcePort: IPort,
  targetPort: IPort,
  sourceNode: INode,
  targetNode: INode,
): Promise<TransferResult> {
  return getDefaultTransferEngine().transfer(sourcePort, targetPort, sourceNode, targetNode)
}

/**
 * @deprecated This adapter is for backward compatibility only.
 * Use getDefaultTransferEngine() directly instead.
 * 
 * Backward compatibility adapter that implements the old IPortCompatibilityChecker interface
 * This allows gradual migration from the old system to the new Transfer Rules System
 */
export class TransferRulesCompatibilityAdapter implements IPortCompatibilityChecker {
  private engine: TransferEngine

  constructor(engine?: TransferEngine) {
    this.engine = engine || getDefaultTransferEngine()
  }

  /**
   * Check if a source port can connect to a target port
   * Delegates to the Transfer Engine's canConnect method
   */
  canConnect(sourcePort: IPort, targetPort: IPort): boolean {
    return this.engine.canConnect(sourcePort, targetPort)
  }

  /**
   * Get a descriptive error message if ports are not compatible
   * Returns a generic message since Transfer Rules don't provide specific error messages for compatibility
   */
  getCompatibilityError(sourcePort: IPort, targetPort: IPort): string | null {
    if (this.canConnect(sourcePort, targetPort)) {
      return null
    }

    const sourceConfig = sourcePort.getConfig()
    const targetConfig = targetPort.getConfig()

    // Try to provide a meaningful error message based on port types
    if (sourceConfig.type !== targetConfig.type) {
      // Check if there's a special case that should work
      if (sourceConfig.type === 'any' || targetConfig.type === 'any') {
        return `Cannot connect ${sourceConfig.type} to ${targetConfig.type}: No transfer rule found`
      }
      if (sourceConfig.type === 'object' && targetConfig.type === 'object') {
        return `Cannot connect object ports: Schema transfer not allowed or incompatible`
      }
      if (sourceConfig.type === 'array' && targetConfig.type === 'array') {
        return `Cannot connect array ports: Item configuration incompatible`
      }
      return `Incompatible port types: ${sourceConfig.type} -> ${targetConfig.type}`
    }

    return `Cannot connect ports: No matching transfer rule found`
  }
}

/**
 * @deprecated Use getDefaultTransferEngine() and call canConnect() directly.
 * This function is for backward compatibility only.
 * 
 * Get a compatibility checker that uses the Transfer Rules System
 * This provides a drop-in replacement for getDefaultPortCompatibilityChecker()
 */
export function getTransferRulesCompatibilityChecker(): IPortCompatibilityChecker {
  return new TransferRulesCompatibilityAdapter()
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
