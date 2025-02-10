/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import {
  ArrayPortPlugin,
  BaseNode,
  createNumberValue,
  EnumPortPlugin,
  findPort,
  Input,
  Node,
  NodeExecutionStatus,
  NumberPortPlugin,
  ObjectPortPlugin,
  Port,
  portRegistry,
  registerNodeTransformers,
  StreamPortPlugin,
  StringPortPlugin,
} from '@badaitech/chaingraph-types'
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
    const parsed = superjson.deserialize(json) as ArrayNode

    expect(parsed).toBeDefined()
    expect(parsed.numArray).toEqual(arrayNode.numArray)
    expect(parsed.metadata).toEqual(arrayNode.metadata)
    expect(parsed.status).toEqual(arrayNode.status)
  })
})
