/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  AnyPort,
  ArrayPort,
  ArrayPortConfig,
  ExecutionContext,
  IPort,
  NodeExecutionResult,
  ObjectPortConfig,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Flow,
  Node,
  ObjectSchema,
  Passthrough,
  PortNumber,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'
import { describe, expect, it } from 'vitest'
import ArrayNode from '../array.node'

/**
 * Test object schema for user profile
 */
@ObjectSchema({
  description: 'Test User Profile Schema',
})
class TestUserProfile {
  @PortString({ defaultValue: 'Anonymous' })
  name: string = 'Anonymous'

  @PortNumber({ defaultValue: 18, min: 18 })
  age: number = 18
}

/**
 * Extended test object schema with additional field
 */
@ObjectSchema({
  description: 'Extended Test User Profile Schema',
})
class ExtendedTestUserProfile {
  @PortString({ defaultValue: 'Anonymous' })
  name: string = 'Anonymous'

  @PortNumber({ defaultValue: 18, min: 18 })
  age: number = 18

  @PortString({ defaultValue: 'user@example.com' })
  email: string = 'user@example.com'
}

/**
 * Test ObjectNode similar to the basic-values object node but with custom schema
 */
@Node({
  type: 'TestObjectNode',
  title: 'Test Object Node',
  description: 'A test node that outputs an object with configurable schema',
})
class TestObjectNode extends BaseNode {
  @Passthrough()
  @PortObject({
    title: 'Test Object',
    description: 'The output test object.',
    schema: TestUserProfile,
    isSchemaMutable: true,
    ui: {
      keyDeletable: true,
      hideEditor: false,
    },
  })
  public object: TestUserProfile = new TestUserProfile()

  async execute(_context: ExecutionContext): Promise<NodeExecutionResult> {
    return {}
  }
}

/**
 * Test ObjectNode with extended schema
 */
@Node({
  type: 'ExtendedTestObjectNode',
  title: 'Extended Test Object Node',
  description: 'A test node that outputs an object with extended schema',
})
class ExtendedTestObjectNode extends BaseNode {
  @Passthrough()
  @PortObject({
    title: 'Extended Test Object',
    description: 'The output extended test object.',
    schema: ExtendedTestUserProfile,
    isSchemaMutable: true,
    ui: {
      keyDeletable: true,
      hideEditor: false,
    },
  })
  public object: ExtendedTestUserProfile = new ExtendedTestUserProfile()

  async execute(_context: ExecutionContext): Promise<NodeExecutionResult> {
    return {}
  }
}

/**
 * Helper to create and initialize a node
 */
function createNode<T extends BaseNode>(NodeClass: new (id: string, metadata: any) => T, id: string): T {
  const node = new NodeClass(id, { type: 'test' })
  node.initialize()
  return node
}

