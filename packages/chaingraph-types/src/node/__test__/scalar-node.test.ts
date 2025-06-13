/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { PortPluginRegistry } from '@badaitech/chaingraph-types'
import superjson from 'superjson'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  ArrayPortPlugin,
  BaseNode,
  createBooleanValue,
  createNumberValue,
  createStringValue,
  EnumPortPlugin,
  Input,
  Node,
  NodeRegistry,
  NumberPortPlugin,
  ObjectPortPlugin,
  Port,
  StreamPortPlugin,
  StringPortPlugin,
} from '../..'

PortPluginRegistry.getInstance().register(StringPortPlugin)
PortPluginRegistry.getInstance().register(NumberPortPlugin)
PortPluginRegistry.getInstance().register(ArrayPortPlugin)
PortPluginRegistry.getInstance().register(ObjectPortPlugin)
PortPluginRegistry.getInstance().register(EnumPortPlugin)
PortPluginRegistry.getInstance().register(StreamPortPlugin)

@Node({
  type: 'ScalarNode',
  title: 'Scalar Node',
  description: 'Node with scalar ports',
})
class ScalarNode extends BaseNode {
  @Input()
  @Port({
    type: 'string' as const,
    defaultValue: createStringValue('default string'),
    minLength: 1,
    maxLength: 100,
  })
  strInput: string = 'default string'

  @Input()
  @Port({
    type: 'number' as const,
    defaultValue: createNumberValue(42),
    min: 0,
    max: 100,
    integer: true,
  })
  numInput: number = 42

  @Input()
  @Port({
    type: 'boolean' as const,
    defaultValue: createBooleanValue(true),
  })
  boolInput: boolean = true

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {}
  }
}

describe('scalar node serialization', () => {
  beforeAll(() => {
    // Register ports from the new system
    // registerAllPorts()

    // registerNodeTransformers(NodeRegistry.getInstance())
    PortPluginRegistry.getInstance().register(StringPortPlugin)
    PortPluginRegistry.getInstance().register(NumberPortPlugin)
    PortPluginRegistry.getInstance().register(ArrayPortPlugin)
    PortPluginRegistry.getInstance().register(ObjectPortPlugin)
    PortPluginRegistry.getInstance().register(EnumPortPlugin)
    PortPluginRegistry.getInstance().register(StreamPortPlugin)
  })

  afterAll(() => {
    NodeRegistry.getInstance().clear()
  })

  it('serializes and deserializes a node with scalar ports', async () => {
    const scalarNode = new ScalarNode('scalar-node')
    await scalarNode.initialize()

    const json = superjson.serialize(scalarNode)
    const parsed = superjson.deserialize(json) as ScalarNode

    expect(parsed).toBeDefined()
    expect(parsed.metadata).toEqual(scalarNode.metadata)
    expect(parsed.status).toEqual(scalarNode.status)

    // Verify port values
    expect(parsed.strInput).toBe('default string')
    expect(parsed.numInput).toBe(42)
    expect(parsed.boolInput).toBe(true)
  })
})
