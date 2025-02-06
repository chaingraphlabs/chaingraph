import type { ExecutionContext, NodeExecutionResult } from '@chaingraph/types'
import type { SuperJSONResult } from 'superjson/dist/types'
import { BaseNode, Input, Node } from '@chaingraph/types'
import { Port } from '@chaingraph/types/node'
import { registerNodeTransformers } from '@chaingraph/types/node/json-transformers'
import { NodeExecutionStatus } from '@chaingraph/types/node/node-enums'
import {
  ArrayPortPlugin,
  EnumPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  StreamPortPlugin,
  StringPortPlugin,
} from '@chaingraph/types/port-new/plugins'
import { portRegistry } from '@chaingraph/types/port-new/registry'
import superjson from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'
import 'reflect-metadata'

portRegistry.register(StringPortPlugin)
portRegistry.register(NumberPortPlugin)
portRegistry.register(ArrayPortPlugin)
portRegistry.register(ObjectPortPlugin)
portRegistry.register(EnumPortPlugin)
portRegistry.register(StreamPortPlugin)

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
  title: 'Object Node',
  description: 'Node with an object port',
})
class ObjectNode extends BaseNode {
  @Input()
  @Port({
    type: 'object',
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
    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

@Node({
  title: 'Nested Object Node',
  description: 'Node with nested object ports',
})
class NestedObjectNode extends BaseNode {
  @Input()
  @Port({
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
  })
  user: User = new User()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

@Node({
  title: 'Complex Node',
  description: 'Node with nested arrays and objects',
})
class ComplexNode extends BaseNode {
  @Input()
  @Port({
    type: 'array',
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
    type: 'array',
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
    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

describe('object node serialization', () => {
  beforeAll(() => {
    // Register all port types
    registerNodeTransformers()
  })

  it('serializes and deserializes a node with an object port', async () => {
    const objectNode = new ObjectNode('object-node')
    await objectNode.initialize()

    const json = superjson.serialize(objectNode)
    const parsed = superjson.deserialize(json as any as SuperJSONResult) as ObjectNode

    expect(parsed).toBeDefined()
    expect(parsed.metadata).toEqual(objectNode.metadata)
    expect(parsed.status).toEqual(objectNode.status)
  })

  it('serializes and deserializes a node with nested object ports', async () => {
    const nestedObjectNode = new NestedObjectNode('nested-object-node')
    await nestedObjectNode.initialize()

    const json = superjson.serialize(nestedObjectNode)
    const parsed = superjson.deserialize(json as any as SuperJSONResult) as NestedObjectNode

    expect(parsed).toBeDefined()
    expect(parsed.metadata).toEqual(nestedObjectNode.metadata)
    expect(parsed.status).toEqual(nestedObjectNode.status)
  })

  it('serializes and deserializes a node with nested arrays and objects', async () => {
    const complexNode = new ComplexNode('complex-node')
    await complexNode.initialize()

    const json = superjson.serialize(complexNode)
    const parsed = superjson.deserialize(json as any as SuperJSONResult) as ComplexNode

    expect(parsed).toBeDefined()
    expect(parsed.metadata).toEqual(complexNode.metadata)
    expect(parsed.status).toEqual(complexNode.status)
  })
})
