/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '../../../node'
import type { IPort, IPortConfig } from '../../base'
import type { TransferRule } from '../types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RuleBuilder, TransferEngine } from '../engine'
import { Predicates } from '../predicates'
import { Strategies } from '../strategies'

// Mock implementations
function createMockPort(config: IPortConfig, value?: unknown): IPort {
  return {
    id: config.id || 'mock-port',
    getConfig: () => config,
    getValue: () => value,
    setValue: vi.fn(),
    setConfig: vi.fn(),
    validate: vi.fn().mockResolvedValue(true),
    clone: vi.fn(),
    key: config.key || '',
    reset: vi.fn(),
    serialize: vi.fn(),
    deserialize: vi.fn(),
    cloneWithNewId: vi.fn(),
    isSystem: vi.fn(),
    isSystemError: vi.fn(),
    addConnection: vi.fn(),
    removeConnection: vi.fn(),
  }
}

function createMockNode(): INode {
  return {
    id: 'mock-node',
    type: 'mock',
    metadata: {},
    inputs: new Map(),
    outputs: new Map(),
    getPort: vi.fn(),
    updatePort: vi.fn(),
    copyObjectSchemaTo: vi.fn(),
    updateArrayItemConfig: vi.fn(),
    refreshAnyPortUnderlyingPorts: vi.fn(),
    execute: vi.fn(),
    validate: vi.fn(),
    dispose: vi.fn(),
    clone: vi.fn(),
  } as unknown as INode
}

