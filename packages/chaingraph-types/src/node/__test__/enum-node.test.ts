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

enum Color {
  Red = 'Red',
  Green = 'Green',
  Blue = 'Blue',
}

@Node({
  title: 'Enum Node',
  description: 'Node with an enum port',
})
class EnumNode extends BaseNode {
  @Input()
  @Port({
    type: PortType.Enum,
    options: [
      {
        id: Color.Red,
        type: PortType.String,
        title: 'Red',
        defaultValue: Color.Red,
      },
      {
        id: Color.Green,
        type: PortType.String,
        title: 'Green',
        defaultValue: Color.Green,
      },
      {
        id: Color.Blue,
        type: PortType.String,
        title: 'Blue',
        defaultValue: Color.Blue,
      },
    ],
    defaultValue: Color.Red,
  })
  favoriteColor: Color = Color.Red

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

describe('enum node serialization', () => {
  beforeAll(() => {
    // Register all port types
    registerAllPorts()
    registerNodeTransformers()
  })

  afterAll(() => {
    NodeRegistry.getInstance().clear()
  })

  it('serializes and deserializes a node with an enum port', async () => {
    const enumNode = new EnumNode('enum-node')
    await enumNode.initialize()

    const json = superjson.serialize(enumNode)
    const parsed = superjson.deserialize(json as any as SuperJSONResult) as EnumNode

    expect(parsed).toBeDefined()
    expect(parsed.metadata).toEqual(enumNode.metadata)
    expect(parsed.status).toEqual(enumNode.status)
  })
})
