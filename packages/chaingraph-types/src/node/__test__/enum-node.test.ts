import type { ExecutionContext, NodeExecutionResult } from '@chaingraph/types'
import type { SuperJSONResult } from 'superjson/dist/types'
import { BaseNode, Input, Node, NodeRegistry, PortEnumFromNative, registerPortTransformers } from '@chaingraph/types'
import { registerNodeTransformers } from '@chaingraph/types/node/json-transformers'
import { ExecutionStatus, NodeCategory } from '@chaingraph/types/node/node-enums'
import superjson from 'superjson'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import 'reflect-metadata'

enum Color {
  Red = 'Red',
  Green = 'Green',
  Blue = 'Blue',
}

@Node({
  title: 'Enum Node',
  category: NodeCategory.Custom,
  description: 'Node with an enum port',
})
class EnumNode extends BaseNode {
  @Input()
  @PortEnumFromNative(Color)
  favoriteColor: Color = Color.Red

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: ExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

describe('enum node serialization', () => {
  beforeAll(() => {
    registerPortTransformers()
    registerNodeTransformers()
  })

  afterAll(() => {
    NodeRegistry.getInstance().clear()
  })

  it('serializes and deserializes a node with an enum port', async () => {
    const enumNode = new EnumNode('enum-node')
    await enumNode.initialize()

    const json = superjson.serialize(enumNode)
    const parsed = superjson.deserialize(json as any as SuperJSONResult)

    expect(parsed).toBeDefined()
    expect(parsed).toEqual(enumNode)
  })
})
