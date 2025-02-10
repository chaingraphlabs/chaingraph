/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { NODE_CATEGORIES } from '@badaitech/chaingraph-nodes'
import {
  type ExecutionContext,
  Input,
  type NodeExecutionResult,
  Output,
  String,
} from '@badaitech/chaingraph-types'
import { BaseNode } from '@badaitech/chaingraph-types/node/base-node'
import { findPort, traversePorts } from '@badaitech/chaingraph-types/node/traverse-ports'
import {
  ArrayPortPlugin,
  EnumPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  StreamPortPlugin,
} from '@badaitech/chaingraph-types/port/plugins'
import { AnyPortPlugin } from '@badaitech/chaingraph-types/port/plugins/AnyPortPlugin'
import {
  createStringValue,
  StringPortPlugin,
} from '@badaitech/chaingraph-types/port/plugins/StringPortPlugin'
import { portRegistry } from '@badaitech/chaingraph-types/port/registry'
import { beforeAll, describe, expect, it } from 'vitest'
import { Node } from '../node.decorator'
import { Port } from '../port.decorator'
import 'reflect-metadata'

interface InnerObjectSchema {
  foo: string
  bar: number
}

interface ObjectSchema {
  hello: string
  world: string
  inner: InnerObjectSchema
}

// DummyNode class decorated with our new @Node and @Port decorators.
// The dummyPort property uses a configuration of type "string" with defaultValue "hello".
@Node({
  title: 'Dummy Node',
  description: 'A dummy node for testing port initialization',
})
class DummyNode extends BaseNode {
  @Port({
    type: 'string',
  })
  public dummyPort?: string = 'test'

  @Port({
    type: 'object',
    schema: {
      properties: {
        hello: {
          type: 'string',
        },
        world: {
          type: 'string',
        },
        inner: {
          type: 'object',
          schema: {
            properties: {
              foo: {
                type: 'string',
              },
              bar: {
                type: 'number',
              },
            },
          },
        },
      },
    },
  })
  testObject: ObjectSchema = {
    hello: 'hello',
    world: 'world',
    inner: {
      foo: 'foo',
      bar: 42,
    },
  }

  @Port({
    type: 'array',
    itemConfig: { type: 'string' },
  })
  public helloArray: string[] = ['hello', 'world']

  // For the sake of this test, execute is a stub.
  async execute(): Promise<any> {
    return Promise.resolve({})
  }
}

