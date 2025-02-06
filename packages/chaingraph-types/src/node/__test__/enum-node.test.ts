import type { ExecutionContext, NodeExecutionResult } from '@chaingraph/types'
import type { SuperJSONResult } from 'superjson/dist/types'
import { BaseNode, Input, Node } from '@chaingraph/types'
import { Port } from '@chaingraph/types/node'
import { registerNodeTransformers } from '@chaingraph/types/node/json-transformers'
import { NodeExecutionStatus } from '@chaingraph/types/node/node-enums'

import { findPort } from '@chaingraph/types/node/traverse-ports'
import {
  ArrayPortPlugin,
  EnumPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
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
    type: 'enum',
    options: [
      {
        id: Color.Red,
        type: 'string',
        title: 'Red',
        defaultValue: Color.Red,
      },
      {
        id: Color.Green,
        type: 'string',
        title: 'Green',
        defaultValue: Color.Green,
      },
      {
        id: Color.Blue,
        type: 'string',
        title: 'Blue',
        defaultValue: Color.Blue,
      },
    ],
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
    registerNodeTransformers()
  })

  it('serializes and deserializes a node with an enum port', async () => {
    const enumNode = new EnumNode('enum-node')
    await enumNode.initialize()

    const json = superjson.serialize(enumNode)
    const parsed = superjson.deserialize(json as any as SuperJSONResult) as EnumNode

    expect(parsed).toBeDefined()
    expect(parsed.metadata).toEqual(enumNode.metadata)
    expect(parsed.status).toEqual(enumNode.status)

    const colorPort = findPort(enumNode, port => port.getConfig().key === 'favoriteColor')
    enumNode.favoriteColor = Color.Green
    expect(colorPort?.getValue()).toBe(Color.Green)

    try {
      // @ts-expect-error invalid value test
      enumNode.favoriteColor = 'invalid'
    } catch (e: any) {
      expect(e.message).toBe('Value validation failed in setValue.')
    }
  })
})
