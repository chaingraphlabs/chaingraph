/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort, IPortConfig, PortType } from '../base'
import type { ICompatibilityRule, IRecursiveCompatibilityChecker } from './compatibility-rules'
import { getCompatibilityRules } from './compatibility-rules'

/**
 * Interface for checking port compatibility
 */
export interface IPortCompatibilityChecker {
  /**
   * Check if a source port can connect to a target port
   */
  canConnect: (sourcePort: IPort, targetPort: IPort) => boolean

  /**
   * Get a descriptive error message if ports are not compatible
   */
  getCompatibilityError: (sourcePort: IPort, targetPort: IPort) => string | null
}

/**
 * Port compatibility checker implementation
 */
export class PortCompatibilityChecker implements IPortCompatibilityChecker, IRecursiveCompatibilityChecker {
  private rules: ICompatibilityRule[]
  private readonly MAX_DEPTH = 100 // Maximum recursion depth to prevent stack overflow

  constructor(rules?: ICompatibilityRule[]) {
    this.rules = rules || getCompatibilityRules()
  }

  /**
   * Check if a source port can connect to a target port
   */
  canConnect(sourcePort: IPort, targetPort: IPort): boolean {
    const sourceConfig = sourcePort.getConfig()
    const targetConfig = targetPort.getConfig()

    console.debug(
      `Checking compatibility: ${sourceConfig.type} -> ${targetConfig.type}`,
    )

    // Find applicable rule
    const rule = this.findRule(sourceConfig.type, targetConfig.type)
    if (!rule) {
      console.debug(
        `No specific compatibility rule found for ${sourceConfig.type} -> ${targetConfig.type}`,
      )

      // No specific rule found, check for basic type compatibility
      return sourceConfig.type === targetConfig.type
    }

    console.debug(
      `Found compatibility rule for ${sourceConfig.type} -> ${targetConfig.type}`,
    )

    return rule.checkCompatibility(sourceConfig, targetConfig, this)
  }

  /**
   * Get a descriptive error message if ports are not compatible
   */
  getCompatibilityError(sourcePort: IPort, targetPort: IPort): string | null {
    if (this.canConnect(sourcePort, targetPort)) {
      return null
    }

    const sourceConfig = sourcePort.getConfig()
    const targetConfig = targetPort.getConfig()

    // Find applicable rule
    const rule = this.findRule(sourceConfig.type, targetConfig.type)
    if (rule && rule.getErrorMessage) {
      return rule.getErrorMessage(sourceConfig, targetConfig)
    }

    // Default error message
    return `Incompatible port types: ${sourceConfig.type} -> ${targetConfig.type}`
  }

  /**
   * Check if two port configurations are compatible with depth tracking
   * This is the core recursive method that prevents infinite recursion
   */
  checkConfigs(sourceConfig: IPortConfig, targetConfig: IPortConfig, depth: number): boolean {
    // Check recursion depth limit
    if (depth > this.MAX_DEPTH) {
      console.warn(`Maximum recursion depth (${this.MAX_DEPTH}) reached in port compatibility check`)
      return false
    }

    // Find applicable rule
    const rule = this.findRule(sourceConfig.type, targetConfig.type)
    if (!rule) {
      // No specific rule found, check for basic type compatibility
      return sourceConfig.type === targetConfig.type
    }

    return rule.checkCompatibility(sourceConfig, targetConfig, this)
  }

  /**
   * Find the applicable compatibility rule for given port types
   */
  private findRule(sourceType: PortType, targetType: PortType): ICompatibilityRule | undefined {
    return this.rules.find(
      rule => rule.sourceType === sourceType && rule.targetType === targetType,
    )
  }

  /**
   * Add a custom compatibility rule
   */
  addRule(rule: ICompatibilityRule): void {
    this.rules.push(rule)
  }

  /**
   * Remove all rules for a specific type combination
   */
  removeRulesForTypes(sourceType: PortType, targetType: PortType): void {
    this.rules = this.rules.filter(
      rule => !(rule.sourceType === sourceType && rule.targetType === targetType),
    )
  }
}

/**
 * Singleton instance of the port compatibility checker
 */
let defaultChecker: PortCompatibilityChecker | null = null

/**
 * Get the default port compatibility checker instance
 */
export function getDefaultPortCompatibilityChecker(): PortCompatibilityChecker {
  if (!defaultChecker) {
    defaultChecker = new PortCompatibilityChecker()
  }
  return defaultChecker
}

/**
 * Check if two port configurations are compatible
 * This is a utility function that doesn't require port instances
 */
export function arePortConfigsCompatible(
  sourceConfig: IPortConfig,
  targetConfig: IPortConfig,
  checker: IRecursiveCompatibilityChecker = getDefaultPortCompatibilityChecker(),
): boolean {
  // Create temporary checker to reuse rule logic
  // const checker = new PortCompatibilityChecker()
  const rules = getCompatibilityRules()

  // Find applicable rule
  const rule = rules.find(
    r => r.sourceType === sourceConfig.type && r.targetType === targetConfig.type,
  )

  if (!rule) {
    // No specific rule found, check for basic type compatibility
    return sourceConfig.type === targetConfig.type
  }

  return rule.checkCompatibility(sourceConfig, targetConfig, checker)
}