describe('transferEngine', () => {
  let engine: TransferEngine
  let sourcePort: IPort
  let targetPort: IPort
  let sourceNode: INode
  let targetNode: INode

  beforeEach(() => {
    engine = new TransferEngine()
    sourcePort = createMockPort({
      id: 'source',
      type: 'string',
      direction: 'output',
    })
    targetPort = createMockPort({
      id: 'target',
      type: 'string',
      direction: 'input',
    })
    sourceNode = createMockNode()
    targetNode = createMockNode()
  })

  describe('canConnect', () => {
    it('should return true when a matching rule exists', () => {
      const rule: TransferRule = {
        name: 'test-rule',
        source: Predicates.isString,
        target: Predicates.isString,
        transfer: Strategies.value,
      }

      engine.addRule(rule)

      expect(engine.canConnect(sourcePort, targetPort)).toBe(true)
    })

    it('should return false when no matching rule exists', () => {
      const rule: TransferRule = {
        name: 'test-rule',
        source: Predicates.isNumber,
        target: Predicates.isNumber,
        transfer: Strategies.value,
      }

      engine.addRule(rule)

      expect(engine.canConnect(sourcePort, targetPort)).toBe(false)
    })

    it('should match rules based on predicates', () => {
      const rule: TransferRule = {
        name: 'complex-rule',
        source: Predicates.and(
          Predicates.isString,
          port => port.id === 'source',
        ),
        target: Predicates.isString,
        transfer: Strategies.value,
      }

      engine.addRule(rule)

      expect(engine.canConnect(sourcePort, targetPort)).toBe(true)

      const differentSource = createMockPort({
        id: 'different',
        type: 'string',
        direction: 'output',
      })

      expect(engine.canConnect(differentSource, targetPort)).toBe(false)
    })
  })

  describe('transfer', () => {
    it('should execute matching transfer rule', async () => {
      const mockTransfer = vi.fn().mockReturnValue({
        success: true,
        valueTransferred: true,
      })

      const rule: TransferRule = {
        name: 'test-rule',
        source: Predicates.isString,
        target: Predicates.isString,
        transfer: mockTransfer,
      }

      engine.addRule(rule)

      const result = await engine.transfer(sourcePort, targetPort, sourceNode, targetNode)

      expect(result.success).toBe(true)
      expect(result.valueTransferred).toBe(true)
      expect(mockTransfer).toHaveBeenCalledWith(
        expect.objectContaining({
          sourcePort,
          targetPort,
          sourceNode,
          targetNode,
        }),
      )
    })

    it('should return failure when no matching rule', async () => {
      const result = await engine.transfer(sourcePort, targetPort, sourceNode, targetNode)

      expect(result.success).toBe(false)
      expect(result.message).toContain('No transfer rule found')
    })

    it('should handle transfer errors gracefully', async () => {
      const error = new Error('Transfer failed')
      const mockTransfer = vi.fn().mockRejectedValue(error)

      const rule: TransferRule = {
        name: 'failing-rule',
        source: Predicates.isString,
        target: Predicates.isString,
        transfer: mockTransfer,
      }

      engine.addRule(rule)

      const result = await engine.transfer(sourcePort, targetPort, sourceNode, targetNode)

      expect(result.success).toBe(false)
      expect(result.error).toBe(error)
      expect(result.message).toContain('Transfer rule \'failing-rule\' failed')
    })

    it('should throw error when throwOnError option is set', async () => {
      const error = new Error('Transfer failed')
      const mockTransfer = vi.fn().mockRejectedValue(error)

      const rule: TransferRule = {
        name: 'failing-rule',
        source: Predicates.isString,
        target: Predicates.isString,
        transfer: mockTransfer,
      }

      engine = new TransferEngine([rule], { throwOnError: true })

      await expect(
        engine.transfer(sourcePort, targetPort, sourceNode, targetNode),
      ).rejects.toThrow(error)
    })

    it('should respect rule priority', async () => {
      const highPriorityTransfer = vi.fn().mockReturnValue({
        success: true,
        message: 'high priority',
      })
      const lowPriorityTransfer = vi.fn().mockReturnValue({
        success: true,
        message: 'low priority',
      })

      const highPriorityRule: TransferRule = {
        name: 'high-priority',
        source: Predicates.isString,
        target: Predicates.isString,
        transfer: highPriorityTransfer,
        priority: 100,
      }

      const lowPriorityRule: TransferRule = {
        name: 'low-priority',
        source: Predicates.isString,
        target: Predicates.isString,
        transfer: lowPriorityTransfer,
        priority: 10,
      }

      engine.addRule(lowPriorityRule)
      engine.addRule(highPriorityRule)

      const result = await engine.transfer(sourcePort, targetPort, sourceNode, targetNode)

      expect(result.message).toBe('high priority')
      expect(highPriorityTransfer).toHaveBeenCalled()
      expect(lowPriorityTransfer).not.toHaveBeenCalled()
    })

    it('should stop checking rules at maxRuleChecks', async () => {
      const rules: TransferRule[] = []
      for (let i = 0; i < 10; i++) {
        rules.push({
          name: `rule-${i}`,
          source: () => false, // Never matches
          target: () => false,
          transfer: Strategies.value,
        })
      }

      const matchingRule: TransferRule = {
        name: 'matching-rule',
        source: Predicates.isString,
        target: Predicates.isString,
        transfer: Strategies.value,
        priority: -1, // Lowest priority, checked last
      }

      rules.push(matchingRule)

      engine = new TransferEngine(rules, { maxRuleChecks: 5 })

      const result = await engine.transfer(sourcePort, targetPort, sourceNode, targetNode)

      expect(result.success).toBe(false)
      expect(result.message).toContain('No transfer rule found')
    })
  })

  describe('rule management', () => {
    it('should add single rule', () => {
      const rule: TransferRule = {
        name: 'test-rule',
        source: Predicates.isString,
        target: Predicates.isString,
        transfer: Strategies.value,
      }

      engine.addRule(rule)

      expect(engine.getRules()).toContain(rule)
    })

    it('should add multiple rules', () => {
      const rules: TransferRule[] = [
        {
          name: 'rule-1',
          source: Predicates.isString,
          target: Predicates.isString,
          transfer: Strategies.value,
        },
        {
          name: 'rule-2',
          source: Predicates.isNumber,
          target: Predicates.isNumber,
          transfer: Strategies.value,
        },
      ]

      engine.addRules(rules)

      const engineRules = engine.getRules()
      expect(engineRules).toContain(rules[0])
      expect(engineRules).toContain(rules[1])
    })

    it('should remove rule by name', () => {
      const rule: TransferRule = {
        name: 'test-rule',
        source: Predicates.isString,
        target: Predicates.isString,
        transfer: Strategies.value,
      }

      engine.addRule(rule)
      expect(engine.getRules()).toContain(rule)

      const removed = engine.removeRule('test-rule')
      expect(removed).toBe(true)
      expect(engine.getRules()).not.toContain(rule)
    })

    it('should return false when removing non-existent rule', () => {
      const removed = engine.removeRule('non-existent')
      expect(removed).toBe(false)
    })

    it('should clear all rules', () => {
      engine.addRules([
        {
          name: 'rule-1',
          source: Predicates.isString,
          target: Predicates.isString,
          transfer: Strategies.value,
        },
        {
          name: 'rule-2',
          source: Predicates.isNumber,
          target: Predicates.isNumber,
          transfer: Strategies.value,
        },
      ])

      expect(engine.getRules()).toHaveLength(2)

      engine.clearRules()

      expect(engine.getRules()).toHaveLength(0)
    })

    it('should maintain rule order by priority', () => {
      const lowPriority: TransferRule = {
        name: 'low',
        source: Predicates.always,
        target: Predicates.always,
        transfer: Strategies.value,
        priority: 10,
      }

      const highPriority: TransferRule = {
        name: 'high',
        source: Predicates.always,
        target: Predicates.always,
        transfer: Strategies.value,
        priority: 100,
      }

      const noPriority: TransferRule = {
        name: 'none',
        source: Predicates.always,
        target: Predicates.always,
        transfer: Strategies.value,
      }

      engine.addRule(lowPriority)
      engine.addRule(noPriority)
      engine.addRule(highPriority)

      const rules = engine.getRules()
      expect(rules[0].name).toBe('high')
      expect(rules[1].name).toBe('low')
      expect(rules[2].name).toBe('none')
    })
  })

  describe('debug mode', () => {
    it('should log debug messages when enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      engine = new TransferEngine([], { debug: true })

      const rule: TransferRule = {
        name: 'test-rule',
        source: Predicates.isString,
        target: Predicates.isString,
        transfer: Strategies.value,
      }

      engine.addRule(rule)

      await engine.transfer(sourcePort, targetPort, sourceNode, targetNode)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TransferEngine] Applying rule: test-rule'),
      )

      consoleSpy.mockRestore()
    })

    it('should log when no matching rule found', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      engine = new TransferEngine([], { debug: true })

      await engine.transfer(sourcePort, targetPort, sourceNode, targetNode)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TransferEngine] No transfer rule found'),
      )

      consoleSpy.mockRestore()
    })

    it('should log transfer errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      engine = new TransferEngine([], { debug: true })

      const rule: TransferRule = {
        name: 'failing-rule',
        source: Predicates.isString,
        target: Predicates.isString,
        transfer: () => {
          throw new Error('Test error')
        },
      }

      engine.addRule(rule)

      await engine.transfer(sourcePort, targetPort, sourceNode, targetNode)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TransferEngine] Transfer rule \'failing-rule\' failed: Test error'),
        // expect.stringContaining('[TransferEngine]'),
        // expect.stringContaining('Test error'),
      )

      consoleSpy.mockRestore()
    })
  })
})

