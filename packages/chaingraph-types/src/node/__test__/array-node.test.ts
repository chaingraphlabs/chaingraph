import type { ExecutionContext, NodeExecutionResult } from '@chaingraph/types'
import type { SuperJSONResult } from 'superjson/dist/types'
import { BaseNode, Input, Node, PortArray, PortKindEnum, registerPortTransformers } from '@chaingraph/types'
import { registerNodeTransformers } from '@chaingraph/types/node/json-transformers'
import { ExecutionStatus, NodeCategory } from '@chaingraph/types/node/node-enums'
import Decimal from 'decimal.js'
import superjson from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'
import 'reflect-metadata'

@Node({
  title: 'Array Node',
  category: NodeCategory.Custom,
  description: 'Node with an array port',
})
class ArrayNode extends BaseNode {
  @Input()
  @PortArray({
    defaultValue: [],
    elementConfig: {
      kind: PortKindEnum.Number,
      defaultValue: 0,
    },
  })
  numArray: Decimal[] = [new Decimal(1), new Decimal(2), new Decimal(3)]

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: ExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

describe('array node serialization', () => {
  beforeAll(() => {
    registerPortTransformers()
    registerNodeTransformers()
  })
  it('serializes and deserializes a node with an array port', async () => {
    const arrayNode = new ArrayNode('array-node')
    await arrayNode.initialize()

    expect(arrayNode.getPort('numArray')).toBeDefined()
    expect(arrayNode.getPort('numArray')?.getValue()).toEqual([new Decimal(1), new Decimal(2), new Decimal(3)])

    const json = superjson.serialize(arrayNode)
    const parsed = superjson.deserialize(json as any as SuperJSONResult)

    expect(parsed).toBeDefined()
    expect(parsed).toEqual(arrayNode)
  })
})
