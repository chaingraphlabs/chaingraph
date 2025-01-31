import type { ExecutionContext, NodeExecutionResult } from '@chaingraph/types'
import type { SuperJSONResult } from 'superjson/dist/types'
import { BaseNode, Input, Node, NodeRegistry } from '@chaingraph/types'
import { Port } from '@chaingraph/types/node'
import { registerNodeTransformers } from '@chaingraph/types/node/json-transformers'
import { NodeExecutionStatus } from '@chaingraph/types/node/node-enums'
import { PortType } from '@chaingraph/types/port.new'
import { registerAllPorts } from '@chaingraph/types/port.new/registry/register-ports'

import superjson from 'superjson'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import 'reflect-metadata'

@Node({
  title: 'Scalar Node',
  description: 'Node with scalar ports',
})
class ScalarNode extends BaseNode {
  @Input()
  @Port({
    type: PortType.String,
    defaultValue: 'default string',
    validation: {
      minLength: 1,
      maxLength: 100,
    },
  })
  strInput: string = 'default string'

  @Input()
  @Port({
    type: PortType.Number,
    defaultValue: 42,
    validation: {
      min: 0,
      max: 100,
      integer: true,
    },
  })
  numInput: number = 42

  @Input()
  @Port({
    type: PortType.Boolean,
    defaultValue: true,
  })
  boolInput: boolean = true

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

describe('scalar node serialization', () => {
  beforeAll(() => {
    // Register ports from the new system
    registerAllPorts()
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

    // Verify port values
    expect(parsed.strInput).toBe('default string')
    expect(parsed.numInput).toBe(42)
    expect(parsed.boolInput).toBe(true)
  })
})