describe('ruleBuilder', () => {
  it('should build a complete rule', () => {
    const rule = new RuleBuilder('test-rule')
      .from(Predicates.isString)
      .to(Predicates.isNumber)
      .transfer(Strategies.value)
      .withPriority(50)
      .withDescription('Test description')
      .build()

    expect(rule.name).toBe('test-rule')
    expect(rule.source).toBe(Predicates.isString)
    expect(rule.target).toBe(Predicates.isNumber)
    expect(rule.transfer).toBe(Strategies.value)
    expect(rule.priority).toBe(50)
    expect(rule.description).toBe('Test description')
  })

  it('should build rule with fluent API', () => {
    const rule = TransferEngine
      .rule('fluent-rule')
      .from(Predicates.isObject)
      .to(Predicates.isMutableObject)
      .transfer(Strategies.objectSchema)
      .withPriority(100)
      .build()

    expect(rule.name).toBe('fluent-rule')
    expect(rule.priority).toBe(100)
  })

  it('should throw error if required fields are missing', () => {
    const builder = new RuleBuilder('incomplete')

    expect(() => builder.build()).toThrow('Source predicate is required')

    builder.from(Predicates.isString)
    expect(() => builder.build()).toThrow('Target predicate is required')

    builder.to(Predicates.isString)
    expect(() => builder.build()).toThrow('Transfer strategy is required')
  })

  it('should build rule without optional fields', () => {
    const rule = new RuleBuilder('minimal')
      .from(Predicates.isString)
      .to(Predicates.isString)
      .transfer(Strategies.value)
      .build()

    expect(rule.name).toBe('minimal')
    expect(rule.priority).toBeUndefined()
    expect(rule.description).toBeUndefined()
  })
})
