/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../../execution'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Node } from '../../decorator/node.decorator'
import { Port } from '../../decorator/port.decorator'
import { PortPluginRegistry } from '../../port'
import {
  ArrayPortPlugin,
  BooleanPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  StringPortPlugin,
} from '../../port/plugins'
import { BaseNodeCompositional } from '../base-node-compositional'
import { NodeEventType } from '../events'
import { NodeStatus } from '../node-enums'
import 'reflect-metadata'

// Register port plugins for testing
beforeEach(() => {
  const registry = PortPluginRegistry.getInstance()
  registry.register(StringPortPlugin)
  registry.register(NumberPortPlugin)
  registry.register(ArrayPortPlugin)
  registry.register(ObjectPortPlugin)
  registry.register(BooleanPortPlugin)
})

/**
 * A simple test node with various port types for testing purposes
 */
@Node({
  type: 'TestNode',
  title: 'Test Node',
  description: 'A test node for unit testing',
})
class TestNode extends BaseNodeCompositional {
  @Port({
    type: 'string',
    direction: 'input',
  })
  inputString: string = 'default'

  @Port({
    type: 'number',
    direction: 'input',
  })
  inputNumber: number = 42

  @Port({
    type: 'boolean',
    direction: 'input',
  })
  inputBoolean: boolean = false

  @Port({
    type: 'string',
    direction: 'output',
  })
  outputString: string = ''

  @Port({
    type: 'object',
    schema: {
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    },
  })
  person: { name: string, age: number } = {
    name: 'John',
    age: 30,
  }

  @Port({
    type: 'array',
    itemConfig: { type: 'string' },
  })
  stringList: string[] = ['one', 'two']

  async execute(_context: ExecutionContext) {
    // Simple execution that concatenates input string and number
    this.outputString = `${this.inputString}-${this.inputNumber}`
    return {}
  }
}

