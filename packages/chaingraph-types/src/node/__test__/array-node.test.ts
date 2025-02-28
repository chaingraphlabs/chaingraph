/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../../execution'
import type { NodeExecutionResult } from '../types'
import superjson from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'
import { Input, Node, Port } from '../../decorator'
import { ArrayPortPlugin, createNumberValue, EnumPortPlugin, NumberPortPlugin, ObjectPortPlugin, PortPluginRegistry, StreamPortPlugin, StringPortPlugin } from '../../port'
import { BaseNode } from '../base-node'
import { registerNodeTransformers } from '../json-transformers'
import { NodeExecutionStatus } from '../node-enums'
import { findPort } from '../traverse-ports'
import 'reflect-metadata'

PortPluginRegistry.getInstance().register(StringPortPlugin)
PortPluginRegistry.getInstance().register(NumberPortPlugin)
PortPluginRegistry.getInstance().register(ArrayPortPlugin)
PortPluginRegistry.getInstance().register(ObjectPortPlugin)
PortPluginRegistry.getInstance().register(EnumPortPlugin)
PortPluginRegistry.getInstance().register(StreamPortPlugin)

@Node({
  title: 'Array Node',
  description: 'Node with an array port',
})
class ArrayNode extends BaseNode {
  @Input()
  @Port({
    type: 'array' as const,
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
