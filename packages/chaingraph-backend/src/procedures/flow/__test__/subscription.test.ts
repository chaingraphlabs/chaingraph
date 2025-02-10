/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  NodeExecutionResult,
  NodeMetadata,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Boolean,
  FlowEventType,
  Id,
  Input,
  Node,
  NodeCatalog,
  NodeExecutionStatus,
  NodeRegistry,
  Number,
  Output,
  String,
} from '@badaitech/chaingraph-types'
import { beforeAll, describe, expect, it } from 'vitest'
import { createCaller } from '../../../router'
import { createTestContext } from '../../../test/utils/createTestContext'

@Node({
  title: 'Scalar Node',
  description: 'Node with scalar ports',
})
class ScalarNode extends BaseNode {
  @Input()
  @String({
    defaultValue: 'default string',
  })
  @Id('strInput')
  strInput: string = 'default string'

  @Input()
  @Number({
    defaultValue: 42,
  })
  @Id('numInput')
  numInput: number = 42

  @Input()
  @Boolean({
    defaultValue: true,
  })
  @Id('boolInput')
  boolInput: boolean = true

  @Id('strOutput')
  @String()
  @Output()
  strOutput: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

describe('flow Event Subscription', () => {
  beforeAll(() => {
    // NodeRegistry.getInstance().clear()
    NodeRegistry.getInstance().registerNode(ScalarNode)
  })

  // afterAll(() => {
  //   NodeRegistry.getInstance().clear()
  // })

  // Helper function to setup test environment
  async function setupTestFlow() {
    const ctx = createTestContext(
      NodeRegistry.getInstance(),
      new NodeCatalog(),
    )

    const caller = createCaller(ctx)
    const flow = await caller.flow.create({ name: 'Test Flow' })
    const types = await caller.nodeRegistry.listAvailableTypes()
    expect(types.length).toBeGreaterThan(0)

    // Find ScalarNode type
    const scalarNodeType = types.find((t: NodeMetadata) => t.title === 'Scalar Node')
    expect(scalarNodeType).toBeDefined()

    return { caller, flow, nodeType: scalarNodeType!.type }
  }

  // Basic test for node addition events
  it('should receive node added events and verify their structure', async () => {
    // Setup test context and caller
    // const ctx = createTestContext()
    // const caller = createCaller(ctx)
    const { caller, flow, nodeType } = await setupTestFlow()

    // Array to collect received events
    const receivedEvents: any[] = []

    // Create subscription to flow events
    const eventsGenerator = await caller.flow.subscribeToEvents({
      flowId: flow.id!,
      eventTypes: [], // just any event
    })

    // Start collecting events in background
    const collectionPromise = (async () => {
      for await (const event of eventsGenerator) {
        receivedEvents.push(event)
        if (receivedEvents.length >= 4)
          break
      }
    })()

    // Add two nodes to trigger events
    await caller.flow.addNode({
      flowId: flow.id!,
      nodeType,
      position: { x: 0, y: 0 },
    })

    await caller.flow.addNode({
      flowId: flow.id!,
      nodeType,
      position: { x: 100, y: 100 },
    })

    // Wait for events collection to complete
    await collectionPromise

    // Verify we received exactly 2 events
    expect(receivedEvents).toHaveLength(4)

    let foundStart = false
    let foundEnd = false
    let count = 0

    // Verify the structure of each event (TrackedEnvelope format)
    receivedEvents.forEach((event) => {
      // Check that event is an array (TrackedEnvelope structure)
      expect(Array.isArray(event)).toBe(true)

      // Destructure the TrackedEnvelope components
      const [id, eventData, symbol] = event

      if (!foundStart) {
        expect(eventData.type).toBe(FlowEventType.FlowInitStart)
        foundStart = true
        return
      }

      if (!foundEnd) {
        expect(eventData.type).toBe(FlowEventType.FlowInitEnd)
        foundEnd = true
        return
      }

      // Verify event structure
      expect(typeof id).toBe('string')
      expect(eventData.type).toBe(FlowEventType.NodeAdded)
      expect(eventData.flowId).toBe(flow.id)
      expect(eventData.index).toBeTypeOf('number')
      expect(eventData.timestamp).toBeInstanceOf(Date)
      expect(eventData.data.node).toBeDefined()
      expect(typeof symbol).toBe('symbol')

      // Verify node structure
      const node = eventData.data.node
      expect(node.metadata.type).toBe(nodeType)

      // Verify ScalarNode specific ports
      const ports = node.ports
      expect(ports.has('strInput')).toBe(true)
      expect(ports.has('numInput')).toBe(true)
      expect(ports.has('boolInput')).toBe(true)
      expect(ports.has('strOutput')).toBe(true)

      count++
    })

    expect(foundEnd).toBe(true)

    // Verify events are properly ordered by checking indexes
    expect(receivedEvents[1][1].index).toBeGreaterThan(receivedEvents[0][1].index)
  })

  it('should handle multiple types of events in correct order', async () => {
    const { caller, flow, nodeType } = await setupTestFlow()

    const receivedEvents: any[] = []

    const eventsGenerator = await caller.flow.subscribeToEvents({
      flowId: flow.id!,
      eventTypes: [
        FlowEventType.NodeAdded,
        FlowEventType.NodeRemoved,
        FlowEventType.EdgeAdded,
        FlowEventType.EdgeRemoved, // Add EdgeRemoved to tracked events
      ],
    })

    // Start collecting events
    const collectionPromise = (async () => {
      for await (const event of eventsGenerator) {
        receivedEvents.push(event)
        if (receivedEvents.length >= 5)
          break // Now expecting 5 events
      }
    })()

    // Helper function to wait for events
    const waitForEvents = (count: number) => new Promise<void>((resolve) => {
      const check = () => {
        if (receivedEvents.length >= count) {
          resolve()
        } else {
          setTimeout(check, 50)
        }
      }
      check()
    })

    // Add first node and wait for event
    const node1 = await caller.flow.addNode({
      flowId: flow.id!,
      nodeType,
      position: { x: 0, y: 0 },
    })
    // await waitForEvents(1)

    // Add second node and wait for event
    const node2 = await caller.flow.addNode({
      flowId: flow.id!,
      nodeType,
      position: { x: 100, y: 100 },
    })
    // await waitForEvents(2)

    // Connect nodes and wait for event
    await caller.flow.connectPorts({
      flowId: flow.id!,
      sourceNodeId: node1.id,
      sourcePortId: 'strOutput',
      targetNodeId: node2.id,
      targetPortId: 'strInput',
    })
    // await waitForEvents(3)

    // Remove first node and wait for events (both node and edge removal)
    await caller.flow.removeNode({
      flowId: flow.id!,
      nodeId: node2.id,
    })

    await waitForEvents(5) // Wait for both EdgeRemoved and NodeRemoved events

    // Wait for collection to complete
    await collectionPromise

    // Verify results
    expect(receivedEvents).toHaveLength(5)

    const eventTypes = receivedEvents.map(([, data]) => data.type)
    expect(eventTypes).toEqual([
      FlowEventType.NodeAdded, // First node added
      FlowEventType.NodeAdded, // Second node added
      FlowEventType.EdgeAdded, // Edge connected
      FlowEventType.EdgeRemoved, // Edge removed (happens before node removal)
      FlowEventType.NodeRemoved, // Node removed
    ])

    // Verify event order is correct
    const edgeAddedIndex = eventTypes.indexOf(FlowEventType.EdgeAdded)
    const edgeRemovedIndex = eventTypes.indexOf(FlowEventType.EdgeRemoved)
    const nodeRemovedIndex = eventTypes.indexOf(FlowEventType.NodeRemoved)

    // Edge should be removed before the node
    expect(edgeRemovedIndex).toBeLessThan(nodeRemovedIndex)
    // Edge should be added before being removed
    expect(edgeAddedIndex).toBeLessThan(edgeRemovedIndex)

    // Add timeout to test
  }, { timeout: 10000 })

  it('should handle concurrent node operations correctly', async () => {
    const { caller, flow, nodeType } = await setupTestFlow()

    const receivedEvents: any[] = []

    const eventsGenerator = await caller.flow.subscribeToEvents({
      flowId: flow.id!,
      eventTypes: [FlowEventType.NodeAdded],
    })

    // Start collecting events
    const collectionPromise = (async () => {
      for await (const event of eventsGenerator) {
        receivedEvents.push(event)
        if (receivedEvents.length >= 5)
          break
      }
    })()

    // Helper function to wait for events
    const waitForEvents = (count: number) => new Promise<void>((resolve) => {
      const check = () => {
        if (receivedEvents.length >= count) {
          resolve()
        } else {
          setTimeout(check, 500)
        }
      }
      check()
    })

    // Concurrently add multiple nodes
    const nodesToAdd = 5
    const addedNodes = [] as any[]
    for (let i = 0; i < nodesToAdd; i++) {
      const node = await caller.flow.addNode({
        flowId: flow.id!,
        nodeType,
        position: { x: i * 100, y: i * 100 },
      })
      addedNodes.push(node)
    }

    // Wait for all events to be collected
    await waitForEvents(nodesToAdd)
    await collectionPromise

    // Verify results
    expect(receivedEvents).toHaveLength(nodesToAdd)

    // Verify events are properly ordered by index
    const indexes = receivedEvents.map(([, data]) => data.index)
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b))

    // Verify all events are NodeAdded
    receivedEvents.forEach(([, data]) => {
      expect(data.type).toBe(FlowEventType.NodeAdded)
    })

    // Verify node positions are different
    const positions = new Set(
      addedNodes.map((node) => {
        return JSON.stringify(node.metadata.ui?.position)
      }),
    )
    expect(positions.size).toBe(nodesToAdd)
  }, { timeout: 5000 })

