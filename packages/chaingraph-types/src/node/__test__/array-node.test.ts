import type { ExecutionContext, NodeExecutionResult } from '@chaingraph/types'
import type { SuperJSONResult } from 'superjson/dist/types'
import { BaseNode, Input, Node } from '@chaingraph/types'
import { Port } from '@chaingraph/types/node'
import { registerNodeTransformers } from '@chaingraph/types/node/json-transformers'
import { NodeExecutionStatus } from '@chaingraph/types/node/node-enums'
import { findPort } from '@chaingraph/types/node/traverse-ports'
import {
  ArrayPortPlugin,
  createNumberValue,
  EnumPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  StreamPortPlugin,
  StringPortPlugin,
} from '@chaingraph/types/port/plugins'
import { portRegistry } from '@chaingraph/types/port/registry'
import superjson from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'
import 'reflect-metadata'

portRegistry.register(StringPortPlugin)
portRegistry.register(NumberPortPlugin)
portRegistry.register(ArrayPortPlugin)
portRegistry.register(ObjectPortPlugin)
portRegistry.register(EnumPortPlugin)
portRegistry.register(StreamPortPlugin)

@Node({
  title: 'Array Node',
  description: 'Node with an array port',
})
class ArrayNode extends BaseNode {
  @Input()
  @Port({
    type: 'array',
    itemConfig: {
      type: 'number',
      defaultValue: createNumberValue(0),
    },
  })
  numArray: number[] = [1, 2, 3]

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

describe('array node serialization', () => {
  beforeAll(() => {
    // Register all port types
    // registerAllPorts()
    registerNodeTransformers()
  })

  it('serializes and deserializes a node with an array port', async () => {
    const arrayNode = new ArrayNode('array-node')
    await arrayNode.initialize()

    const numArrayPort = findPort(
      arrayNode,
      port => port.getConfig().key === 'numArray',
    )

    expect(numArrayPort).toBeDefined()
    expect(numArrayPort?.getValue()).toEqual([1, 2, 3])

    const json = superjson.serialize(arrayNode)
    const parsed = superjson.deserialize(json as any as SuperJSONResult) as ArrayNode

    expect(parsed).toBeDefined()
    expect(parsed.numArray).toEqual(arrayNode.numArray)
    expect(parsed.metadata).toEqual(arrayNode.metadata)
    expect(parsed.status).toEqual(arrayNode.status)
  })
})
