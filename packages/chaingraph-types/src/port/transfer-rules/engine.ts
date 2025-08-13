/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '../../node'
import type { IPort, ObjectPortConfig } from '../base'
import type { PortPredicate, TransferBehaviors, TransferContext, TransferEngineOptions, TransferResult, TransferRule } from './types'
import { ObjectPort } from '../../port/instances'
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

    if (!rule) {
      if (this.options.debug) {
        console.log(`[TransferEngine] No rule found for: ${sourceConfig.type} -> ${targetConfig.type}`)
      }
      return false
    }

    // If rule has canConnect behavior, use it
    if (rule.behaviors.canConnect) {
      const canConnect = rule.behaviors.canConnect(sourceConfig, targetConfig)
      if (this.options.debug) {
        console.log(`[TransferEngine] Rule ${rule.name} canConnect: ${canConnect}`)
      }
      return canConnect
    }

    // Default to true if rule exists but no canConnect behavior
    if (this.options.debug) {
      console.log(`[TransferEngine] Rule ${rule.name} found, no canConnect behavior, allowing`)
    }
    return true
  }

  /**
   * Execute when a new connection is created
   */
  async onConnect(
    sourcePort: IPort,
    targetPort: IPort,
    sourceNode: INode,
    targetNode: INode,
  ): Promise<TransferResult> {
    const sourceConfig = sourcePort.getConfig()
    const targetConfig = targetPort.getConfig()

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
      console.log(`[TransferEngine] onConnect with rule: ${rule.name}`)
    }

    // Execute onConnect behavior if defined
    if (rule.behaviors.onConnect) {
      try {
        const result = await rule.behaviors.onConnect(context)

        if (this.options.debug && result.success) {
          console.log(`[TransferEngine] onConnect successful: ${rule.name}`)
        }

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const message = `Rule '${rule.name}' onConnect failed: ${errorMessage}`

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

    // No onConnect behavior defined
    return { success: true, message: 'No onConnect behavior defined' }
  }

  /**
   * Execute when a connection is removed
   */
  async onDisconnect(
    sourcePort: IPort,
    targetPort: IPort,
    sourceNode: INode,
    targetNode: INode,
  ): Promise<TransferResult> {
    const sourceConfig = sourcePort.getConfig()
    const targetConfig = targetPort.getConfig()

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
      console.log(`[TransferEngine] onDisconnect with rule: ${rule.name}`)
    }

    // Execute onConnect behavior if defined
    if (rule.behaviors.onDisconnect) {
      try {
        const result = await rule.behaviors.onDisconnect(context)

        if (this.options.debug && result.success) {
          console.log(`[TransferEngine] onDisconnect successful: ${rule.name}`)
        }

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const message = `Rule '${rule.name}' onDisconnect failed: ${errorMessage}`

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

    // No onConnect behavior defined
    return { success: true, message: 'No onConnect behavior defined' }
  }

  /**
   * Execute when source port updates on existing connection
   */
  async onSourceUpdate(
    sourcePort: IPort,
    targetPort: IPort,
    sourceNode: INode,
    targetNode: INode,
  ): Promise<TransferResult> {
    const sourceConfig = sourcePort.getConfig()
    const targetConfig = targetPort.getConfig()

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

    // Check canSync if defined
    if (rule.behaviors.canSync) {
      if (!rule.behaviors.canSync(sourceConfig, targetConfig)) {
        if (this.options.debug) {
          console.log(`[TransferEngine] Rule ${rule.name} canSync returned false`)
        }
        return {
          success: false,
          message: 'Target cannot accept source changes',
        }
      }
    }

    if (this.options.debug) {
      console.log(`[TransferEngine] onSourceUpdate with rule: ${rule.name}`)
    }

    // Execute onSourceUpdate behavior if defined
    if (rule.behaviors.onSourceUpdate) {
      try {
        const result = await rule.behaviors.onSourceUpdate(context)

        if (this.options.debug && result.success) {
          console.log(`[TransferEngine] onSourceUpdate successful: ${rule.name}`)
        }

        if (result.schemaTransferred || result.valueTransferred || result.underlyingTypeSet) {
          // update all the parents ports for the target port
          let currentPort: IPort | undefined = targetPort
          while (currentPort) {
            const previousPort = currentPort
            currentPort = context.targetNode.getPort(currentPort.getConfig().parentId || '')

            if (currentPort) {
              // check if the current port is the object port
              if (currentPort instanceof ObjectPort) {
                const currentPortObjectConfig = currentPort.getConfig() as ObjectPortConfig
                const targetPortKey = previousPort.getConfig().key
                if (targetPortKey) {
                  const targetPortConfig = previousPort.getConfig()

                  // Update parent object port schema from the previous port
                  currentPort.setConfig({
                    ...currentPortObjectConfig,
                    schema: {
                      ...currentPortObjectConfig.schema,
                      properties: {
                        ...currentPortObjectConfig.schema.properties,
                        [targetPortKey]: targetPortConfig,
                      },
                    },
                  })
                }
              }

              context.targetNode.updatePort(currentPort, {
                sourceOfUpdate: `TransferEngine:onSourceUpdate`,
              })
              console.log(`[TransferEngine] update port ${currentPort.getConfig().id} in node ${context.targetNode.id}`)
            }
          }
        }

        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const message = `Rule '${rule.name}' onSourceUpdate failed: ${errorMessage}`

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

    // No onSourceUpdate behavior defined
    return { success: true, message: 'No onSourceUpdate behavior defined' }
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
   * Set behaviors for the rule
   */
  behaviors(behaviors: TransferBehaviors): this {
    this.rule.behaviors = behaviors
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
    if (!this.rule.behaviors) {
      throw new Error('Behaviors are required')
    }

    return this.rule as TransferRule
  }
}
