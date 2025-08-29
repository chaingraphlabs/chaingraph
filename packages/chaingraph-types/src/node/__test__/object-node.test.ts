/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../../execution'
import type { NodeExecutionResult } from '../types'
import superjson from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'
import { Input, Node, Port } from '../../decorator'
import {
  ArrayPortPlugin,
  EnumPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  PortPluginRegistry,
  StreamPortPlugin,
  StringPortPlugin,
} from '../../port'
import { BaseNode } from '../base-node'
import { registerNodeTransformers } from '../json-transformers'
import 'reflect-metadata'

PortPluginRegistry.getInstance().register(StringPortPlugin)
PortPluginRegistry.getInstance().register(NumberPortPlugin)
PortPluginRegistry.getInstance().register(ArrayPortPlugin)
PortPluginRegistry.getInstance().register(ObjectPortPlugin)
PortPluginRegistry.getInstance().register(EnumPortPlugin)
PortPluginRegistry.getInstance().register(StreamPortPlugin)

class Address implements Record<string, unknown> {
  [key: string]: unknown;

  street: string = 'Main Street'
  city: string = 'Anytown'
  country: string = 'Country'
}

class User implements Record<string, unknown> {
  [key: string]: unknown;

  username: string = 'user'
  age: number = 30
  address: Address = new Address()
}

@Node({
  type: 'ObjectNode',
  title: 'Object Node',
  description: 'Node with an object port',
})
class ObjectNode extends BaseNode {
  @Input()
  @Port({
    type: 'object' as const,
    schema: {
      properties: {
        street: { type: 'string', defaultValue: 'Main Street' },
        city: { type: 'string', defaultValue: 'Anytown' },
        country: { type: 'string', defaultValue: 'Country' },
      },
    },
    defaultValue: new Address(),
  })
  address: Address = new Address()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {}
  }
}

@Node({
  type: 'NestedObjectNode',
  title: 'Nested Object Node',
  description: 'Node with nested object ports',
})
class NestedObjectNode extends BaseNode {
  @Input()
  @Port({
    type: 'object' as const,
    schema: {
      properties: {
        username: { type: 'string', defaultValue: 'user' },
        age: { type: 'number', defaultValue: 30 },
        address: {
          type: 'object',
          schema: {
            properties: {
              street: { type: 'string', defaultValue: 'Main Street' },
              city: { type: 'string', defaultValue: 'Anytown' },
              country: { type: 'string', defaultValue: 'Country' },
            },
          },
          defaultValue: new Address(),
        },
      },
    },
    defaultValue: new User(),
  })
  user: User = new User()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return { }
  }
}

@Node({
  type: 'ComplexNode',
  title: 'Complex Node',
  description: 'Node with nested arrays and objects',
})
class ComplexNode extends BaseNode {
  @Input()
  @Port({
    type: 'array' as const,
    defaultValue: [],
    itemConfig: {
      type: 'object',
      schema: {
        properties: {
          username: { type: 'string', defaultValue: 'user' },
          age: { type: 'number', defaultValue: 30 },
          address: {
            type: 'object',
            schema: {
              properties: {
                street: { type: 'string', defaultValue: 'Main Street' },
                city: { type: 'string', defaultValue: 'Anytown' },
                country: { type: 'string', defaultValue: 'Country' },
              },
            },
            defaultValue: new Address(),
          },
        },
      },
      defaultValue: new User(),
    },
  })
  userList: User[] = [new User(), new User()]

  @Input()
  @Port({
    type: 'array' as const,
    itemConfig: {
      type: 'array',
      defaultValue: [],
      itemConfig: {
        type: 'number',
        defaultValue: 0,
      },
    },
  })
  matrix: number[][] = [
    [1, 2],
    [3, 4],
  ]

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return { }
  }
}

describe('object node serialization', () => {
  beforeAll(() => {
    // Register all port types
    registerNodeTransformers()
  })

  it('serializes and deserializes a node with an object port', async () => {
    const objectNode = new ObjectNode('object-node')
    objectNode.initialize()

    const json = superjson.serialize(objectNode)
    const parsed = superjson.deserialize(json) as ObjectNode

    expect(parsed).toBeDefined()
    expect(parsed.metadata).toEqual(objectNode.metadata)
    expect(parsed.status).toEqual(objectNode.status)
  })

  it('serializes and deserializes a node with nested object ports', async () => {
    const nestedObjectNode = new NestedObjectNode('nested-object-node')
    nestedObjectNode.initialize()

    const json = superjson.serialize(nestedObjectNode)
    const parsed = superjson.deserialize(json) as NestedObjectNode

    expect(parsed).toBeDefined()
    expect(parsed.metadata).toEqual(nestedObjectNode.metadata)
    expect(parsed.status).toEqual(nestedObjectNode.status)
  })

  it('serializes and deserializes a node with nested arrays and objects', async () => {
    const complexNode = new ComplexNode('complex-node')
    complexNode.initialize()

    const json = superjson.serialize(complexNode)
    const parsed = superjson.deserialize(json) as ComplexNode

    expect(parsed).toBeDefined()
    expect(parsed.metadata).toEqual(complexNode.metadata)
    expect(parsed.status).toEqual(complexNode.status)
  })
})