  it('should verify port connections between scalar nodes', async () => {
    const { caller, flow, nodeType } = await setupTestFlow()

    const receivedEvents: any[] = []

    const eventsGenerator = await caller.flow.subscribeToEvents({
      flowId: flow.id!,
      eventTypes: [
        FlowEventType.NodeAdded,
        FlowEventType.EdgeAdded,
      ],
    })

    // Start collecting events
    const collectionPromise = (async () => {
      for await (const event of eventsGenerator) {
        receivedEvents.push(event)
        // Ожидаем 3 события: 2 NodeAdded + 1 EdgeAdded
        if (receivedEvents.length >= 3)
          break
      }
    })()

    // Helper function to wait for events
    const waitForEvents = (count: number) => new Promise<void>((resolve) => {
      const check = () => {
        if (receivedEvents.length >= count) {
          resolve()
        } else {
          setTimeout(check, 50)
        }
      }
      check()
    })

    // Create source and target nodes
    const sourceNode = await caller.flow.addNode({
      flowId: flow.id!,
      nodeType,
      position: { x: 0, y: 0 },
    })

    const targetNode = await caller.flow.addNode({
      flowId: flow.id!,
      nodeType,
      position: { x: 200, y: 0 },
    })

    // Connect nodes
    await caller.flow.connectPorts({
      flowId: flow.id!,
      sourceNodeId: sourceNode.id,
      targetNodeId: targetNode.id,
      sourcePortId: 'strOutput',
      targetPortId: 'strInput',
      metadata: {
        description: 'string connection',
      },
    })

    // Wait for all events
    await waitForEvents(3)
    await collectionPromise

    // Verify results
    expect(receivedEvents).toHaveLength(3)

    const eventTypes = receivedEvents.map(([, data]) => data.type)
    expect(eventTypes).toEqual([
      FlowEventType.NodeAdded, // Source node
      FlowEventType.NodeAdded, // Target node
      FlowEventType.EdgeAdded, // Connection
    ])

    // Verify edge connection details
    const edgeEvent = receivedEvents.find(([, data]) => data.type === FlowEventType.EdgeAdded)
    expect(edgeEvent).toBeDefined()

    const [, edgeEventData] = edgeEvent!
    const edge = edgeEventData.data

    // Verify nodes connection
    expect(edge.sourceNodeId).toBe(sourceNode.id)
    expect(edge.targetNodeId).toBe(targetNode.id)

    // Verify ports connection
    expect(edge.sourcePortId).toBe('strOutput')
    expect(edge.targetPortId).toBe('strInput')

    // Verify metadata
    expect(edge.metadata.description).toBe('string connection')
  }, { timeout: 10000 })

