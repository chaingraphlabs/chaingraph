/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeExecutionResult, NodeMetadata } from '@badaitech/chaingraph-types/node/types'
import {
  Flow,
  Input,
  Node,
  NodeExecutionStatus,
  PortPluginRegistry,
  registerNodeTransformers,
  String,
} from '@badaitech/chaingraph-types'
import { ExecutionContext } from '@badaitech/chaingraph-types/execution/execution-context'
import {
  ExecutionEventEnum,
  ExecutionEventImpl,
} from '@badaitech/chaingraph-types/flow/execution-events'
import { registerFlowTransformers } from '@badaitech/chaingraph-types/flow/json-transformers'
import { BaseNode } from '@badaitech/chaingraph-types/node/base-node'
import { NodeStatus } from '@badaitech/chaingraph-types/node/node-enums'
import {
  ArrayPortPlugin,
  EnumPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  StreamPortPlugin,
  StringPortPlugin,
} from '@badaitech/chaingraph-types/port/plugins'
import superjson from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'

PortPluginRegistry.getInstance().register(StringPortPlugin)
PortPluginRegistry.getInstance().register(NumberPortPlugin)
PortPluginRegistry.getInstance().register(ArrayPortPlugin)
PortPluginRegistry.getInstance().register(ObjectPortPlugin)
PortPluginRegistry.getInstance().register(EnumPortPlugin)
PortPluginRegistry.getInstance().register(StreamPortPlugin)

describe('executionEventImpl Serialization', () => {
  beforeAll(() => {
    // Register the necessary transformers
    // registerPortTransformers()
    registerNodeTransformers()
    registerFlowTransformers()
  })

  it('should serialize and deserialize ExecutionEventImpl correctly', () => {
    // Create a mock node
    const mockNodeMetadata: NodeMetadata = {
      id: 'node-1',
      type: 'MockNode',
      title: 'Mock Node',
    }

    @Node(mockNodeMetadata)
    class MockNode extends BaseNode {
      async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
        return {
          status: NodeExecutionStatus.Completed,
          startTime: context.startTime,
          endTime: new Date(),
          outputs: new Map(),
        }
      }
    }

    const mockNode = new MockNode('node-1')
    mockNode.initialize()
    mockNode.setStatus(NodeStatus.Completed)

    // Create an ExecutionContext
    const flowId = 'test-flow-id'
    const abortController = new AbortController()
    const executionContext = new ExecutionContext(flowId, abortController)

    // Create example data for the event
    const data = {
      node: mockNode,
      executionTime: 123, // Example execution time
    }

    // Create an ExecutionEventImpl instance
    const event = new ExecutionEventImpl(
      0, // index
      ExecutionEventEnum.NODE_COMPLETED, // type
      new Date(), // timestamp
      data, // data
    )

    // Serialize the event
    const serialized = superjson.serialize(event)

    // Deserialize the event
    const deserialized = superjson.deserialize<ExecutionEventImpl>(serialized)

    // Verify that the deserialized object matches the original
    expect(deserialized).toBeInstanceOf(ExecutionEventImpl)
    expect(deserialized.index).toBe(event.index)
    expect(deserialized.type).toBe(event.type)
    expect(deserialized.timestamp).toEqual(event.timestamp)
  })

  it('should serialize and deserialize ExecutionEventImpl for FLOW_STARTED correctly', () => {
    // Create a mock node
    const mockNodeMetadata: NodeMetadata = {
      id: 'node-1',
      type: 'MockNode',
      title: 'Mock Node',
    }

    @Node(mockNodeMetadata)
    class MockNode extends BaseNode {
      @Input()
      @String()
      a: string = 'test'

      async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
        return {
          status: NodeExecutionStatus.Completed,
          startTime: context.startTime,
          endTime: new Date(),
          outputs: new Map(),
        }
      }
    }

    const mockNode = new MockNode('node-1')
    mockNode.initialize()
    mockNode.setStatus(NodeStatus.Completed)

    // Create a Flow and add the node to it
    const flow = new Flow({ name: 'Test Flow' })
    flow.addNode(mockNode)

    // Create an ExecutionContext
    const abortController = new AbortController()
    const executionContext = new ExecutionContext(flow.id, abortController)

    // Create example data for the event
    const data = {
      flow, // Include the flow in the event data
    }

    // Create an ExecutionEventImpl instance
    const event = new ExecutionEventImpl(
      1, // index
      ExecutionEventEnum.FLOW_STARTED, // type
      new Date(), // timestamp
      data, // data
    )

    // Serialize the event
    const serialized = superjson.serialize(event)

    // Deserialize the event
    const deserialized = superjson.deserialize<ExecutionEventImpl>(serialized)

    // Verify that the deserialized object matches the original
    expect(deserialized).toBeInstanceOf(ExecutionEventImpl)
    expect(deserialized.index).toBe(event.index)
    expect(deserialized.type).toBe(event.type)
    expect(deserialized.timestamp).toEqual(event.timestamp)
  })
})
