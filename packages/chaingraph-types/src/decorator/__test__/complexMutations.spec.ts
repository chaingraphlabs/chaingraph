/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { PortPluginRegistry } from '@badaitech/chaingraph-types'
import { beforeEach, describe, expect, it } from 'vitest'
import { BaseNode } from '../../node/base-node'
import { findPort } from '../../node/traverse-ports'
import {
  ArrayPortPlugin,
  EnumPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  StreamPortPlugin,
  StringPortPlugin,
} from '../../port/plugins'
import { AnyPortPlugin } from '../../port/plugins/AnyPortPlugin'
import { ObjectSchema } from '../index'
import { Node } from '../node.decorator'
import { Port } from '../port.decorator'
import 'reflect-metadata'

// Register basic port plugins for testing mutations
PortPluginRegistry.getInstance().register(StringPortPlugin)
PortPluginRegistry.getInstance().register(NumberPortPlugin)
PortPluginRegistry.getInstance().register(ArrayPortPlugin)
PortPluginRegistry.getInstance().register(ObjectPortPlugin)

/**
 * In this test we want to verify complex mutation scenarios.
 * Since decorated ports are linked to class fields through getters/setters,
 * we need to operate on an object that implements INode.
 *
 * To achieve this, we decorate TestObjectComponent both with @Node and @ObjectSchema
 * and let it extend BaseNode.
 */
@ObjectSchema({
  category: 'TestObjectComponent',
})
class TestObjectComponent {
  // A simple string field with default value (pure string).
  @Port({ type: 'string' })
  public topString: string = 'init'

  // An array of numbers with default array value.
  @Port({
    type: 'array',
    itemConfig: { type: 'number' },
  })
  public numberList: number[] = [1, 2]

  // A complex object field whose schema is defined inline.
  @Port({
    type: 'object',
    schema: {
      type: 'TestInnerObject',
      properties: {
        innerString: { type: 'string' },
        innerList: {
          type: 'array',
          itemConfig: { type: 'string' },
        },
      },
    },
  })
  public complexObject: {
    innerString: string
    innerList: string[]
  } = {
      innerString: 'defaultInner',
      innerList: ['a'],
    }
}

/**
 * TestNode wraps the TestObjectComponent as a child node.
 * This helps us simulate a composite node scenario.
 */
@Node({
  title: 'Test Node',
})
class TestNode extends BaseNode {
  @Port({
    type: 'object',
    schema: TestObjectComponent,
  })
  public testComponent: TestObjectComponent = {
    topString: 'init',
    numberList: [1, 2],
    complexObject: {
      innerString: 'defaultInner',
      innerList: ['a'],
    },
  }

  async execute() {
    return Promise.resolve({})
  }
}

