/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { SerializedEdge } from '../../edge'
import type { ExecutionContext } from '../../execution'
import type { INode, NodeExecutionResult, NodeMetadata } from '../../node'
import type { ExecutionEventData } from '../execution-events'
import SuperJSON from 'superjson'
import { beforeAll, describe, expect, it } from 'vitest'
import { Input, Node, Output, PortNumber, PortString } from '../../decorator'
import { EdgeStatus } from '../../edge'
import { BaseNode, NodeStatus, registerNodeTransformers } from '../../node'
import {
  ArrayPortPlugin,
  EnumPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  PortPluginRegistry,
  StreamPortPlugin,
  StringPortPlugin,
} from '../../port'
import { ExecutionEventEnum, ExecutionEventImpl } from '../execution-events'
import { Flow } from '../flow'
import { registerFlowTransformers } from '../json-transformers'

// Register all port plugins
PortPluginRegistry.getInstance().register(StringPortPlugin)
PortPluginRegistry.getInstance().register(NumberPortPlugin)
PortPluginRegistry.getInstance().register(ArrayPortPlugin)
PortPluginRegistry.getInstance().register(ObjectPortPlugin)
PortPluginRegistry.getInstance().register(EnumPortPlugin)
PortPluginRegistry.getInstance().register(StreamPortPlugin)

// Test node for creating fixtures
const testNodeMetadata: NodeMetadata = {
  id: 'test-node',
  type: 'TestNode',
  title: 'Test Node',
}

@Node(testNodeMetadata)
class TestNode extends BaseNode {
  @Input()
  @PortString()
  inputString: string = 'test'

  @Input()
  @PortNumber()
  inputNumber: number = 42

  @Output()
  @PortString()
  outputString: string = ''

  @Output()
  @PortNumber()
  outputNumber: number = 0

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    this.outputString = this.inputString
    this.outputNumber = this.inputNumber
    return {}
  }
}

/**
 * Helper function to create a test node
 */
function createTestNode(id: string): INode {
  const node = new TestNode(id)
  node.initialize()
  return node
}

/**
 * Helper function to create a test flow
 */
async function createTestFlow(name: string): Promise<Flow> {
  const flow = new Flow({ name, description: 'Test flow for serialization' })
  return flow
}

/**
 * Helper function to create a serialized edge
 */
function createSerializedEdge(
  id: string,
  sourceNodeId: string,
  sourcePortId: string,
  targetNodeId: string,
  targetPortId: string,
): SerializedEdge {
  return {
    id,
    sourceNodeId,
    sourcePortId,
    targetNodeId,
    targetPortId,
    status: EdgeStatus.Active,
    metadata: { label: 'Test Edge' },
  }
}

/**
 * Helper to get typed event data after asserting the event type
 */
function getEventData<T extends ExecutionEventEnum>(
  event: ExecutionEventImpl,
  expectedType: T,
): ExecutionEventData[T] {
  assertEventType(event, expectedType)
  return event.data
}

function assertEventType<T extends ExecutionEventEnum>(
  event: ExecutionEventImpl,
  expectedType: T,
): asserts event is ExecutionEventImpl<T> {
  if (event.type !== expectedType) {
    throw new Error(`Expected event type ${expectedType}, but got ${event.type}`)
  }
}

