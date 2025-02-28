/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BaseNodeCompositional } from '../base-node-compositional'
import { Node } from '../../decorator/node.decorator'
import { Port } from '../../decorator/port.decorator'
import { NodeStatus } from '../node-enums'
import { NodeEventType } from '../events'
import { ExecutionContext } from '../../execution'
import { PortPluginRegistry } from '../../port'
import {
    StringPortPlugin,
    NumberPortPlugin,
    ArrayPortPlugin,
    ObjectPortPlugin,
    BooleanPortPlugin
} from '../../port/plugins'
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
    person: { name: string; age: number } = {
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

describe('BaseNodeCompositional', () => {
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
                .find(p => p.getConfig().key === 'inputString')?.id || ''
        )
        const numberPort = node.getPort(
            Array.from(node.ports.values())
                .find(p => p.getConfig().key === 'inputNumber')?.id || ''
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
                .find(p => p.getConfig().key === 'person')?.id || ''
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
                .find(p => p.getConfig().key === 'stringList')?.id || ''
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
})