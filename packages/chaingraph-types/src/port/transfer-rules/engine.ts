/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '../../node'
import type { IPort, IPortConfig } from '../base'
import type { PortPredicate, TransferContext, TransferEngineOptions, TransferResult, TransferRule, TransferStrategy } from './types'
import { resolvePortConfig } from './utils/port-resolver'

/**
 * Transfer rule engine for managing port connections
 */
export class TransferEngine {
  private rules: TransferRule[] = []
  private readonly options: Required<TransferEngineOptions>

  constructor(rules: TransferRule[] = [], options: TransferEngineOptions = {}) {
    this.rules = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0))
    this.options = {
      debug: options.debug || false,
      throwOnError: options.throwOnError || false,
      maxRuleChecks: options.maxRuleChecks || 100,
    }
  }

  /**
   * Check if two ports can connect based on transfer rules
   */
  canConnect(sourcePort: IPort, targetPort: IPort): boolean {
    const sourceConfig = resolvePortConfig(sourcePort)
    const targetConfig = resolvePortConfig(targetPort)

    // Find matching rule
    const rule = this.findMatchingRule(sourceConfig, targetConfig)

    if (this.options.debug) {
      console.log(`[TransferEngine] Checking connection: ${sourceConfig.type} -> ${targetConfig.type}, try rule: ${rule ? rule.name : 'none'} [${rule?.description}]`)
    }

    return rule !== undefined
  }

  /**
   * Execute transfer between two ports
   */
  async transfer(
    sourcePort: IPort,
    targetPort: IPort,
    sourceNode: INode,
    targetNode: INode,
  ): Promise<TransferResult> {
    const sourceConfig = resolvePortConfig(sourcePort)
    const targetConfig = resolvePortConfig(targetPort)

    const context: TransferContext = {
      sourcePort,
      targetPort,
      sourceConfig,
      targetConfig,
      sourceNode,
      targetNode,
    }

    // Find matching rule
    const rule = this.findMatchingRule(sourceConfig, targetConfig)

    if (!rule) {
      const message = `No transfer rule found for ${sourceConfig.type} -> ${targetConfig.type}`
      if (this.options.debug) {
        console.log(`[TransferEngine] ${message}`)
      }
      return {
        success: false,
        message,
      }
    }

    if (this.options.debug) {
      console.log(`[TransferEngine] Applying rule: ${rule.name}`)
    }

    try {
      const result = await rule.transfer(context)

      if (this.options.debug && result.success) {
        console.log(`[TransferEngine] Transfer successful: ${rule.name}`)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const message = `Transfer rule '${rule.name}' failed: ${errorMessage}`

      if (this.options.debug) {
        console.error(`[TransferEngine] ${message}`)
      }

      if (this.options.throwOnError) {
        throw error
      }

      return {
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage),
        message,
      }
    }
  }

  /**
   * Add a new rule to the engine
   */
  addRule(rule: TransferRule): void {
    this.rules.push(rule)
    this.sortRules()
  }

  /**
   * Add multiple rules to the engine
   */
  addRules(rules: TransferRule[]): void {
    this.rules.push(...rules)
    this.sortRules()
  }

  /**
   * Remove a rule by name
   */
  removeRule(name: string): boolean {
    const initialLength = this.rules.length
    this.rules = this.rules.filter(rule => rule.name !== name)
    return this.rules.length < initialLength
  }

  /**
   * Get all rules
   */
  getRules(): TransferRule[] {
    return [...this.rules]
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.rules = []
  }

  /**
   * Find the first matching rule for given port configurations
   */
  private findMatchingRule(sourceConfig: ReturnType<typeof resolvePortConfig>, targetConfig: ReturnType<typeof resolvePortConfig>): TransferRule | undefined {
    let checksPerformed = 0

    for (const rule of this.rules) {
      if (checksPerformed >= this.options.maxRuleChecks) {
        if (this.options.debug) {
          console.warn(`[TransferEngine] Max rule checks (${this.options.maxRuleChecks}) reached`)
        }
        break
      }

      checksPerformed++

      // Check source and target predicates
      if (rule.source(sourceConfig) && rule.target(targetConfig)) {
        // If rule has validation, check it too
        if (rule.validate) {
          if (!rule.validate(sourceConfig, targetConfig)) {
            if (this.options.debug) {
              console.log(`[TransferEngine] Rule ${rule.name} matched predicates but failed validation`)
            }
            continue
          }
        }
        return rule
      }
    }

    return undefined
  }

  /**
   * Sort rules by priority
   */
  private sortRules(): void {
    this.rules.sort((a, b) => (b.priority || 0) - (a.priority || 0))
  }

  /**
   * Create a rule builder for fluent API
   */
  static rule(name: string): RuleBuilder {
    return new RuleBuilder(name)
  }
}

/**
 * Builder for creating transfer rules with fluent API
 */
export class RuleBuilder {
  private rule: Partial<TransferRule>

  constructor(name: string) {
    this.rule = { name }
  }

  /**
   * Set source predicate
   */
  from(predicate: PortPredicate): this {
    this.rule.source = predicate
    return this
  }

  /**
   * Set target predicate
   */
  to(predicate: PortPredicate): this {
    this.rule.target = predicate
    return this
  }

  /**
   * Set validation function for checking both ports together
   */
  validate(validator: (sourceConfig: IPortConfig, targetConfig: IPortConfig) => boolean): this {
    this.rule.validate = validator
    return this
  }

  /**
   * Set transfer strategy
   */
  transfer(strategy: TransferStrategy): this {
    this.rule.transfer = strategy
    return this
  }

  /**
   * Set priority
   */
  withPriority(priority: number): this {
    this.rule.priority = priority
    return this
  }

  /**
   * Set description
   */
  withDescription(description: string): this {
    this.rule.description = description
    return this
  }

  /**
   * Build the rule
   */
  build(): TransferRule {
    if (!this.rule.name) {
      throw new Error('Rule name is required')
    }
    if (!this.rule.source) {
      throw new Error('Source predicate is required')
    }
    if (!this.rule.target) {
      throw new Error('Target predicate is required')
    }
    if (!this.rule.transfer) {
      throw new Error('Transfer strategy is required')
    }

    return this.rule as TransferRule
  }
}