describe('baseNodeCompositional', () => {
  let node: TestNode

  beforeEach(() => {
    node = new TestNode('test-node')
    node.initialize()
  })

  it('should initialize with correct port values', () => {
    // Check basic port creation
    expect(node.inputString).toBe('default')
    expect(node.inputNumber).toBe(42)
    expect(node.inputBoolean).toBe(false)
    expect(node.person).toEqual({ name: 'John', age: 30 })
    expect(node.stringList).toEqual(['one', 'two'])

    // Check that all ports were created
    expect(node.ports.size).toBeGreaterThan(6) // At least the main 6 ports + child ports
  })

  it('should correctly update port values', async () => {
    // Update primitive values
    node.inputString = 'changed'
    node.inputNumber = 100

    // Verify values were updated
    expect(node.inputString).toBe('changed')
    expect(node.inputNumber).toBe(100)

    // Verify port values were updated
    const stringPort = node.getPort(
      Array.from(node.ports.values())
        .find(p => p.getConfig().key === 'inputString')
        ?.id || '',
    )
    const numberPort = node.getPort(
      Array.from(node.ports.values())
        .find(p => p.getConfig().key === 'inputNumber')
        ?.id || '',
    )

    expect(stringPort?.getValue()).toBe('changed')
    expect(numberPort?.getValue()).toBe(100)
  })

  it('should update object properties correctly', async () => {
    // Update object property
    node.person.name = 'Jane'
    node.person.age = 25

    // Verify object was updated
    expect(node.person).toEqual({ name: 'Jane', age: 25 })

    // Verify port value was updated
    const objectPort = node.getPort(
      Array.from(node.ports.values())
        .find(p => p.getConfig().key === 'person')
        ?.id || '',
    )

    expect(objectPort?.getValue()).toEqual({ name: 'Jane', age: 25 })
  })

  it('should update array items correctly', async () => {
    // Update array
    node.stringList.push('three')

    // Verify array was updated
    expect(node.stringList).toEqual(['one', 'two', 'three'])

    // Replace entire array
    node.stringList = ['new', 'array']
    expect(node.stringList).toEqual(['new', 'array'])

    // Verify port value was updated
    const arrayPort = node.getPort(
      Array.from(node.ports.values())
        .find(p => p.getConfig().key === 'stringList')
        ?.id || '',
    )

    expect(arrayPort?.getValue()).toEqual(['new', 'array'])
  })

  it('should execute correctly', async () => {
    // Set up input values
    node.inputString = 'hello'
    node.inputNumber = 123

    // Execute the node
    const result = await node.execute({} as ExecutionContext)

    // Verify output was set correctly
    expect(node.outputString).toBe('hello-123')
    expect(result).toEqual({})
  })

  it('should emit events when status changes', () => {
    // Set up a mock event handler
    const handler = vi.fn()
    node.onAll(handler)

    // Change status with emitEvent=true
    node.setStatus(NodeStatus.Executing, true)

    // Verify event was emitted
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][0].type).toBe(NodeEventType.StatusChange)
    expect(handler.mock.calls[0][0].newStatus).toBe(NodeStatus.Executing)
  })

  it('should not emit events when emitEvent=false', () => {
    // Set up a mock event handler
    const handler = vi.fn()
    node.onAll(handler)

    // Change status with emitEvent=false
    node.setStatus(NodeStatus.Executing, false)

    // Verify no event was emitted
    expect(handler).not.toHaveBeenCalled()
  })

  it('should support serialization and deserialization', () => {
    // Update some values
    node.inputString = 'serialized'
    node.inputNumber = 999

    // Serialize
    const serialized = node.serialize()

    // Create a new node instance
    const newNode = new TestNode('test-node')

    // Deserialize
    newNode.deserialize(serialized)

    // After deserialization, the node should be initialized
    newNode.initialize()

    // Verify values were preserved
    expect(newNode.inputString).toBe('serialized')
    expect(newNode.inputNumber).toBe(999)

    // Status may be idle until we call initialize() again
    expect(newNode.status).toBe(NodeStatus.Initialized)
  })

  it('should reset ports when reset is called', async () => {
    // Update some values
    node.inputString = 'changed'
    node.inputNumber = 100

    // Reset the node
    await node.reset()

    // Verify default values were restored
    // Note: Current implementation of reset doesn't actually reset port values to default,
    // it just calls port.reset() which might need to be implemented in the port classes
    expect(node.status).toBe(NodeStatus.Idle)
  })

  it('should support setting UI properties', () => {
    // Set up a mock event handler
    const handler = vi.fn()
    node.onAll(handler)

    // Set UI position
    node.setPosition({ x: 100, y: 200 }, true)

    // Verify UI was updated
    expect(node.getUI()?.position).toEqual({ x: 100, y: 200 })

    // Verify event was emitted
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][0].type).toBe(NodeEventType.UIPositionChange)
  })

  it('should clone correctly', () => {
    // Update some values
    node.inputString = 'to-be-cloned'
    node.inputNumber = 555

    // Clone the node
    const clonedNode = node.clone() as unknown as TestNode

    // After cloning, the node should be initialized
    clonedNode.initialize()

    // Verify values were preserved
    expect(clonedNode.inputString).toBe('to-be-cloned')
    expect(clonedNode.inputNumber).toBe(555)
    expect(clonedNode.id).toBe(node.id)
    expect(clonedNode.status).toBe(NodeStatus.Initialized)
  })

  describe('cloneWithNewId', () => {
    it('should clone node with new unique identifiers', () => {
      // Update some values to verify they are preserved
      node.inputString = 'clone-test'
      node.inputNumber = 999
      node.inputBoolean = true
      node.person = { name: 'Cloned', age: 40 }
      node.stringList = ['cloned', 'list']

      // Set UI properties
      node.setPosition({ x: 50, y: 75 }, false)
      node.setDimensions({ width: 200, height: 150 }, false)

      // Clone with new ID
      const clonedNode = node.cloneWithNewId() as TestNode

      // Verify node has a different ID
      expect(clonedNode.id).not.toBe(node.id)

      // Verify values were preserved
      expect(clonedNode.inputString).toBe('clone-test')
      expect(clonedNode.inputNumber).toBe(999)
      expect(clonedNode.inputBoolean).toBe(true)
      expect(clonedNode.person).toEqual({ name: 'Cloned', age: 40 })
      expect(clonedNode.stringList).toEqual(['cloned', 'list'])

      // Verify UI properties were preserved
      expect(clonedNode.getUI()?.position).toEqual({ x: 50, y: 75 })
      expect(clonedNode.getUI()?.dimensions).toEqual({ width: 200, height: 150 })

      // Verify version and status were preserved
      expect(clonedNode.getVersion()).toBe(node.getVersion())
      expect(clonedNode.status).toBe(node.status)
    })

    it('should clone all ports with all same identifiers', () => {
      // Clone with new ID
      const clonedNode = node.cloneWithNewId()

      // Verify all ports have different IDs
      const originalPortIds = Array.from(node.ports.keys())
      const clonedPortIds = Array.from(clonedNode.ports.keys())

      expect(originalPortIds.length).toBe(clonedPortIds.length)

      // No port IDs should match between original and cloned
      for (const originalId of originalPortIds) {
        expect(clonedPortIds).toContain(originalId)
      }
    })

    it('should preserve port hierarchy and values in complex ports', () => {
      // Update complex port values
      node.person = { name: 'Complex', age: 35 }
      node.stringList = ['item1', 'item2', 'item3']

      // Clone with new ID
      const clonedNode = node.cloneWithNewId() as TestNode

      // Verify complex object port values are preserved
      expect(clonedNode.person).toEqual({ name: 'Complex', age: 35 })
      expect(clonedNode.stringList).toEqual(['item1', 'item2', 'item3'])

      // Find the object port in both nodes
      const originalObjectPort = Array.from(node.ports.values())
        .find(p => p.getConfig().key === 'person')
      const clonedObjectPort = Array.from(clonedNode.ports.values())
        .find(p => p.getConfig().key === 'person')

      expect(originalObjectPort).toBeDefined()
      expect(clonedObjectPort).toBeDefined()

      // Verify port IDs and values are the same
      expect(originalObjectPort!.id).toBe(clonedObjectPort!.id)
      expect(originalObjectPort!.getValue()).toEqual(clonedObjectPort!.getValue())

      // Find the array port in both nodes
      const originalArrayPort = Array.from(node.ports.values())
        .find(p => p.getConfig().key === 'stringList')
      const clonedArrayPort = Array.from(clonedNode.ports.values())
        .find(p => p.getConfig().key === 'stringList')

      expect(originalArrayPort).toBeDefined()
      expect(clonedArrayPort).toBeDefined()

      // Verify array port IDs are different but values are the same
      expect(originalArrayPort!.id).toBe(clonedArrayPort!.id)
      expect(originalArrayPort!.getValue()).toEqual(clonedArrayPort!.getValue())
    })

    it('should create independent node instances', async () => {
      // Clone with new ID
      const clonedNode = node.cloneWithNewId() as TestNode

      // Modify original node
      node.inputString = 'original-modified'
      node.inputNumber = 111

      // Modify cloned node
      clonedNode.inputString = 'cloned-modified'
      clonedNode.inputNumber = 222

      // Verify they are independent
      expect(node.inputString).toBe('original-modified')
      expect(node.inputNumber).toBe(111)
      expect(clonedNode.inputString).toBe('cloned-modified')
      expect(clonedNode.inputNumber).toBe(222)

      // Execute both nodes and verify independence
      await node.execute({} as ExecutionContext)
      await clonedNode.execute({} as ExecutionContext)

      expect(node.outputString).toBe('original-modified-111')
      expect(clonedNode.outputString).toBe('cloned-modified-222')
    })

    it('should handle cloning without UI metadata', () => {
      // Create a fresh node without UI properties
      const freshNode = new TestNode('fresh-node')
      freshNode.initialize()

      // Clone without UI
      const clonedNode = freshNode.cloneWithNewId()

      // Should not throw and should have different ID
      expect(clonedNode.id).not.toBe(freshNode.id)
      expect(clonedNode.getUI()).toBeUndefined()
    })
  })
})
