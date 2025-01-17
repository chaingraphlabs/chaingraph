import type { ExecutionContext, NodeExecutionResult } from '@chaingraph/types'
import type { SuperJSONResult } from 'superjson/dist/types'
import { BaseNode, Input, Node, NodeRegistry, PortBoolean, PortNumber, PortString, registerPortTransformers } from '@chaingraph/types'
import { registerNodeTransformers } from '@chaingraph/types/node/json-transformers'
import { ExecutionStatus } from '@chaingraph/types/node/node-enums'
import superjson from 'superjson'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import 'reflect-metadata'

@Node({
  title: 'Scalar Node',
  description: 'Node with scalar ports',
})
class ScalarNode extends BaseNode {
  @Input()
  @PortString({
    defaultValue: 'default string',
  })
  strInput: string = 'default string'

  @Input()
  @PortNumber({
    defaultValue: 42,
  })
  numInput: number = 42

  @Input()
  @PortBoolean({
    defaultValue: true,
  })
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

  afterAll(() => {
    NodeRegistry.getInstance().clear()
  })

  it('serializes and deserializes a node with scalar ports', async () => {
    const scalarNode = new ScalarNode('scalar-node')
    await scalarNode.initialize()

    const json = superjson.serialize(scalarNode)
    const parsed = superjson.deserialize(json as any as SuperJSONResult) as ScalarNode

    expect(parsed).toBeDefined()
    expect(parsed.metadata).toEqual(scalarNode.metadata)
    expect(parsed.status).toEqual(scalarNode.status)
  })
})
