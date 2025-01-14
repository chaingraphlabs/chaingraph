import type { ExecutionContext, NodeExecutionResult } from '@chaingraph/types'
import type { SuperJSONResult } from 'superjson/dist/types'
import { BaseNode, Input, Node, PortBoolean, PortNumber, PortString, registerPortTransformers } from '@chaingraph/types'
import { registerNodeTransformers } from '@chaingraph/types/node/json-transformers'
import { ExecutionStatus, NodeCategory } from '@chaingraph/types/node/node-enums'
import superjson from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'
import 'reflect-metadata'

@Node({
  title: 'Scalar Node',
  category: NodeCategory.Custom,
  description: 'Node with scalar ports',
})
class ScalarNode extends BaseNode {
  @Input()
  @PortString()
  strInput: string = 'default string'

  @Input()
  @PortNumber()
  numInput: number = 42

  @Input()
  @PortBoolean()
  boolInput: boolean = true

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: ExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

describe('scalar node serialization', () => {
  beforeAll(() => {
    registerPortTransformers()
    registerNodeTransformers()
  })
  it('serializes and deserializes a node with scalar ports', async () => {
    const scalarNode = new ScalarNode('scalar-node')
    await scalarNode.initialize()

    const json = superjson.serialize(scalarNode)
    const parsed = superjson.deserialize(json as any as SuperJSONResult)

    expect(parsed).toBeDefined()
    expect(parsed).toEqual(scalarNode)
  })
})