describe('advanced Field Mutations Tests', () => {
  beforeEach(() => {
    PortPluginRegistry.getInstance().register(StringPortPlugin)
    PortPluginRegistry.getInstance().register(NumberPortPlugin)
    PortPluginRegistry.getInstance().register(AnyPortPlugin)
    PortPluginRegistry.getInstance().register(StreamPortPlugin)
    PortPluginRegistry.getInstance().register(ArrayPortPlugin)
    PortPluginRegistry.getInstance().register(ObjectPortPlugin)
    PortPluginRegistry.getInstance().register(EnumPortPlugin)

    // Initialize both parent node and the child component.
  })

  describe('array Field Mutations', () => {
    it('should correctly update entire array, individual element, and perform push/pop operations', () => {
      const node = new TestNode('node1')
      node.initialize()

      const portInstance = findPort(
        node,
        port => port.getConfig().key === 'numberList',
      )
      expect(portInstance).toBeDefined()

      // Initially, numberList equals [1, 2]
      expect(node.testComponent.numberList).toEqual([1, 2])
      expect(portInstance?.getValue()).toEqual([1, 2])

      // Update entire array.
      node.testComponent = {
        topString: 'init',
        numberList: [1, 2, 3],
        complexObject: {
          innerString: 'defaultInner',
          innerList: ['a'],
        },
      }
      node.testComponent.numberList = [10, 20, 30]
      expect(node.testComponent.numberList).toStrictEqual([10, 20, 30])

      const numberListInstance = findPort(
        node,
        port => port.getConfig().key === 'numberList',
      )
      expect(numberListInstance?.getValue()).toStrictEqual([10, 20, 30])

      // Mutate an individual element.
      node.testComponent.numberList[1] = 99
      expect(node.testComponent.numberList).toStrictEqual([10, 99, 30])
      expect(portInstance?.getValue()).toStrictEqual([10, 99, 30])

      // Push a new element.
      node.testComponent.numberList.push(42)
      expect(node.testComponent.numberList).toStrictEqual([10, 99, 30, 42])
      expect(portInstance?.getValue()).toStrictEqual([10, 99, 30, 42])

      // Pop the last element.
      node.testComponent.numberList.pop()
      expect(node.testComponent.numberList).toStrictEqual([10, 99, 30])
      expect(portInstance?.getValue()).toStrictEqual([10, 99, 30])
    })
  })

  describe('object Field Mutations', () => {
    it('should propagate mutations on top-level object fields', () => {
      const node = new TestNode('node1')
      node.initialize()

      const topStrPort = findPort(node, port => port.getConfig().key === 'topString')
      expect(topStrPort).toBeDefined()

      // Change the top-level string value.
      node.testComponent.topString = 'changed'
      expect(node.testComponent.topString).toBe('changed')
      expect(topStrPort?.getValue()).toStrictEqual('changed')
    })

    it('should correctly update nested object properties', () => {
      const node = new TestNode('node1')
      node.initialize()

      const complexPort = findPort(node, port => port.getConfig().key === 'complexObject')
      expect(complexPort).toBeDefined()

      // Initially, innerString should be "defaultInner".
      expect(node.testComponent.complexObject.innerString).toBe('defaultInner')

      // Update nested property.
      node.testComponent.complexObject.innerString = 'updatedInner'
      expect(node.testComponent.complexObject.innerString).toBe('updatedInner')

      // Update nested array within complexObject.
      node.testComponent.complexObject.innerList.push('newItem')
      expect(node.testComponent.complexObject.innerList).toStrictEqual(['a', 'newItem'])

      // Underlying port value should reflect mutations.
      expect(complexPort?.getValue()).toStrictEqual({
        innerString: 'updatedInner',
        innerList: ['a', 'newItem'],
      })
    })
  })

  describe('combined Nested Mutations', () => {
    it('should propagate complex mutations when nested arrays and objects are mutated simultaneously', () => {
      const node = new TestNode('node1')
      node.initialize()

      const complexPort = findPort(node, port => port.getConfig().key === 'complexObject')
      expect(complexPort).toBeDefined()

      // Update both nested string and nested array.
      node.testComponent.complexObject.innerString = 'complexUpdate'
      node.testComponent.complexObject.innerList = ['x', 'y', 'z']
      expect(node.testComponent.complexObject.innerString).toBe('complexUpdate')
      expect(node.testComponent.complexObject.innerList).toStrictEqual(['x', 'y', 'z'])
      expect(complexPort?.getValue()).toStrictEqual({
        innerString: 'complexUpdate',
        innerList: ['x', 'y', 'z'],
      })

      // Also update numberList array with splice operations.
      const arrayPort = findPort(node, port => port.getConfig().key === 'numberList')
      expect(arrayPort).toBeDefined()

      node.testComponent.numberList = [5, 6, 7, 8, 9]
      // Remove two items starting at index 2 and insert new ones.
      node.testComponent.numberList.splice(2, 2, 100, 101)
      expect(node.testComponent.numberList).toStrictEqual([5, 6, 100, 101, 9])
      expect(arrayPort?.getValue()).toStrictEqual([5, 6, 100, 101, 9])
    })
  })
})