describe('arrayNode Schema Update', () => {
  it('should update existing array items when item schema changes', async () => {
    const flow = new Flow()

    // Create nodes
    const objectNode = createNode(TestObjectNode, 'objectNode')
    const arrayNode = createNode(ArrayNode, 'arrayNode')

    // Add nodes to flow
    await flow.addNode(objectNode)
    await flow.addNode(arrayNode)

    // Get ports for connection
    const objectOutputPort = objectNode.findPortByKey('object')!
    const arrayItemSchemaPort = arrayNode.findPortByKey('itemSchema')! as AnyPort
    const arrayPort = arrayNode.findPortByKey('array')! as ArrayPort

    // Verify initial state - array should have 'any' item config
    expect(arrayPort.getConfig().itemConfig.type).toBe('any')

    // Connect object output to array itemSchema input
    await flow.connectPorts(objectNode.id, objectOutputPort.id, arrayNode.id, arrayItemSchemaPort.id)

    // After connection, array should adopt object schema
    const arrayConfig = arrayPort.getConfig() as ArrayPortConfig<ObjectPortConfig>
    expect(arrayConfig.itemConfig.type).toBe('object')
    expect((arrayConfig.itemConfig as ObjectPortConfig).schema?.properties).toBeDefined()
    expect(Object.keys((arrayConfig.itemConfig as ObjectPortConfig).schema?.properties || {})).toContain('name')
    expect(Object.keys((arrayConfig.itemConfig as ObjectPortConfig).schema?.properties || {})).toContain('age')

    // Add some items to the array with initial schema structure
    const initialItem1 = { name: 'Alice', age: 25 }
    const initialItem2 = { name: 'Bob', age: 30 }

    arrayNode.appendArrayItem(arrayPort as IPort, initialItem1)
    arrayNode.appendArrayItem(arrayPort as IPort, initialItem2)

    // Verify array has items with correct structure
    const arrayValue = arrayPort.getValue()
    expect(arrayValue).toHaveLength(2)
    expect(arrayValue![0]).toEqual(initialItem1)
    expect(arrayValue![1]).toEqual(initialItem2)

    // Verify child ports were created for the initial schema
    const childPorts = arrayNode.getChildPorts(arrayPort as IPort)
    expect(childPorts).toHaveLength(2) // Two array items

    // Find the first item's child ports
    const firstItemPort = childPorts.find(p => p.getConfig().key === '0')
    expect(firstItemPort).toBeDefined()

    const firstItemChildPorts = arrayNode.getChildPorts(firstItemPort!)
    expect(firstItemChildPorts).toHaveLength(2) // name and age ports

    const namePort = firstItemChildPorts.find(p => p.getConfig().key === 'name')
    const agePort = firstItemChildPorts.find(p => p.getConfig().key === 'age')
    expect(namePort).toBeDefined()
    expect(agePort).toBeDefined()

    // Now simulate schema change by connecting to extended object node
    const extendedObjectNode = createNode(ExtendedTestObjectNode, 'extendedObjectNode')
    await flow.addNode(extendedObjectNode)

    const extendedObjectOutputPort = extendedObjectNode.findPortByKey('object')!

    // Disconnect the original connection and connect to extended schema
    await flow.disconnectPorts(objectNode.id, objectOutputPort.id, arrayNode.id, arrayItemSchemaPort.id)
    await flow.connectPorts(extendedObjectNode.id, extendedObjectOutputPort.id, arrayNode.id, arrayItemSchemaPort.id)

    // Verify the array item config was updated to include the new field
    const updatedArrayConfig = arrayPort.getConfig()
    expect((updatedArrayConfig.itemConfig as ObjectPortConfig).type).toBe('object')
    expect((updatedArrayConfig.itemConfig as ObjectPortConfig).schema?.properties).toBeDefined()

    const updatedProperties = Object.keys((updatedArrayConfig.itemConfig as ObjectPortConfig).schema?.properties || {})
    expect(updatedProperties).toContain('name')
    expect(updatedProperties).toContain('age')
    expect(updatedProperties).toContain('email') // New field should be added

    // Verify existing array items were updated with the new schema
    const updatedArrayValue = arrayPort.getValue()
    expect(updatedArrayValue).toHaveLength(2)

    // Existing data should be preserved
    expect(updatedArrayValue![0].name).toBe('Alice')
    expect(updatedArrayValue![0].age).toBe(25)
    expect(updatedArrayValue![1].name).toBe('Bob')
    expect(updatedArrayValue![1].age).toBe(30)

    // New field should be added with default value
    expect(updatedArrayValue![0].email).toBe('user@example.com')
    expect(updatedArrayValue![1].email).toBe('user@example.com')

    // Verify child ports were recreated with new schema
    const updatedChildPorts = arrayNode.getChildPorts(arrayPort as IPort)
    expect(updatedChildPorts).toHaveLength(2) // Still two array items

    const updatedFirstItemPort = updatedChildPorts.find(p => p.getConfig().key === '0')
    expect(updatedFirstItemPort).toBeDefined()

    const updatedFirstItemChildPorts = arrayNode.getChildPorts(updatedFirstItemPort!)
    expect(updatedFirstItemChildPorts).toHaveLength(3) // name, age, and email ports

    const updatedNamePort = updatedFirstItemChildPorts.find(p => p.getConfig().key === 'name')
    const updatedAgePort = updatedFirstItemChildPorts.find(p => p.getConfig().key === 'age')
    const emailPort = updatedFirstItemChildPorts.find(p => p.getConfig().key === 'email')

    expect(updatedNamePort).toBeDefined()
    expect(updatedAgePort).toBeDefined()
    expect(emailPort).toBeDefined()

    // Verify port values match the updated array values
    expect(updatedNamePort!.getValue()).toBe('Alice')
    expect(updatedAgePort!.getValue()).toBe(25)
    expect(emailPort!.getValue()).toBe('user@example.com')
  })

  it('should handle empty arrays when schema changes', async () => {
    const flow = new Flow()

    const objectNode = createNode(TestObjectNode, 'objectNode')
    const arrayNode = createNode(ArrayNode, 'arrayNode')

    await flow.addNode(objectNode)
    await flow.addNode(arrayNode)

    const objectOutputPort = objectNode.findPortByKey('object')!
    const arrayItemSchemaPort = arrayNode.findPortByKey('itemSchema')! as AnyPort
    const arrayPort = arrayNode.findPortByKey('array')! as ArrayPort

    // Connect nodes (this should update schema even with empty array)
    await flow.connectPorts(objectNode.id, objectOutputPort.id, arrayNode.id, arrayItemSchemaPort.id)

    // Verify schema was updated even with empty array
    const arrayConfig = arrayPort.getConfig()
    expect(arrayConfig.itemConfig.type).toBe('object')
    expect(Object.keys((arrayConfig.itemConfig as ObjectPortConfig).schema?.properties || {})).toContain('name')
    expect(Object.keys((arrayConfig.itemConfig as ObjectPortConfig).schema?.properties || {})).toContain('age')

    // Array should still be empty
    expect(arrayPort.getValue()).toEqual([])
    expect(arrayNode.getChildPorts(arrayPort as IPort)).toHaveLength(0)
  })

  it('should preserve compatible values and reset incompatible ones', async () => {
    const flow = new Flow()

    const arrayNode = createNode(ArrayNode, 'arrayNode')
    await flow.addNode(arrayNode)

    const arrayItemSchemaPort = arrayNode.findPortByKey('itemSchema')! as AnyPort
    const arrayPort = arrayNode.findPortByKey('array')! as ArrayPort

    // Manually set array items with mixed data types
    const mixedItems = [
      { name: 'Alice', age: 25 }, // Compatible object
      'just a string', // Incompatible with object schema
      { name: 'Bob' }, // Partially compatible (missing age)
      null, // Null value
    ]

    // Set array value directly
    arrayPort.setValue(mixedItems)

    // Now connect to object schema
    const objectNode = createNode(TestObjectNode, 'objectNode')
    await flow.addNode(objectNode)

    const objectOutputPort = objectNode.findPortByKey('object')!
    await flow.connectPorts(objectNode.id, objectOutputPort.id, arrayNode.id, arrayItemSchemaPort.id)

    // Verify items were properly merged with schema
    const updatedArrayValue = arrayPort.getValue()
    expect(updatedArrayValue).toHaveLength(4)

    // First item: compatible object should preserve existing values and add defaults for missing fields
    expect(updatedArrayValue![0]).toEqual({ name: 'Alice', age: 25 })

    // Second item: incompatible string should become object with defaults
    expect(updatedArrayValue![1]).toEqual({ name: 'Anonymous', age: 18 })

    // Third item: partial object should preserve existing values and add defaults
    expect(updatedArrayValue![2]).toEqual({ name: 'Bob', age: 18 })

    // Fourth item: null should become object with defaults
    expect(updatedArrayValue![3]).toEqual({ name: 'Anonymous', age: 18 })
  })

  it('should reset array items when schema types are incompatible', async () => {
    const flow = new Flow()

    const arrayNode = createNode(ArrayNode, 'arrayNode')
    await flow.addNode(arrayNode)

    const arrayItemSchemaPort = arrayNode.findPortByKey('itemSchema')! as AnyPort
    const arrayPort = arrayNode.findPortByKey('array')! as ArrayPort

    // First connect to object schema and add items
    const objectNode = createNode(TestObjectNode, 'objectNode')
    await flow.addNode(objectNode)

    const objectOutputPort = objectNode.findPortByKey('object')!
    await flow.connectPorts(objectNode.id, objectOutputPort.id, arrayNode.id, arrayItemSchemaPort.id)

    // Add object items
    arrayNode.appendArrayItem(arrayPort as IPort, { name: 'Alice', age: 25 })
    arrayNode.appendArrayItem(arrayPort as IPort, { name: 'Bob', age: 30 })

    expect(arrayPort.getValue()).toHaveLength(2)

    // Now disconnect and connect to a completely different schema type (simulate connecting to a string port)
    await flow.disconnectPorts(objectNode.id, objectOutputPort.id, arrayNode.id, arrayItemSchemaPort.id)

    // Manually set the itemSchema to string type (simulating connection to a string port)
    arrayItemSchemaPort.setUnderlyingType({
      type: 'string',
      defaultValue: 'default',
      title: 'String Type',
    })

    // Trigger the port update
    await arrayNode.updatePort(arrayItemSchemaPort as IPort)

    // Verify that array items were cleared due to incompatible type change
    const finalArrayValue = arrayPort.getValue()
    // The array should be empty since the types are incompatible (object -> string)
    expect(finalArrayValue).toEqual([])

    // Verify the schema was updated to string
    const finalConfig = arrayPort.getConfig()
    expect(finalConfig.itemConfig.type).toBe('string')
  })
})
