import type { ExecutionContext, NodeExecutionResult } from '@chaingraph/types'
import type { SuperJSONResult } from 'superjson/dist/types'
import { BaseNode, Input, Node, NodeRegistry, PortArray, PortKind, registerPortTransformers } from '@chaingraph/types'

import { registerNodeTransformers } from '@chaingraph/types/node/json-transformers'
import { ExecutionStatus } from '@chaingraph/types/node/node-enums'
import { findPort } from '@chaingraph/types/node/ports-traverser'
import Decimal from 'decimal.js'
import superjson from 'superjson'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import 'reflect-metadata'

@Node({
  title: 'Array Node',
  description: 'Node with an array port',
})
class ArrayNode extends BaseNode {
  @Input()
  @PortArray({
    defaultValue: [],
    elementConfig: {
      kind: PortKind.Number,
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

  afterAll(() => {
    NodeRegistry.getInstance().clear()
  })

  it('serializes and deserializes a node with an array port', async () => {
    const arrayNode = new ArrayNode('array-node')
    await arrayNode.initialize()

    const numArrayPort = await findPort(
      arrayNode,
      port => port.config.key === 'numArray',
    )

    expect(numArrayPort).toBeDefined()
    expect(numArrayPort?.getValue()).toEqual([new Decimal(1), new Decimal(2), new Decimal(3)])

    const json = superjson.serialize(arrayNode)
    const parsed = superjson.deserialize(json as any as SuperJSONResult) as ArrayNode

    expect(parsed).toBeDefined()
    expect(parsed.numArray).toEqual(arrayNode.numArray)
    expect(parsed.metadata).toEqual(arrayNode.metadata)
    expect(parsed.status).toEqual(arrayNode.status)
  })
})
