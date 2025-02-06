import type { ExecutionContext, NodeExecutionResult } from '@chaingraph/types'
import type { SuperJSONResult } from 'superjson/dist/types'
import { BaseNode, NodeRegistry } from '@chaingraph/types'
import { registerNodeTransformers } from '@chaingraph/types/node/json-transformers'

import { NodeExecutionStatus } from '@chaingraph/types/node/node-enums'
import {
  ArrayPortPlugin,
  createBooleanValue,
  createNumberValue,
  createStringValue,
  EnumPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  StreamPortPlugin,
  StringPortPlugin,
} from '@chaingraph/types/port/plugins'
import { portRegistry } from '@chaingraph/types/port/registry'
import superjson from 'superjson'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Input, Node } from '../decorator-new'
import { Port } from '../decorator-new/port.decorator'
import 'reflect-metadata'

portRegistry.register(StringPortPlugin)
portRegistry.register(NumberPortPlugin)
portRegistry.register(ArrayPortPlugin)
portRegistry.register(ObjectPortPlugin)
portRegistry.register(EnumPortPlugin)
portRegistry.register(StreamPortPlugin)

@Node({
  title: 'Scalar Node',
  description: 'Node with scalar ports',
})
class ScalarNode extends BaseNode {
  @Input()
  @Port({
    type: 'string',
    defaultValue: createStringValue('default string'),
    minLength: 1,
    maxLength: 100,
  })
  strInput: string = 'default string'

  @Input()
  @Port({
    type: 'number',
    defaultValue: createNumberValue(42),
    min: 0,
    max: 100,
    integer: true,
  })
  numInput: number = 42

  @Input()
  @Port({
    type: 'boolean',
    defaultValue: createBooleanValue(true),
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
    // registerAllPorts()
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