  it('should handle node removal with connections', async () => {
    const { caller, flow, nodeType } = await setupTestFlow()

    const receivedEvents: any[] = []

    const eventsGenerator = await caller.flow.subscribeToEvents({
      flowId: flow.id!,
      eventTypes: [
        FlowEventType.NodeAdded,
        FlowEventType.NodeRemoved,
        FlowEventType.EdgeAdded,
        FlowEventType.EdgeRemoved,
      ],
    })

    // Start collecting events
    const collectionPromise = (async () => {
      for await (const event of eventsGenerator) {
        receivedEvents.push(event)
        // Ждем 5 событий: 2 NodeAdded + EdgeAdded + EdgeRemoved + NodeRemoved
        if (receivedEvents.length >= 5)
          break
      }
    })()

    // Helper function to wait for events
    const waitForEvents = (count: number) => new Promise<void>((resolve) => {
      const check = () => {
        if (receivedEvents.length >= count) {
          resolve()
        } else {
          setTimeout(check, 50)
        }
      }
      check()
    })

    // Create source and target nodes
    const source = await caller.flow.addNode({
      flowId: flow.id!,
      nodeType,
      position: { x: 0, y: 0 },
    })

    const target = await caller.flow.addNode({
      flowId: flow.id!,
      nodeType,
      position: { x: 100, y: 0 },
    })

    // Connect nodes
    await caller.flow.connectPorts({
      flowId: flow.id!,
      sourceNodeId: source.id,
      sourcePortId: 'strOutput',
      targetNodeId: target.id,
      targetPortId: 'strInput',
    })

    // Remove with force
    await caller.flow.removeNode({
      flowId: flow.id!,
      nodeId: source.id,
    })

    // Wait for all events
    await waitForEvents(5)
    await collectionPromise

    // Verify results
    expect(receivedEvents).toHaveLength(5)

    const eventTypes = receivedEvents.map(([, data]) => data.type)
    expect(eventTypes).toEqual([
      FlowEventType.NodeAdded, // Source node
      FlowEventType.NodeAdded, // Target node
      FlowEventType.EdgeAdded, // Connection created
      FlowEventType.EdgeRemoved, // Edge removed with node
      FlowEventType.NodeRemoved, // Node removed
    ])

    // Verify the order of removal events
    const edgeRemovedIndex = eventTypes.indexOf(FlowEventType.EdgeRemoved)
    const nodeRemovedIndex = eventTypes.indexOf(FlowEventType.NodeRemoved)
    expect(edgeRemovedIndex).toBeLessThan(nodeRemovedIndex)

    // Verify node details in the removal event
    const nodeRemovedEvent = receivedEvents.find(([, data]) =>
      data.type === FlowEventType.NodeRemoved,
    )
    expect(nodeRemovedEvent).toBeDefined()
    expect(nodeRemovedEvent![1].data.nodeId).toBe(source.id)

    // Verify edge details in the removal event
    const edgeRemovedEvent = receivedEvents.find(([, data]) =>
      data.type === FlowEventType.EdgeRemoved,
    )
    expect(edgeRemovedEvent).toBeDefined()
    expect(edgeRemovedEvent![1].data.edgeId).toBeDefined()
  }, { timeout: 10000 })
})
