/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '../../../node'
import type { ArrayPortConfig, IPort, IPortConfig, ObjectPortConfig } from '../../base'
import type { TransferContext } from '../types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AnyPort } from '../../instances'
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

describe('strategies', () => {
  let context: TransferContext
  let sourcePort: IPort
  let targetPort: IPort
  let sourceNode: INode
  let targetNode: INode

  beforeEach(() => {
    sourcePort = createMockPort({
      id: 'source',
      type: 'string',
      direction: 'output',
    }, 'test-value')

    targetPort = createMockPort({
      id: 'target',
      type: 'string',
      direction: 'input',
    })

    sourceNode = createMockNode()
    targetNode = createMockNode()

    context = {
      sourcePort,
      targetPort,
      sourceConfig: sourcePort.getConfig(),
      targetConfig: targetPort.getConfig(),
      sourceNode,
      targetNode,
    }
  })

  describe('basic Transfer Strategies', () => {
    describe('value', () => {
      it('should transfer value from source to target', () => {
        const result = Strategies.value(context)

        expect(result.success).toBe(true)
        expect(result.valueTransferred).toBe(true)
        expect(targetPort.setValue).toHaveBeenCalledWith('test-value')
        expect(targetNode.updatePort).toHaveBeenCalledWith(targetPort)
      })

      it('should use default value when port value is null', () => {
        const sourceWithDefault = createMockPort({
          id: 'source',
          type: 'string',
          direction: 'output',
          defaultValue: 'default-value',
        }, null)

        context.sourcePort = sourceWithDefault
        context.sourceConfig = sourceWithDefault.getConfig()

        const result = Strategies.value(context)

        expect(result.success).toBe(true)
        expect(targetPort.setValue).toHaveBeenCalledWith('default-value')
      })

      it('should handle transfer errors', () => {
        const error = new Error('Transfer failed')
        vi.mocked(targetPort.setValue).mockImplementation(() => {
          throw error
        })

        const result = Strategies.value(context)

        expect(result.success).toBe(false)
        expect(result.error).toBe(error)
        expect(result.message).toContain('Failed to transfer value')
      })
    })

    describe('objectSchema', () => {
      beforeEach(() => {
        const sourceObjectConfig: ObjectPortConfig = {
          id: 'source',
          type: 'object',
          direction: 'output',
          isSchemaMutable: false,
          schema: {
            properties: {
              name: { id: 'name', type: 'string', direction: 'input' },
            },
          },
        }

        const targetObjectConfig: ObjectPortConfig = {
          id: 'target',
          type: 'object',
          direction: 'input',
          isSchemaMutable: true,
          schema: { properties: {} },
        }

        sourcePort = createMockPort(sourceObjectConfig)
        targetPort = createMockPort(targetObjectConfig)

        context.sourcePort = sourcePort
        context.targetPort = targetPort
        context.sourceConfig = sourceObjectConfig
        context.targetConfig = targetObjectConfig
      })

      it('should transfer schema between object ports', () => {
        const result = Strategies.objectSchema(context)

        expect(result.success).toBe(true)
        expect(result.schemaTransferred).toBe(true)
        expect(targetNode.copyObjectSchemaTo).toHaveBeenCalled()
      })

      it('should fail if target schema is not mutable', () => {
        const immutableConfig: ObjectPortConfig = {
          ...context.targetConfig as ObjectPortConfig,
          isSchemaMutable: false,
        }
        context.targetConfig = immutableConfig

        const result = Strategies.objectSchema(context)

        expect(result.success).toBe(false)
        expect(result.message).toContain('not mutable')
      })

      it('should fail if ports are not object type', () => {
        context.sourceConfig = {
          id: 'source',
          type: 'string',
          direction: 'output',
        }

        const result = Strategies.objectSchema(context)

        expect(result.success).toBe(false)
        expect(result.message).toContain('must be object type')
      })
    })

    describe('arrayItemConfig', () => {
      beforeEach(() => {
        const sourceArrayConfig: ArrayPortConfig = {
          id: 'source',
          type: 'array',
          direction: 'output',
          itemConfig: {
            id: 'item',
            type: 'string',
            direction: 'input',
          },
        }

        const targetArrayConfig: ArrayPortConfig = {
          id: 'target',
          type: 'array',
          direction: 'input',
          itemConfig: {
            id: 'item',
            type: 'any',
            direction: 'input',
          },
        }

        sourcePort = createMockPort(sourceArrayConfig)
        targetPort = createMockPort(targetArrayConfig)

        context.sourcePort = sourcePort
        context.targetPort = targetPort
        context.sourceConfig = sourceArrayConfig
        context.targetConfig = targetArrayConfig
      })

      it('should transfer array item configuration', () => {
        const result = Strategies.arrayItemConfig(context)

        expect(result.success).toBe(true)
        expect(result.schemaTransferred).toBe(true)
        expect(targetPort.setConfig).toHaveBeenCalledWith(
          expect.objectContaining({
            itemConfig: expect.objectContaining({
              type: 'string',
            }),
          }),
        )
        expect(targetNode.updateArrayItemConfig).toHaveBeenCalledWith(targetPort)
      })

      it('should transfer when target has no item config', () => {
        const noItemConfig: ArrayPortConfig = {
          id: 'target',
          type: 'array',
          direction: 'input',
          itemConfig: undefined as any, // No item config
        }
        context.targetConfig = noItemConfig

        const result = Strategies.arrayItemConfig(context)

        expect(result.success).toBe(true)
      })

      it('should fail if target has specific item config', () => {
        const specificConfig: ArrayPortConfig = {
          ...context.targetConfig as ArrayPortConfig,
          itemConfig: {
            id: 'item',
            type: 'number',
            direction: 'input',
          },
        }
        context.targetConfig = specificConfig

        const result = Strategies.arrayItemConfig(context)

        expect(result.success).toBe(false)
        expect(result.message).toContain('already has specific item configuration')
      })

      it('should fail if ports are not array type', () => {
        context.sourceConfig = {
          id: 'source',
          type: 'string',
          direction: 'output',
        }

        const result = Strategies.arrayItemConfig(context)

        expect(result.success).toBe(false)
        expect(result.message).toContain('must be array type')
      })
    })

    describe('setUnderlyingType', () => {
      beforeEach(() => {
        const anyPortInstance = new AnyPort({
          id: 'target',
          type: 'any',
          direction: 'input',
        })

        anyPortInstance.setUnderlyingType = vi.fn()

        context.targetPort = anyPortInstance as IPort
        context.sourceConfig = {
          id: 'source',
          type: 'string',
          direction: 'output',
        }
      })

      it('should set underlying type on AnyPort', () => {
        const result = Strategies.setUnderlyingType(context)

        expect(result.success).toBe(true)
        expect(result.underlyingTypeSet).toBe(true)
        expect((context.targetPort as AnyPort).setUnderlyingType).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'string',
          }),
        )
        expect(targetNode.refreshAnyPortUnderlyingPorts).toHaveBeenCalledWith(context.targetPort, true)
      })

      it('should unwrap source if it is also AnyPort', () => {
        const sourceAnyPort = new AnyPort({
          id: 'source',
          type: 'any',
          direction: 'output',
          underlyingType: {
            id: 'underlying',
            type: 'number',
            direction: 'output',
          },
        })

        context.sourcePort = sourceAnyPort as IPort
        context.sourceConfig = sourceAnyPort.getConfig()

        const result = Strategies.setUnderlyingType(context)

        expect(result.success).toBe(true)
        expect((context.targetPort as AnyPort).setUnderlyingType).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'number',
          }),
        )
      })

      it('should fail if target is not AnyPort', () => {
        context.targetPort = createMockPort({
          id: 'target',
          type: 'string',
          direction: 'input',
        })

        const result = Strategies.setUnderlyingType(context)

        expect(result.success).toBe(false)
        expect(result.message).toContain('must be AnyPort')
      })
    })
  })

  describe('composite Strategies', () => {
    describe('compose', () => {
      it('should execute strategies sequentially', async () => {
        const strategy1 = vi.fn().mockReturnValue({
          success: true,
          valueTransferred: true,
        })
        const strategy2 = vi.fn().mockReturnValue({
          success: true,
          schemaTransferred: true,
        })

        const composed = Strategies.compose(strategy1, strategy2)
        const result = await composed(context)

        expect(result.success).toBe(true)
        expect(result.valueTransferred).toBe(true)
        expect(result.schemaTransferred).toBe(true)
        expect(strategy1).toHaveBeenCalledWith(context)
        expect(strategy2).toHaveBeenCalledWith(context)
      })

      it('should stop on first failure', async () => {
        const strategy1 = vi.fn().mockReturnValue({
          success: false,
          error: new Error('Failed'),
          message: 'Strategy 1 failed',
        })
        const strategy2 = vi.fn().mockReturnValue({
          success: true,
        })

        const composed = Strategies.compose(strategy1, strategy2)
        const result = await composed(context)

        expect(result.success).toBe(false)
        expect(result.message).toBe('Strategy 1 failed')
        expect(strategy1).toHaveBeenCalled()
        expect(strategy2).not.toHaveBeenCalled()
      })
    })

    describe('when', () => {
      it('should execute then strategy when condition is true', async () => {
        const condition = vi.fn().mockReturnValue(true)
        const thenStrategy = vi.fn().mockReturnValue({ success: true })
        const elseStrategy = vi.fn().mockReturnValue({ success: false })

        const conditional = Strategies.when(condition, thenStrategy, elseStrategy)
        let result = conditional(context)
        if (result instanceof Promise) {
          result = await result
        }

        expect(result.success).toBe(true)
        expect(condition).toHaveBeenCalledWith(context)
        expect(thenStrategy).toHaveBeenCalledWith(context)
        expect(elseStrategy).not.toHaveBeenCalled()
      })

      it('should execute else strategy when condition is false', async () => {
        const condition = vi.fn().mockReturnValue(false)
        const thenStrategy = vi.fn().mockReturnValue({ success: true })
        const elseStrategy = vi.fn().mockReturnValue({ success: false })

        const conditional = Strategies.when(condition, thenStrategy, elseStrategy)
        let result = conditional(context)
        if (result instanceof Promise) {
          result = await result
        }

        expect(result.success).toBe(false)
        expect(condition).toHaveBeenCalledWith(context)
        expect(thenStrategy).not.toHaveBeenCalled()
        expect(elseStrategy).toHaveBeenCalledWith(context)
      })

      it('should return success when condition is false and no else strategy', async () => {
        const condition = vi.fn().mockReturnValue(false)
        const thenStrategy = vi.fn().mockReturnValue({ success: true })

        const conditional = Strategies.when(condition, thenStrategy)
        let result = conditional(context)
        if (result instanceof Promise) {
          result = await result
        }

        expect(result.success).toBe(true)
        expect(result.message).toContain('Condition not met')
        expect(thenStrategy).not.toHaveBeenCalled()
      })
    })

    describe('tryFirst', () => {
      it('should return first successful strategy', async () => {
        const strategy1 = vi.fn().mockReturnValue({
          success: false,
          message: 'Failed 1',
        })
        const strategy2 = vi.fn().mockReturnValue({
          success: true,
          message: 'Success 2',
        })
        const strategy3 = vi.fn().mockReturnValue({
          success: true,
          message: 'Success 3',
        })

        const tryFirst = Strategies.tryFirst(strategy1, strategy2, strategy3)
        const result = await tryFirst(context)

        expect(result.success).toBe(true)
        expect(result.message).toBe('Success 2')
        expect(strategy1).toHaveBeenCalled()
        expect(strategy2).toHaveBeenCalled()
        expect(strategy3).not.toHaveBeenCalled()
      })

      it('should return failure if all strategies fail', async () => {
        const strategy1 = vi.fn().mockReturnValue({ success: false })
        const strategy2 = vi.fn().mockReturnValue({ success: false })

        const tryFirst = Strategies.tryFirst(strategy1, strategy2)
        const result = await tryFirst(context)

        expect(result.success).toBe(false)
        expect(result.message).toBe('All strategies failed')
        expect(strategy1).toHaveBeenCalled()
        expect(strategy2).toHaveBeenCalled()
      })
    })
  })

  describe('specialized Strategies', () => {
    it('should compose object schema and value transfer', async () => {
      const objectSourceConfig: ObjectPortConfig = {
        id: 'source',
        type: 'object',
        direction: 'output',
        schema: { properties: {} },
      }
      const objectTargetConfig: ObjectPortConfig = {
        id: 'target',
        type: 'object',
        direction: 'input',
        isSchemaMutable: true,
        schema: { properties: {} },
      }

      context.sourcePort = createMockPort(objectSourceConfig, {})
      context.targetPort = createMockPort(objectTargetConfig)
      context.sourceConfig = objectSourceConfig
      context.targetConfig = objectTargetConfig

      const result = await Strategies.objectSchemaAndValue(context)

      expect(result.success).toBe(true)
      expect(result.schemaTransferred).toBe(true)
      expect(result.valueTransferred).toBe(true)
    })

    it('should compose array config and value transfer', async () => {
      const arraySourceConfig: ArrayPortConfig = {
        id: 'source',
        type: 'array',
        direction: 'output',
        itemConfig: { id: 'item', type: 'string', direction: 'input' },
      }
      const arrayTargetConfig: ArrayPortConfig = {
        id: 'target',
        type: 'array',
        direction: 'input',
        itemConfig: { type: 'any' },
      }

      context.sourcePort = createMockPort(arraySourceConfig, [])
      context.targetPort = createMockPort(arrayTargetConfig)
      context.sourceConfig = arraySourceConfig
      context.targetConfig = arrayTargetConfig

      const result = await Strategies.arrayConfigAndValue(context)

      expect(result.success).toBe(true)
      expect(result.schemaTransferred).toBe(true)
      expect(result.valueTransferred).toBe(true)
    })

    it('should compose underlying type and value transfer', async () => {
      const anyPort = new AnyPort({
        id: 'target',
        type: 'any',
        direction: 'input',
      })
      anyPort.setUnderlyingType = vi.fn()

      context.targetPort = anyPort as IPort
      context.sourceConfig = { id: 'source', type: 'string', direction: 'output' }

      const result = await Strategies.underlyingTypeAndValue(context)

      expect(result.success).toBe(true)
      expect(result.underlyingTypeSet).toBe(true)
      expect(result.valueTransferred).toBe(true)
    })

    it('should execute noop strategy', () => {
      const result = Strategies.noop()

      expect(result.success).toBe(true)
      expect(result.message).toBe('No transfer performed')
    })
  })
})