describe('executionEventImpl Comprehensive Serialization Tests', () => {
  beforeAll(() => {
    registerNodeTransformers()
    registerFlowTransformers()
  })

  describe('basic Serialization/Deserialization', () => {
    it('should serialize and deserialize using serialize() and deserializeStatic() methods', () => {
      const node = createTestNode('node-1')
      node.setStatus(NodeStatus.Completed)

      const event = new ExecutionEventImpl(
        0,
        ExecutionEventEnum.NODE_COMPLETED,
        new Date('2025-01-01T00:00:00.000Z'),
        {
          node: node.clone(),
          executionTime: 123,
        },
      )

      // Serialize using the serialize() method (as used in production)
      const serialized = event.serialize()

      // Deserialize using deserializeStatic() (as used in production Kafka consumer)
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      expect(deserialized).toBeInstanceOf(ExecutionEventImpl)
      expect(deserialized.index).toBe(event.index)
      expect(deserialized.type).toBe(event.type)
      expect(deserialized.timestamp).toEqual(event.timestamp)
      const eventData = getEventData(deserialized, ExecutionEventEnum.NODE_COMPLETED)
      expect(eventData.executionTime).toBe(123)
      expect(eventData.node).toBeDefined()
      expect(eventData.node.id).toBe('node-1')
    })

    it('should handle serialize() followed by JSON.stringify and JSON.parse', () => {
      const node = createTestNode('node-2')

      const clonedNode = node.clone()
      // Explicitly set status after clone to ensure it's defined for serialization
      clonedNode.setStatus(NodeStatus.Pending)

      const event = new ExecutionEventImpl(
        5,
        ExecutionEventEnum.NODE_STARTED,
        new Date('2025-01-15T12:30:00.000Z'),
        {
          node: clonedNode,
        },
      )

      // Simulate Kafka flow: serialize -> JSON.stringify -> JSON.parse -> deserializeStatic
      const serialized = event.serialize()
      const jsonString = JSON.stringify(serialized)
      const parsed = JSON.parse(jsonString)
      const deserialized = ExecutionEventImpl.deserializeStatic(parsed)

      expect(deserialized).toBeInstanceOf(ExecutionEventImpl)
      expect(deserialized.index).toBe(5)
      expect(deserialized.timestamp).toEqual(new Date('2025-01-15T12:30:00.000Z'))
      const eventData = getEventData(deserialized, ExecutionEventEnum.NODE_STARTED)
      expect(eventData.node).toBeDefined()
      expect(eventData.node.id).toBe('node-2')
    })

    it('should handle SuperJSON.serialize and SuperJSON.deserialize on the entire event', () => {
      const node = createTestNode('node-3')
      const event = new ExecutionEventImpl(
        10,
        ExecutionEventEnum.NODE_STARTED,
        new Date('2025-02-01T00:00:00.000Z'),
        {
          node: node.clone(),
        },
      )

      // Alternative approach: use SuperJSON directly on the entire event
      const serialized = SuperJSON.serialize(event)
      const deserialized = SuperJSON.deserialize<ExecutionEventImpl>(serialized)

      expect(deserialized).toBeInstanceOf(ExecutionEventImpl)
      expect(deserialized.index).toBe(10)
      expect(deserialized.timestamp).toEqual(event.timestamp)
      const eventData = getEventData(deserialized, ExecutionEventEnum.NODE_STARTED)
      expect(eventData.node).toBeDefined()
      expect(eventData.node.id).toBe('node-3')
    })
  })

  describe('node Events', () => {
    it('should serialize NODE_STARTED event', () => {
      const node = createTestNode('node-start')
      const event = new ExecutionEventImpl(
        1,
        ExecutionEventEnum.NODE_STARTED,
        new Date('2025-01-01T10:00:00.000Z'),
        { node: node.clone() },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.NODE_STARTED)
      expect(eventData.node).toBeDefined()
      expect(eventData.node.id).toBe('node-start')
    })

    it('should serialize NODE_COMPLETED event with execution time', () => {
      const node = createTestNode('node-complete')
      node.setStatus(NodeStatus.Completed)

      const event = new ExecutionEventImpl(
        2,
        ExecutionEventEnum.NODE_COMPLETED,
        new Date('2025-01-01T10:05:00.000Z'),
        {
          node: node.clone(),
          executionTime: 5000,
        },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.NODE_COMPLETED)
      expect(eventData.node.id).toBe('node-complete')
      expect(eventData.executionTime).toBe(5000)
    })

    it('should serialize NODE_FAILED event with error', () => {
      const node = createTestNode('node-fail')
      node.setStatus(NodeStatus.Error)

      const clonedNode = node.clone()
      clonedNode.setStatus(NodeStatus.Error)

      const testError = new Error('Test error message')
      const event = new ExecutionEventImpl(
        3,
        ExecutionEventEnum.NODE_FAILED,
        new Date('2025-01-01T10:10:00.000Z'),
        {
          node: clonedNode,
          error: testError,
          executionTime: 100,
        },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.NODE_FAILED)
      expect(eventData.node.id).toBe('node-fail')
      expect(eventData.executionTime).toBe(100)
      expect(eventData.error).toBeDefined()
      expect(eventData.error.message).toBe('Test error message')
    })

    it('should serialize NODE_SKIPPED event', () => {
      const event = new ExecutionEventImpl(
        4,
        ExecutionEventEnum.NODE_SKIPPED,
        new Date('2025-01-01T10:15:00.000Z'),
        {
          nodeId: 'node-skip',
          reason: 'Condition not met',
        },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.NODE_SKIPPED)
      expect(eventData.nodeId).toBe('node-skip')
      expect(eventData.reason).toBe('Condition not met')
    })

    it('should serialize NODE_STATUS_CHANGED event', () => {
      const event = new ExecutionEventImpl(
        5,
        ExecutionEventEnum.NODE_STATUS_CHANGED,
        new Date('2025-01-01T10:20:00.000Z'),
        {
          nodeId: 'node-status',
          oldStatus: NodeStatus.Pending,
          newStatus: NodeStatus.Executing,
        },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.NODE_STATUS_CHANGED)
      expect(eventData.nodeId).toBe('node-status')
      expect(eventData.oldStatus).toBe(NodeStatus.Pending)
      expect(eventData.newStatus).toBe(NodeStatus.Executing)
    })

    it('should serialize NODE_DEBUG_LOG_STRING event', () => {
      const event = new ExecutionEventImpl(
        6,
        ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
        new Date('2025-01-01T10:25:00.000Z'),
        {
          nodeId: 'node-debug',
          log: 'Debug log message',
        },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.NODE_DEBUG_LOG_STRING)
      expect(eventData.nodeId).toBe('node-debug')
      expect(eventData.log).toBe('Debug log message')
    })

  })

  describe('flow Events', () => {
    it('should serialize FLOW_STARTED event', async () => {
      const flow = await createTestFlow('Test Flow')
      const node = createTestNode('node-1')
      await flow.addNode(node)

      const event = new ExecutionEventImpl(
        1,
        ExecutionEventEnum.FLOW_STARTED,
        new Date('2025-01-01T00:00:00.000Z'),
        { flowMetadata: flow.metadata },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.FLOW_STARTED)
      expect(eventData.flowMetadata).toBeDefined()
      expect(eventData.flowMetadata.name).toBe('Test Flow')
    })

    it('should serialize FLOW_COMPLETED event', async () => {
      const flow = await createTestFlow('Completed Flow')

      const event = new ExecutionEventImpl(
        2,
        ExecutionEventEnum.FLOW_COMPLETED,
        new Date('2025-01-01T01:00:00.000Z'),
        {
          flowMetadata: flow.metadata,
          executionTime: 60000,
        },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.FLOW_COMPLETED)
      expect(eventData.flowMetadata.name).toBe('Completed Flow')
      expect(eventData.executionTime).toBe(60000)
    })

    it('should serialize FLOW_FAILED event', async () => {
      const flow = await createTestFlow('Failed Flow')
      const testError = new Error('Flow execution failed')

      const event = new ExecutionEventImpl(
        3,
        ExecutionEventEnum.FLOW_FAILED,
        new Date('2025-01-01T02:00:00.000Z'),
        {
          flowMetadata: flow.metadata,
          error: testError,
          executionTime: 30000,
        },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.FLOW_FAILED)
      expect(eventData.flowMetadata.name).toBe('Failed Flow')
      expect(eventData.error).toBeDefined()
      expect(eventData.error.message).toBe('Flow execution failed')
      expect(eventData.executionTime).toBe(30000)
    })

    it('should serialize FLOW_CANCELLED event', async () => {
      const flow = await createTestFlow('Cancelled Flow')

      const event = new ExecutionEventImpl(
        4,
        ExecutionEventEnum.FLOW_CANCELLED,
        new Date('2025-01-01T03:00:00.000Z'),
        {
          flowMetadata: flow.metadata,
          reason: 'User cancelled',
          executionTime: 15000,
        },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.FLOW_CANCELLED)
      expect(eventData.flowMetadata.name).toBe('Cancelled Flow')
      expect(eventData.reason).toBe('User cancelled')
      expect(eventData.executionTime).toBe(15000)
    })

    it('should serialize FLOW_PAUSED event', async () => {
      const flow = await createTestFlow('Paused Flow')

      const event = new ExecutionEventImpl(
        5,
        ExecutionEventEnum.FLOW_PAUSED,
        new Date('2025-01-01T04:00:00.000Z'),
        {
          flowMetadata: flow.metadata,
          reason: 'Breakpoint hit',
        },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.FLOW_PAUSED)
      expect(eventData.flowMetadata.name).toBe('Paused Flow')
      expect(eventData.reason).toBe('Breakpoint hit')
    })

    it('should serialize FLOW_RESUMED event', async () => {
      const flow = await createTestFlow('Resumed Flow')

      const event = new ExecutionEventImpl(
        6,
        ExecutionEventEnum.FLOW_RESUMED,
        new Date('2025-01-01T05:00:00.000Z'),
        { flowMetadata: flow.metadata },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.FLOW_RESUMED)
      expect(eventData.flowMetadata.name).toBe('Resumed Flow')
    })

    it('should serialize FLOW_SUBSCRIBED event', async () => {
      const flow = await createTestFlow('Subscribed Flow')

      const event = new ExecutionEventImpl(
        0,
        ExecutionEventEnum.FLOW_SUBSCRIBED,
        new Date('2025-01-01T06:00:00.000Z'),
        { flowMetadata: flow.metadata },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.FLOW_SUBSCRIBED)
      expect(eventData.flowMetadata.name).toBe('Subscribed Flow')
    })
  })

  describe('edge Events', () => {
    it('should serialize EDGE_TRANSFER_STARTED event', () => {
      const serializedEdge = createSerializedEdge(
        'edge-1',
        'node-1',
        'output',
        'node-2',
        'input',
      )

      const event = new ExecutionEventImpl(
        1,
        ExecutionEventEnum.EDGE_TRANSFER_STARTED,
        new Date('2025-01-01T00:00:00.000Z'),
        { serializedEdge },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.EDGE_TRANSFER_STARTED)
      expect(eventData.serializedEdge).toBeDefined()
      expect(eventData.serializedEdge.id).toBe('edge-1')
      expect(eventData.serializedEdge.sourceNodeId).toBe('node-1')
      expect(eventData.serializedEdge.targetNodeId).toBe('node-2')
    })

    it('should serialize EDGE_TRANSFER_COMPLETED event', () => {
      const serializedEdge = createSerializedEdge(
        'edge-2',
        'node-3',
        'output',
        'node-4',
        'input',
      )

      const event = new ExecutionEventImpl(
        2,
        ExecutionEventEnum.EDGE_TRANSFER_COMPLETED,
        new Date('2025-01-01T01:00:00.000Z'),
        {
          serializedEdge,
          transferTime: 50,
        },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.EDGE_TRANSFER_COMPLETED)
      expect(eventData.serializedEdge.id).toBe('edge-2')
      expect(eventData.transferTime).toBe(50)
    })

    it('should serialize EDGE_TRANSFER_FAILED event', () => {
      const serializedEdge = createSerializedEdge(
        'edge-3',
        'node-5',
        'output',
        'node-6',
        'input',
      )
      const testError = new Error('Transfer failed')

      const event = new ExecutionEventImpl(
        3,
        ExecutionEventEnum.EDGE_TRANSFER_FAILED,
        new Date('2025-01-01T02:00:00.000Z'),
        {
          serializedEdge,
          error: testError,
        },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.EDGE_TRANSFER_FAILED)
      expect(eventData.serializedEdge.id).toBe('edge-3')
      expect(eventData.error).toBeDefined()
      expect(eventData.error.message).toBe('Transfer failed')
    })
  })

  describe('child Execution Events', () => {
    it('should serialize CHILD_EXECUTION_SPAWNED event', () => {
      const event = new ExecutionEventImpl(
        1,
        ExecutionEventEnum.CHILD_EXECUTION_SPAWNED,
        new Date('2025-01-01T00:00:00.000Z'),
        {
          parentExecutionId: 'parent-1',
          childExecutionId: 'child-1',
          rootExecutionId: 'root-1',
          eventName: 'spawn-event',
          eventData: { key: 'value', nested: { data: 123 } },
        },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.CHILD_EXECUTION_SPAWNED)
      expect(eventData.parentExecutionId).toBe('parent-1')
      expect(eventData.childExecutionId).toBe('child-1')
      expect(eventData.rootExecutionId).toBe('root-1')
      expect(eventData.eventName).toBe('spawn-event')
      expect(eventData.eventData).toEqual({ key: 'value', nested: { data: 123 } })
    })

    it('should serialize CHILD_EXECUTION_COMPLETED event', () => {
      const event = new ExecutionEventImpl(
        2,
        ExecutionEventEnum.CHILD_EXECUTION_COMPLETED,
        new Date('2025-01-01T01:00:00.000Z'),
        {
          parentExecutionId: 'parent-2',
          childExecutionId: 'child-2',
          eventName: 'complete-event',
        },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.CHILD_EXECUTION_COMPLETED)
      expect(eventData.parentExecutionId).toBe('parent-2')
      expect(eventData.childExecutionId).toBe('child-2')
      expect(eventData.eventName).toBe('complete-event')
    })

    it('should serialize CHILD_EXECUTION_FAILED event', () => {
      const testError = new Error('Child execution failed')
      const event = new ExecutionEventImpl(
        3,
        ExecutionEventEnum.CHILD_EXECUTION_FAILED,
        new Date('2025-01-01T02:00:00.000Z'),
        {
          parentExecutionId: 'parent-3',
          childExecutionId: 'child-3',
          eventName: 'fail-event',
          error: testError,
        },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.CHILD_EXECUTION_FAILED)
      expect(eventData.parentExecutionId).toBe('parent-3')
      expect(eventData.childExecutionId).toBe('child-3')
      expect(eventData.eventName).toBe('fail-event')
      expect(eventData.error).toBeDefined()
      expect(eventData.error.message).toBe('Child execution failed')
    })
  })

  describe('debug Events', () => {
    it('should serialize DEBUG_BREAKPOINT_HIT event', () => {
      const node = createTestNode('debug-node')
      const event = new ExecutionEventImpl(
        1,
        ExecutionEventEnum.DEBUG_BREAKPOINT_HIT,
        new Date('2025-01-01T00:00:00.000Z'),
        { node: node.clone() },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.DEBUG_BREAKPOINT_HIT)
      expect(eventData.node).toBeDefined()
      expect(eventData.node.id).toBe('debug-node')
    })
  })

  describe('complex Node State Serialization', () => {
    it('should preserve node port values during serialization', () => {
      const node = new TestNode('complex-node')
      node.initialize()
      node.inputString = 'custom value'
      node.inputNumber = 999
      node.outputString = 'output value'
      node.outputNumber = 777

      const event = new ExecutionEventImpl(
        1,
        ExecutionEventEnum.NODE_COMPLETED,
        new Date(),
        {
          node: node.clone(),
          executionTime: 100,
        },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.NODE_COMPLETED)
      expect(eventData.node).toBeDefined()

      const nodeFromEvent = eventData.node as TestNode
      expect(nodeFromEvent.inputString).toBe('custom value')
      expect(nodeFromEvent.inputNumber).toBe(999)
      expect(nodeFromEvent.outputString).toBe('output value')
      expect(nodeFromEvent.outputNumber).toBe(777)
    })

    it('should preserve node status during serialization', () => {
      const node = createTestNode('status-node')
      node.setStatus(NodeStatus.Executing)

      const clonedNode = node.clone()
      // Note: Cloning doesn't preserve status, must set it explicitly
      // This documents the actual behavior and potential bug
      clonedNode.setStatus(NodeStatus.Executing)

      const event = new ExecutionEventImpl(
        1,
        ExecutionEventEnum.NODE_STARTED,
        new Date(),
        { node: clonedNode },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.NODE_STARTED)
      expect(eventData.node.status).toBe(NodeStatus.Executing)
    })
  })

  describe('edge Cases and Error Handling', () => {
    it('should handle events with null/undefined in metadata', async () => {
      const flow = await createTestFlow('Test Flow')
      flow.metadata.description = undefined
      flow.metadata.tags = undefined

      const event = new ExecutionEventImpl(
        1,
        ExecutionEventEnum.FLOW_STARTED,
        new Date(),
        { flowMetadata: flow.metadata },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.FLOW_STARTED)
      expect(eventData.flowMetadata.name).toBe('Test Flow')
      expect(eventData.flowMetadata.description).toBeUndefined()
      expect(eventData.flowMetadata.tags).toBeUndefined()
    })

    it('should handle very large execution times', () => {
      const node = createTestNode('large-time-node')
      const largeExecutionTime = Number.MAX_SAFE_INTEGER

      const clonedNode = node.clone()
      clonedNode.setStatus(NodeStatus.Completed)

      const event = new ExecutionEventImpl(
        1,
        ExecutionEventEnum.NODE_COMPLETED,
        new Date(),
        {
          node: clonedNode,
          executionTime: largeExecutionTime,
        },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.NODE_COMPLETED)
      expect(eventData.executionTime).toBe(largeExecutionTime)
    })

    it('should handle special characters in strings', () => {
      const specialString = 'Test with 🎉 emoji and "quotes" and \\backslashes\\ and \nnewlines'
      const event = new ExecutionEventImpl(
        1,
        ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
        new Date(),
        {
          nodeId: 'special-node',
          log: specialString,
        },
      )

      const serialized = event.serialize()
      const jsonString = JSON.stringify(serialized)
      const parsed = JSON.parse(jsonString)
      const deserialized = ExecutionEventImpl.deserializeStatic(parsed)

      const eventData = getEventData(deserialized, ExecutionEventEnum.NODE_DEBUG_LOG_STRING)
      expect(eventData.log).toBe(specialString)
    })

    it('should handle Date objects correctly in timestamps', () => {
      const specificDate = new Date('2025-12-31T23:59:59.999Z')
      const node = createTestNode('date-node')

      const event = new ExecutionEventImpl(
        1,
        ExecutionEventEnum.NODE_STARTED,
        specificDate,
        { node: node.clone() },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      expect(deserialized.timestamp).toEqual(specificDate)
      expect(deserialized.timestamp.getTime()).toBe(specificDate.getTime())
    })

    it('should handle complex Error objects', () => {
      const error = new Error('Complex error')
      error.stack = 'Error: Complex error\n  at test.ts:123\n  at async flow.ts:456'

      const node = createTestNode('error-node')
      node.setStatus(NodeStatus.Error)

      const clonedNode = node.clone()
      clonedNode.setStatus(NodeStatus.Error)

      const event = new ExecutionEventImpl(
        1,
        ExecutionEventEnum.NODE_FAILED,
        new Date(),
        {
          node: clonedNode,
          error,
          executionTime: 100,
        },
      )

      const serialized = event.serialize()
      const deserialized = ExecutionEventImpl.deserializeStatic(serialized)

      const eventData = getEventData(deserialized, ExecutionEventEnum.NODE_FAILED)
      expect(eventData.error).toBeDefined()
      expect(eventData.error.message).toBe('Complex error')
      // Note: Stack trace preservation depends on SuperJSON configuration
      expect(eventData.error).toBeInstanceOf(Error)
    })
  })

  describe('production-like scenarios', () => {
    it('should handle the full Kafka serialization pipeline', () => {
      // Simulate the full Kafka event bus flow
      const node = createTestNode('kafka-node')
      node.setStatus(NodeStatus.Completed)

      const originalEvent = new ExecutionEventImpl(
        42,
        ExecutionEventEnum.NODE_COMPLETED,
        new Date('2025-03-15T10:30:45.123Z'),
        {
          node: node.clone(),
          executionTime: 1234,
        },
      )

      // Step 1: Serialize using event.serialize() (as in event-producer.ts line 77)
      const eventDataSerialized = originalEvent.serialize()

      // Step 2: Wrap in message structure and stringify (as in KafkaEventBus)
      const messageWrapper = {
        executionId: 'exec-123',
        timestamp: Date.now(),
        workerId: 'worker-1',
        event: eventDataSerialized,
      }
      const jsonString = JSON.stringify(messageWrapper)

      // Step 3: Parse (as Kafka consumer receives)
      const parsed = JSON.parse(jsonString)

      // Step 4: Deserialize event (as in KafkaEventBus.ts line 382)
      const deserializedEvent = ExecutionEventImpl.deserializeStatic(parsed.event)

      // Verify the round trip
      expect(deserializedEvent).toBeInstanceOf(ExecutionEventImpl)
      expect(deserializedEvent.index).toBe(42)
      expect(deserializedEvent.timestamp).toEqual(new Date('2025-03-15T10:30:45.123Z'))

      const eventData = getEventData(deserializedEvent, ExecutionEventEnum.NODE_COMPLETED)
      expect(eventData.executionTime).toBe(1234)
      expect(eventData.node).toBeDefined()
      expect(eventData.node.id).toBe('kafka-node')
      expect(eventData.node.status).toBe(NodeStatus.Completed)
    })

    it('should handle batch processing of multiple events', () => {
      const events = [
        new ExecutionEventImpl(
          0,
          ExecutionEventEnum.FLOW_STARTED,
          new Date(),
          { flowMetadata: { name: 'Test', createdAt: new Date(), updatedAt: new Date() } },
        ),
        new ExecutionEventImpl(
          1,
          ExecutionEventEnum.NODE_STARTED,
          new Date(),
          { node: createTestNode('node-1') },
        ),
        new ExecutionEventImpl(
          2,
          ExecutionEventEnum.NODE_COMPLETED,
          new Date(),
          { node: createTestNode('node-1'), executionTime: 100 },
        ),
        new ExecutionEventImpl(
          3,
          ExecutionEventEnum.FLOW_COMPLETED,
          new Date(),
          { flowMetadata: { name: 'Test', createdAt: new Date(), updatedAt: new Date() }, executionTime: 200 },
        ),
      ]

      // Simulate batch serialization
      const serializedBatch = events.map(event => event.serialize())
      const jsonBatch = JSON.stringify(serializedBatch)
      const parsedBatch = JSON.parse(jsonBatch)
      const deserializedBatch = parsedBatch.map((item: unknown) =>
        ExecutionEventImpl.deserializeStatic(item),
      )

      expect(deserializedBatch).toHaveLength(4)
      expect(deserializedBatch[0].type).toBe(ExecutionEventEnum.FLOW_STARTED)
      expect(deserializedBatch[1].type).toBe(ExecutionEventEnum.NODE_STARTED)
      expect(deserializedBatch[2].type).toBe(ExecutionEventEnum.NODE_COMPLETED)
      expect(deserializedBatch[3].type).toBe(ExecutionEventEnum.FLOW_COMPLETED)
    })
  })

  describe('type safety and validation', () => {
    it('should throw error when deserializing invalid data', () => {
      expect(() => {
        ExecutionEventImpl.deserializeStatic('invalid')
      }).toThrow('Invalid serialized ExecutionEvent')
    })

    it('should throw error when deserializing null', () => {
      expect(() => {
        ExecutionEventImpl.deserializeStatic(null)
      }).toThrow('Invalid serialized ExecutionEvent')
    })

    it('should handle missing timestamp field by creating Invalid Date', () => {
      const invalidData = {
        index: 1,
        type: ExecutionEventEnum.NODE_STARTED,
        // missing timestamp
        data: SuperJSON.serialize({}),
      }

      // When timestamp is missing, new Date(undefined) creates Invalid Date
      const deserialized = ExecutionEventImpl.deserializeStatic(invalidData)

      expect(deserialized).toBeInstanceOf(ExecutionEventImpl)
      expect(deserialized.index).toBe(1)
      expect(deserialized.type).toBe(ExecutionEventEnum.NODE_STARTED)
      // Invalid Date behavior
      expect(Number.isNaN(deserialized.timestamp.getTime())).toBe(true)
    })
  })
})