describe('port Initialization Test', () => {
  beforeAll(() => {
    portRegistry.register(StringPortPlugin)
    portRegistry.register(NumberPortPlugin)
    portRegistry.register(AnyPortPlugin)
    portRegistry.register(StreamPortPlugin)
    portRegistry.register(ArrayPortPlugin)
    portRegistry.register(ObjectPortPlugin)
    portRegistry.register(EnumPortPlugin)
  })

  it('should initialize ports on node initialization', () => {
    // Create an instance of the dummy node.
    const node = new DummyNode('node1')

    // Call initialize() which calls processNodePorts internally.
    node.initialize()

    const ports = node.ports
    expect(ports).toBeDefined()

    const dummyPortInstance = findPort(node, port => port.getConfig().key === 'dummyPort')
    expect(dummyPortInstance).toBeDefined()

    const val = node.dummyPort

    expect(node.dummyPort).toBeDefined()
    expect(val).toBe('test')

    // Verify that port default value equals createStringValue('hello')
    expect(dummyPortInstance?.getValue()).toStrictEqual(createStringValue('test'))

    node.dummyPort = 'world'
    expect(node.dummyPort).toBe('world')
    expect(dummyPortInstance?.getValue()).toStrictEqual(createStringValue('world'))

    // check if all ports are initialized
    const expectedPortsKeys = ['dummyPort', 'testObject', 'hello', 'world', 'inner', 'foo', 'bar', 'helloArray']
    const actualPortsKeys: string[] = []
    traversePorts(node, (port) => {
      actualPortsKeys.push(port.getConfig().key!)
    })

    expect(actualPortsKeys).toStrictEqual(expectedPortsKeys)

    // object asserts
    const testObjectPortInstance = findPort(
      node,
      port => port.getConfig().key === 'testObject',
    )
    expect(testObjectPortInstance).toBeDefined()

    expect(node.testObject).toBeDefined()
    expect(node.testObject).toStrictEqual({
      hello: 'hello',
      world: 'world',
      inner: {
        foo: 'foo',
        bar: 42,
      },
    })

    node.testObject.hello = 'hi'
    expect(node.testObject.hello).toBe('hi')
    expect(testObjectPortInstance?.getValue()).toStrictEqual({
      hello: 'hi',
      world: 'world',
      inner: {
        foo: 'foo',
        bar: 42,
      },
    })
    expect(testObjectPortInstance?.getConfig().defaultValue.hello).toStrictEqual('hello')

    // mutate inner object
    node.testObject.inner.foo = 'bar'
    expect(node.testObject.inner.foo).toBe('bar')
    expect(testObjectPortInstance?.getValue()).toStrictEqual({
      hello: 'hi',
      world: 'world',
      inner: {
        foo: 'bar',
        bar: 42,
      },
    })

    // mutate full inner object
    node.testObject.inner = { foo: 'baz', bar: 24 }
    expect(node.testObject.inner).toEqual({ foo: 'baz', bar: 24 })
    expect(testObjectPortInstance?.getValue()).toStrictEqual({
      hello: 'hi',
      world: 'world',
      inner: {
        foo: 'baz',
        bar: 24,
      },
    })

    // change array key
    const helloArrayPortInstance = findPort(node, port => port.getConfig().key === 'helloArray')
    expect(helloArrayPortInstance).toBeDefined()
    expect(node.helloArray).toStrictEqual(['hello', 'world'])

    node.helloArray = ['foo', 'bar']
    expect(node.helloArray).toStrictEqual(['foo', 'bar'])
    expect(helloArrayPortInstance?.getValue()).toStrictEqual(['foo', 'bar'])

    // change array first element
    node.helloArray[0] = 'baz'
    expect(node.helloArray).toStrictEqual(['baz', 'bar'])
    expect(helloArrayPortInstance?.getValue()).toStrictEqual(['baz', 'bar'])

    // push to array
    node.helloArray.push('test')
    expect(node.helloArray).toStrictEqual(['baz', 'bar', 'test'])
    expect(helloArrayPortInstance?.getValue()).toStrictEqual(['baz', 'bar', 'test'])

    // pop from array
    node.helloArray.pop()
    expect(node.helloArray).toStrictEqual(['baz', 'bar'])
    expect(helloArrayPortInstance?.getValue()).toStrictEqual(['baz', 'bar'])

    const serializedNode = node.serialize()

    const deserializedNode = new DummyNode('node1')
    deserializedNode.deserialize(serializedNode)

    expect(deserializedNode).toBeDefined()
    expect(deserializedNode).toBeInstanceOf(DummyNode)
    expect(deserializedNode).toEqual(node)
  })

  it('should deserialize from json', () => {
    @Node({
      title: 'Create Message',
      description: 'Creates a new message with specified content',
      category: NODE_CATEGORIES.MESSAGING,
      tags: ['message', 'create', 'content'],
    })
    class CreateMessageNode extends BaseNode {
      @Input()
      @String({
        title: 'Content',
        description: 'Message content to be sent',
      })
      content: string = ''

      @Output()
      @String({
        title: 'Message',
        description: 'Created message object',
      })
      message: string = ''

      async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
        return {}
      }
    }

    const nodeJson = {
      id: 'CreateMessageNode:0194ed3f-6b90-7279-8395-e148f3341251',
      metadata: {
        type: 'CreateMessageNode',
        portsConfig: {
          content: {
            type: 'string',
            title: 'Content',
            description: 'Message content to be sent',
            key: 'content',
            direction: 'input',
            id: '0194ed3f-6b92-7546-a928-6818beedd325',
            defaultValue: '',
            nodeId: 'CreateMessageNode:0194ed3f-6b90-7279-8395-e148f3341251',
          },
          message: {
            type: 'string',
            title: 'Message',
            description: 'Created message object',
            key: 'message',
            direction: 'output',
            id: '0194ed3f-6b92-7546-a928-6e5ac320270c',
            defaultValue: '',
            nodeId: 'CreateMessageNode:0194ed3f-6b90-7279-8395-e148f3341251',
          },
        },
        title: 'Create Message',
        description: 'Creates a new message with specified content',
        category: 'messaging',
        tags: [
          'message',
          'create',
          'content',
        ],
        version: 1,
        ui: {
          position: {
            x: 1470,
            y: 1080,
          },
        },
      },
      status: 'initialized',
      ports_values: {
        '0194ed3f-6b92-7546-a928-6818beedd325': '',
        '0194ed3f-6b92-7546-a928-6e5ac320270c': '',
      },
    }

    const node = new CreateMessageNode('CreateMessageNode:0194ed3f-6b90-7279-8395-e148f3341251')
    node.deserialize(nodeJson)
  })
})
