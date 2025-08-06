/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '../../../node'
import type { AnyPortConfig, ArrayPortConfig, IPort, IPortConfig, ObjectPortConfig } from '../../base'
import type { TransferEngine } from '../engine'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AnyPort } from '../../instances'
import { createDefaultTransferEngine, defaultTransferRules } from '../rules/default-rules'

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

function createMockAnyPort(config: AnyPortConfig, value?: unknown): AnyPort {
  const port = new AnyPort(config)
  port.getValue = () => value
  port.setValue = vi.fn()
  port.setConfig = vi.fn()
  port.setUnderlyingType = vi.fn()
  return port
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

describe('transfer Rules Integration', () => {
  let engine: TransferEngine
  let sourceNode: INode
  let targetNode: INode

  beforeEach(() => {
    engine = createDefaultTransferEngine()
    sourceNode = createMockNode()
    targetNode = createMockNode()
  })

  describe('object Transfer Rules', () => {
    describe('case 1: object{WithSchema} -> object{mutable}', () => {
      it('should transfer schema and value', async () => {
        const sourceConfig: ObjectPortConfig = {
          id: 'source',
          type: 'object',
          direction: 'output',
          schema: {
            properties: {
              name: { id: 'name', type: 'string', direction: 'input' },
              age: { id: 'age', type: 'number', direction: 'input' },
            },
          },
        }

        const targetConfig: ObjectPortConfig = {
          id: 'target',
          type: 'object',
          direction: 'input',
          isSchemaMutable: true,
          schema: { properties: {} },
        }

        const sourcePort = createMockPort(sourceConfig, { name: 'John', age: 30 })
        const targetPort = createMockPort(targetConfig)

        expect(engine.canConnect(sourcePort, targetPort)).toBe(true)

        const result = await engine.transfer(sourcePort, targetPort, sourceNode, targetNode)

        expect(result.success).toBe(true)
        expect(result.schemaTransferred).toBe(true)
        expect(result.valueTransferred).toBe(true)
        expect(targetNode.copyObjectSchemaTo).toHaveBeenCalled()
        expect(targetPort.setValue).toHaveBeenCalledWith({ name: 'John', age: 30 })
      })
    })

    describe('case 4: object -> object{not mutable}', () => {
      it('should transfer only value', async () => {
        const sourceConfig: ObjectPortConfig = {
          id: 'source',
          type: 'object',
          direction: 'output',
          schema: {
            properties: {
              name: { id: 'name', type: 'string', direction: 'input' },
            },
          },
        }

        const targetConfig: ObjectPortConfig = {
          id: 'target',
          type: 'object',
          direction: 'input',
          isSchemaMutable: false,
          schema: {
            properties: {
              name: { id: 'name', type: 'string', direction: 'input' },
            },
          },
        }

        const sourcePort = createMockPort(sourceConfig, { name: 'John' })
        const targetPort = createMockPort(targetConfig)

        expect(engine.canConnect(sourcePort, targetPort)).toBe(true)

        const result = await engine.transfer(sourcePort, targetPort, sourceNode, targetNode)

        expect(result.success).toBe(true)
        expect(result.valueTransferred).toBe(true)
        expect(result.schemaTransferred).toBeFalsy()
        expect(targetNode.copyObjectSchemaTo).not.toHaveBeenCalled()
        expect(targetPort.setValue).toHaveBeenCalledWith({ name: 'John' })
      })
    })
  })

  describe('any Port Transfer Rules', () => {
    describe('case 2: any{underlying:object} -> object{mutable}', () => {
      it('should unwrap and transfer schema and value', async () => {
        const sourceConfig: AnyPortConfig = {
          id: 'source',
          type: 'any',
          direction: 'output',
          underlyingType: {
            id: 'underlying',
            type: 'object',
            direction: 'output',
            schema: {
              properties: {
                field: { id: 'field', type: 'string', direction: 'input' },
              },
            },
          },
        }

        const targetConfig: ObjectPortConfig = {
          id: 'target',
          type: 'object',
          direction: 'input',
          isSchemaMutable: true,
          schema: { properties: {} },
        }

        const sourcePort = createMockAnyPort(sourceConfig, { field: 'value' })
        const targetPort = createMockPort(targetConfig)

        expect(engine.canConnect(sourcePort as IPort, targetPort)).toBe(true)

        const result = await engine.transfer(sourcePort as IPort, targetPort, sourceNode, targetNode)

        expect(result.success).toBe(true)
        expect(result.schemaTransferred).toBe(true)
        expect(result.valueTransferred).toBe(true)
      })
    })

    describe('case 3: any{underlying:type} -> any', () => {
      it('should set underlying type and transfer value', async () => {
        const sourceConfig: AnyPortConfig = {
          id: 'source',
          type: 'any',
          direction: 'output',
          underlyingType: {
            id: 'underlying',
            type: 'string',
            direction: 'output',
          },
        }

        const targetConfig: AnyPortConfig = {
          id: 'target',
          type: 'any',
          direction: 'input',
        }

        const sourcePort = createMockAnyPort(sourceConfig, 'test-value')
        const targetPort = createMockAnyPort(targetConfig)

        expect(engine.canConnect(sourcePort as IPort, targetPort as IPort)).toBe(true)

        const result = await engine.transfer(sourcePort as IPort, targetPort as IPort, sourceNode, targetNode)

        expect(result.success).toBe(true)
        expect(result.underlyingTypeSet).toBe(true)
        expect(result.valueTransferred).toBe(true)
        expect(targetPort.setUnderlyingType).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'string' }),
        )
        expect(targetPort.setValue).toHaveBeenCalledWith('test-value')
      })
    })

    describe('case 5: object -> any', () => {
      it('should set object as underlying type', async () => {
        const sourceConfig: ObjectPortConfig = {
          id: 'source',
          type: 'object',
          direction: 'output',
          schema: {
            properties: {
              prop: { id: 'prop', type: 'number', direction: 'input' },
            },
          },
        }

        const targetConfig: AnyPortConfig = {
          id: 'target',
          type: 'any',
          direction: 'input',
        }

        const sourcePort = createMockPort(sourceConfig, { prop: 42 })
        const targetPort = createMockAnyPort(targetConfig)

        expect(engine.canConnect(sourcePort, targetPort as IPort)).toBe(true)

        const result = await engine.transfer(sourcePort, targetPort as IPort, sourceNode, targetNode)

        expect(result.success).toBe(true)
        expect(result.underlyingTypeSet).toBe(true)
        expect(result.valueTransferred).toBe(true)
        expect(targetPort.setUnderlyingType).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'object',
            schema: expect.objectContaining({
              properties: expect.objectContaining({
                prop: expect.objectContaining({ type: 'number' }),
              }),
            }),
          }),
        )
      })
    })
  })

  describe('array Transfer Rules', () => {
    it('should transfer array item configuration', async () => {
      const sourceConfig: ArrayPortConfig = {
        id: 'source',
        type: 'array',
        direction: 'output',
        itemConfig: {
          id: 'item',
          type: 'string',
          direction: 'input',
        },
      }

      const targetConfig: ArrayPortConfig = {
        id: 'target',
        type: 'array',
        direction: 'input',
        itemConfig: {
          id: 'item',
          type: 'any',
          direction: 'input',
        },
      }

      const sourcePort = createMockPort(sourceConfig, ['a', 'b', 'c'])
      const targetPort = createMockPort(targetConfig)

      expect(engine.canConnect(sourcePort, targetPort)).toBe(true)

      const result = await engine.transfer(sourcePort, targetPort, sourceNode, targetNode)

      expect(result.success).toBe(true)
      expect(result.schemaTransferred).toBe(true)
      expect(result.valueTransferred).toBe(true)
      expect(targetPort.setConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          itemConfig: expect.objectContaining({ type: 'string' }),
        }),
      )
    })

    it('should transfer only value when target has specific item config', async () => {
      const sourceConfig: ArrayPortConfig = {
        id: 'source',
        type: 'array',
        direction: 'output',
        itemConfig: {
          id: 'item',
          type: 'string',
          direction: 'input',
        },
      }

      const targetConfig: ArrayPortConfig = {
        id: 'target',
        type: 'array',
        direction: 'input',
        itemConfig: {
          id: 'item',
          type: 'string',
          direction: 'input',
        },
      }

      const sourcePort = createMockPort(sourceConfig, ['a', 'b'])
      const targetPort = createMockPort(targetConfig)

      expect(engine.canConnect(sourcePort, targetPort)).toBe(true)

      const result = await engine.transfer(sourcePort, targetPort, sourceNode, targetNode)

      expect(result.success).toBe(true)
      expect(result.valueTransferred).toBe(true)
      expect(result.schemaTransferred).toBeFalsy()
      expect(targetPort.setValue).toHaveBeenCalledWith(['a', 'b'])
    })
  })

  describe('simple Type Transfer Rules', () => {
    it('should transfer string values', async () => {
      const sourcePort = createMockPort({
        id: 'source',
        type: 'string',
        direction: 'output',
      }, 'test-string')

      const targetPort = createMockPort({
        id: 'target',
        type: 'string',
        direction: 'input',
      })

      expect(engine.canConnect(sourcePort, targetPort)).toBe(true)

      const result = await engine.transfer(sourcePort, targetPort, sourceNode, targetNode)

      expect(result.success).toBe(true)
      expect(result.valueTransferred).toBe(true)
      expect(targetPort.setValue).toHaveBeenCalledWith('test-string')
    })

    it('should transfer number values', async () => {
      const sourcePort = createMockPort({
        id: 'source',
        type: 'number',
        direction: 'output',
      }, 42)

      const targetPort = createMockPort({
        id: 'target',
        type: 'number',
        direction: 'input',
      })

      expect(engine.canConnect(sourcePort, targetPort)).toBe(true)

      const result = await engine.transfer(sourcePort, targetPort, sourceNode, targetNode)

      expect(result.success).toBe(true)
      expect(targetPort.setValue).toHaveBeenCalledWith(42)
    })

    it('should transfer boolean values', async () => {
      const sourcePort = createMockPort({
        id: 'source',
        type: 'boolean',
        direction: 'output',
      }, true)

      const targetPort = createMockPort({
        id: 'target',
        type: 'boolean',
        direction: 'input',
      })

      expect(engine.canConnect(sourcePort, targetPort)).toBe(true)

      const result = await engine.transfer(sourcePort, targetPort, sourceNode, targetNode)

      expect(result.success).toBe(true)
      expect(targetPort.setValue).toHaveBeenCalledWith(true)
    })

    it('should set simple type as underlying on any port', async () => {
      const sourcePort = createMockPort({
        id: 'source',
        type: 'string',
        direction: 'output',
      }, 'test')

      const targetPort = createMockAnyPort({
        id: 'target',
        type: 'any',
        direction: 'input',
      })

      expect(engine.canConnect(sourcePort, targetPort as IPort)).toBe(true)

      const result = await engine.transfer(sourcePort, targetPort as IPort, sourceNode, targetNode)

      expect(result.success).toBe(true)
      expect(result.underlyingTypeSet).toBe(true)
      expect(result.valueTransferred).toBe(true)
      expect(targetPort.setUnderlyingType).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'string' }),
      )
    })
  })

  describe('edge Cases', () => {
    it('should handle any -> any without underlying type', async () => {
      const sourcePort = createMockAnyPort({
        id: 'source',
        type: 'any',
        direction: 'output',
      }, 'some-value')

      const targetPort = createMockAnyPort({
        id: 'target',
        type: 'any',
        direction: 'input',
      })

      expect(engine.canConnect(sourcePort as IPort, targetPort as IPort)).toBe(true)

      const result = await engine.transfer(sourcePort as IPort, targetPort as IPort, sourceNode, targetNode)

      expect(result.success).toBe(true)
      expect(result.valueTransferred).toBe(true)
      expect(targetPort.setValue).toHaveBeenCalledWith('some-value')
    })

    it('should not connect incompatible types', async () => {
      const sourcePort = createMockPort({
        id: 'source',
        type: 'string',
        direction: 'output',
      })

      const targetPort = createMockPort({
        id: 'target',
        type: 'number',
        direction: 'input',
      })

      expect(engine.canConnect(sourcePort, targetPort)).toBe(false)

      const result = await engine.transfer(sourcePort, targetPort, sourceNode, targetNode)

      expect(result.success).toBe(false)
      expect(result.message).toContain('No transfer rule found')
    })

    it('should handle nested any ports', async () => {
      const sourceConfig: AnyPortConfig = {
        id: 'source',
        type: 'any',
        direction: 'output',
        underlyingType: {
          id: 'nested1',
          type: 'any',
          direction: 'output',
          underlyingType: {
            id: 'nested2',
            type: 'string',
            direction: 'output',
          },
        },
      }

      const targetConfig: AnyPortConfig = {
        id: 'target',
        type: 'any',
        direction: 'input',
      }

      const sourcePort = createMockAnyPort(sourceConfig, 'nested-value')
      const targetPort = createMockAnyPort(targetConfig)

      expect(engine.canConnect(sourcePort as IPort, targetPort as IPort)).toBe(true)

      const result = await engine.transfer(sourcePort as IPort, targetPort as IPort, sourceNode, targetNode)

      expect(result.success).toBe(true)
      expect(result.underlyingTypeSet).toBe(true)
      expect(targetPort.setUnderlyingType).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'string' }),
      )
    })
  })

  describe('rule Priority', () => {
    it('should respect rule priority order', () => {
      const rules = engine.getRules()

      // Verify rules are sorted by priority
      for (let i = 0; i < rules.length - 1; i++) {
        const currentPriority = rules[i].priority || 0
        const nextPriority = rules[i + 1].priority || 0
        expect(currentPriority).toBeGreaterThanOrEqual(nextPriority)
      }

      // Verify specific rule priorities from our default rules
      const objectToMutable = rules.find(r => r.name === 'object-to-mutable-object')
      const objectToImmutable = rules.find(r => r.name === 'object-to-immutable-object')
      const stringToString = rules.find(r => r.name === 'string-to-string')

      expect(objectToMutable?.priority).toBe(100)
      expect(objectToImmutable?.priority).toBe(90)
      expect(stringToString?.priority).toBe(40)
    })
  })

  describe('default Rules Coverage', () => {
    it('should have all expected default rules', () => {
      expect(defaultTransferRules).toHaveLength(17)

      const ruleNames = defaultTransferRules.map(r => r.name)

      // Object rules
      expect(ruleNames).toContain('object-to-mutable-object')
      expect(ruleNames).toContain('object-to-immutable-object')

      // Any port rules
      expect(ruleNames).toContain('any-object-to-mutable-object')
      expect(ruleNames).toContain('any-object-to-immutable-object')
      expect(ruleNames).toContain('any-with-type-to-any')
      expect(ruleNames).toContain('object-to-any')
      expect(ruleNames).toContain('array-to-any')

      // Array rules
      expect(ruleNames).toContain('array-config-transfer')
      expect(ruleNames).toContain('array-value-only')
      expect(ruleNames).toContain('any-array-to-array-flexible')

      // Simple type rules
      expect(ruleNames).toContain('string-to-string')
      expect(ruleNames).toContain('number-to-number')
      expect(ruleNames).toContain('boolean-to-boolean')
      expect(ruleNames).toContain('simple-type-to-any')

      // Fallback rules
      expect(ruleNames).toContain('any-to-any-fallback')
    })
  })
})
