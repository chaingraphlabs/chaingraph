import type { ExecutionContext, NodeExecutionResult } from '@chaingraph/types'
import type { SuperJSONResult } from 'superjson/dist/types'
import { BaseNode, Input, Node, NodeRegistry, PortArray, PortKind, PortNumber, PortObject, PortObjectSchema, PortString, registerPortTransformers } from '@chaingraph/types'
import { registerNodeTransformers } from '@chaingraph/types/node/json-transformers'
import { ExecutionStatus } from '@chaingraph/types/node/node-enums'
import superjson from 'superjson'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import 'reflect-metadata'

@PortObjectSchema({
  description: 'Address schema',
})
class Address {
  @PortString()
  street: string = 'Main Street'

  @PortString()
  city: string = 'Anytown'

  @PortString()
  country: string = 'Country'
}

@PortObjectSchema({
  description: 'User schema',
})
class User {
  @PortString()
  username: string = 'user'

  @PortNumber()
  age: number = 30

  @PortObject({
    schema: Address,
  })
  address: Address = new Address()
}

@Node({
  title: 'Object Node',
  description: 'Node with an object port',
})
class ObjectNode extends BaseNode {
  @Input()
  @PortObject({
    schema: Address,
  })
  address: Address = new Address()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: ExecutionStatus.Completed,
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
  @PortObject({
    schema: User,
  })
  user: User = new User()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: ExecutionStatus.Completed,
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
  @PortArray({
    defaultValue: [],
    elementConfig: {
      kind: PortKind.Object,
      schema: User,
      defaultValue: new User(),
    },
  })
  userList: User[] = [new User(), new User()]

  @Input()
  @PortArray({
    elementConfig: {
      kind: PortKind.Array,
      defaultValue: [],
      elementConfig: {
        kind: PortKind.Number,
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
      status: ExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

describe('object node serialization', () => {
  beforeAll(() => {
    registerPortTransformers()
    registerNodeTransformers()
  })

  afterAll(() => {
    NodeRegistry.getInstance().clear()
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
