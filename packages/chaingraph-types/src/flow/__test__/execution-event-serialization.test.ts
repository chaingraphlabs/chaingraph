import type { NodeExecutionResult, NodeMetadata } from '@chaingraph/types/node/types'
import {
  Flow,
  Input,
  Node,
  NodeExecutionStatus,
  PortString,
  registerNodeTransformers,
  registerPortTransformers,
} from '@chaingraph/types'
import { ExecutionContext } from '@chaingraph/types/flow/execution-context'
import { ExecutionEventEnum, ExecutionEventImpl } from '@chaingraph/types/flow/execution-events'
import { registerFlowTransformers } from '@chaingraph/types/flow/json-transformers'
import { BaseNode } from '@chaingraph/types/node/base-node'
import { NodeStatus } from '@chaingraph/types/node/node-enums'
import superjson from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'

describe('executionEventImpl Serialization', () => {
  beforeAll(() => {
    // Register the necessary transformers
    registerPortTransformers()
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
      executionContext, // context
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
    expect(deserialized.context.executionId).toBe(event.context.executionId)
    expect(deserialized.context.flowId).toBe(event.context.flowId)
    // expect(deserialized.data.node.id).toBe(event.data.node.id)
    // expect(deserialized.data.executionTime).toBe(event.data.executionTime)
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
      @PortString()
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
      executionContext, // context
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
    expect(deserialized.context.executionId).toBe(event.context.executionId)
    expect(deserialized.context.flowId).toBe(event.context.flowId)
    // expect(deserialized.context.startTime).toEqual(event.context.startTime)

    // Verify the flow
    // expect(deserialized.data.flow.id).toBe(flow.id)
    // expect(deserialized.data.flow.metadata.name).toBe(flow.metadata.name)

    // Verify the node inside the flow
    // const deserializedNode = deserialized.data.flow.nodes.get('node-1')
    // expect(deserializedNode).toBeDefined()
    // expect(deserializedNode?.metadata).toEqual(mockNode.metadata)
    // expect(deserializedNode).toBeInstanceOf(MockNode)
  })
})
