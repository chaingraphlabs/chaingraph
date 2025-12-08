/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeMetadata } from '../../node'
import type { NodeExecutionResult } from '../../node/types'
import { describe, expect, it } from 'vitest'
import { Node, NodeRegistry } from '../../decorator'
import { Edge } from '../../edge'
import { ExecutionContext } from '../../execution/execution-context'
import { BaseNode } from '../../node/base-node'
import { ExecutionEngine } from '../execution-engine'
import { ExecutionEventEnum } from '../execution-events'
import { Flow } from '../flow'

describe('event-Bound Nodes', () => {
  // Regular test node
  @Node({
    type: 'RegularTestNode',
    title: 'Regular Test Node',
    description: 'A simple test node without any special behavior',
  })
  class RegularTestNode extends BaseNode {
    constructor(id: string, metadata?: NodeMetadata) {
      super(id, metadata || {
        type: 'RegularTestNode',
        title: 'Regular Test Node',
      })
    }

    async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
      return {}
    }
  }

  // EventListener test node
  @Node({
    type: 'EventListenerNodeV2',
    title: 'Event Listener V2',
    description: 'Listens for events',
  })
  class TestEventListenerNodeV2 extends BaseNode {
    eventName: string = 'test-event'

    constructor(id: string, eventName: string = 'test-event') {
      super(id, {
        type: 'EventListenerNodeV2',
        title: 'Test Event Listener V2',
        flowPorts: {
          disabledAutoExecution: true,
        },
      })
      this.eventName = eventName
    }

    async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
      return {}
    }
  }

  // Setup: Register nodes before tests
  NodeRegistry.getInstance().registerNode(RegularTestNode)
  NodeRegistry.getInstance().registerNode(TestEventListenerNodeV2)

  describe('root Context Behavior', () => {
    it('should NOT execute event-bound upstream nodes in root context', async () => {
      // Create flow: UpstreamNode -> EventListenerNode
      const flow = new Flow({ name: 'test-flow' })

      const upstreamNode = new RegularTestNode('upstream-1')
      const listenerNode = new TestEventListenerNodeV2('listener-1', 'test-event')

      upstreamNode.initialize()
      listenerNode.initialize()

      await flow.addNode(upstreamNode)
      await flow.addNode(listenerNode)

      // Connect upstream to listener
      const upstreamOutPort = upstreamNode.getFlowOutPort()
      const listenerInPort = listenerNode.getFlowInPort()

      if (upstreamOutPort && listenerInPort) {
        const edge = new Edge('edge-1', upstreamNode, upstreamOutPort, listenerNode, listenerInPort)
        await flow.addEdge(edge)
      }

      // Create ROOT execution context (not child, no event data)
      const abortController = new AbortController()
      const context = new ExecutionContext(
        flow.id,
        abortController,
        undefined,
        'test-execution',
        {},
        undefined,
        undefined,
        undefined, // no event data
        false, // not child execution
      )

      const engine = new ExecutionEngine(flow, context)
      const executedNodes: string[] = []

      engine.on(ExecutionEventEnum.NODE_STARTED, (event) => {
        executedNodes.push(event.data.node.id)
      })

      await engine.execute()

      // Neither upstream nor listener should execute in root context
      expect(executedNodes).not.toContain('upstream-1')
      expect(executedNodes).not.toContain('listener-1')
    })

    it('should execute regular nodes that are NOT connected to EventListeners', async () => {
      // Create flow with just a regular node (no EventListener connection)
      const flow = new Flow({ name: 'test-flow' })

      const regularNode = new RegularTestNode('regular-1')
      regularNode.initialize()
      await flow.addNode(regularNode)

      // Create ROOT execution context
      const abortController = new AbortController()
      const context = new ExecutionContext(
        flow.id,
        abortController,
        undefined,
        'test-execution',
        {},
        undefined,
        undefined,
        undefined,
        false,
      )

      const engine = new ExecutionEngine(flow, context)
      const executedNodes: string[] = []

      engine.on(ExecutionEventEnum.NODE_STARTED, (event) => {
        executedNodes.push(event.data.node.id)
      })

      await engine.execute()

      // Regular node should execute in root context
      expect(executedNodes).toContain('regular-1')
    })

    it('should NOT execute deep event-bound chains in root context', async () => {
      // Create flow: A -> B -> C -> EventListener
      const flow = new Flow({ name: 'test-flow' })

      const nodeA = new RegularTestNode('node-a')
      const nodeB = new RegularTestNode('node-b')
      const nodeC = new RegularTestNode('node-c')
      const listenerNode = new TestEventListenerNodeV2('listener-1', 'test-event')

      nodeA.initialize()
      nodeB.initialize()
      nodeC.initialize()
      listenerNode.initialize()

      await flow.addNode(nodeA)
      await flow.addNode(nodeB)
      await flow.addNode(nodeC)
      await flow.addNode(listenerNode)

      // Connect: A -> B
      const aOut = nodeA.getFlowOutPort()
      const bIn = nodeB.getFlowInPort()
      if (aOut && bIn) {
        await flow.addEdge(new Edge('edge-a-b', nodeA, aOut, nodeB, bIn))
      }

      // Connect: B -> C
      const bOut = nodeB.getFlowOutPort()
      const cIn = nodeC.getFlowInPort()
      if (bOut && cIn) {
        await flow.addEdge(new Edge('edge-b-c', nodeB, bOut, nodeC, cIn))
      }

      // Connect: C -> Listener
      const cOut = nodeC.getFlowOutPort()
      const listenerIn = listenerNode.getFlowInPort()
      if (cOut && listenerIn) {
        await flow.addEdge(new Edge('edge-c-listener', nodeC, cOut, listenerNode, listenerIn))
      }

      // Create ROOT execution context
      const abortController = new AbortController()
      const context = new ExecutionContext(
        flow.id,
        abortController,
        undefined,
        'test-execution',
        {},
        undefined,
        undefined,
        undefined,
        false,
      )

      const engine = new ExecutionEngine(flow, context)
      const executedNodes: string[] = []

      engine.on(ExecutionEventEnum.NODE_STARTED, (event) => {
        executedNodes.push(event.data.node.id)
      })

      await engine.execute()

      // All nodes in the chain should be skipped in root context
      expect(executedNodes).not.toContain('node-a')
      expect(executedNodes).not.toContain('node-b')
      expect(executedNodes).not.toContain('node-c')
      expect(executedNodes).not.toContain('listener-1')
    })
  })

  describe('child Context Behavior', () => {
    it('should execute event-bound upstream nodes in child context with matching event', async () => {
      // Create flow: UpstreamNode -> EventListenerNode
      const flow = new Flow({ name: 'test-flow' })

      const upstreamNode = new RegularTestNode('upstream-1')
      const listenerNode = new TestEventListenerNodeV2('listener-1', 'test-event')

      upstreamNode.initialize()
      listenerNode.initialize()

      await flow.addNode(upstreamNode)
      await flow.addNode(listenerNode)

      // Connect upstream to listener
      const upstreamOutPort = upstreamNode.getFlowOutPort()
      const listenerInPort = listenerNode.getFlowInPort()

      if (upstreamOutPort && listenerInPort) {
        const edge = new Edge('edge-1', upstreamNode, upstreamOutPort, listenerNode, listenerInPort)
        await flow.addEdge(edge)
      }

      // Create CHILD execution context with matching event
      const abortController = new AbortController()
      const context = new ExecutionContext(
        flow.id,
        abortController,
        undefined,
        'test-execution',
        {},
        'root-execution',
        'parent-execution',
        { eventName: 'test-event', payload: {} }, // matching event
        true, // is child execution
      )

      const engine = new ExecutionEngine(flow, context)
      const executedNodes: string[] = []

      engine.on(ExecutionEventEnum.NODE_STARTED, (event) => {
        executedNodes.push(event.data.node.id)
      })

      await engine.execute()

      // Both upstream and listener should execute in child context with matching event
      expect(executedNodes).toContain('upstream-1')
      expect(executedNodes).toContain('listener-1')
    })

    it('should NOT execute event-bound nodes when event name does not match', async () => {
      // Create flow: UpstreamNode -> EventListenerNode(event-a)
      const flow = new Flow({ name: 'test-flow' })

      const upstreamNode = new RegularTestNode('upstream-1')
      const listenerNode = new TestEventListenerNodeV2('listener-1', 'event-a')

      upstreamNode.initialize()
      listenerNode.initialize()

      await flow.addNode(upstreamNode)
      await flow.addNode(listenerNode)

      // Connect
      const upstreamOutPort = upstreamNode.getFlowOutPort()
      const listenerInPort = listenerNode.getFlowInPort()

      if (upstreamOutPort && listenerInPort) {
        const edge = new Edge('edge-1', upstreamNode, upstreamOutPort, listenerNode, listenerInPort)
        await flow.addEdge(edge)
      }

      // Create CHILD execution context with DIFFERENT event
      const abortController = new AbortController()
      const context = new ExecutionContext(
        flow.id,
        abortController,
        undefined,
        'test-execution',
        {},
        'root-execution',
        'parent-execution',
        { eventName: 'event-b', payload: {} }, // different event!
        true,
      )

      const engine = new ExecutionEngine(flow, context)
      const executedNodes: string[] = []

      engine.on(ExecutionEventEnum.NODE_STARTED, (event) => {
        executedNodes.push(event.data.node.id)
      })

      await engine.execute()

      // Neither should execute when event doesn't match
      expect(executedNodes).not.toContain('upstream-1')
      expect(executedNodes).not.toContain('listener-1')
    })
  })

  describe('mixed Flow Behavior', () => {
    it('should execute regular nodes but skip event-bound nodes in root context', async () => {
      // Create flow:
      // RegularNode (no listener connection)
      // UpstreamNode -> EventListenerNode
      const flow = new Flow({ name: 'test-flow' })

      const regularNode = new RegularTestNode('regular-1')
      const upstreamNode = new RegularTestNode('upstream-1')
      const listenerNode = new TestEventListenerNodeV2('listener-1', 'test-event')

      regularNode.initialize()
      upstreamNode.initialize()
      listenerNode.initialize()

      await flow.addNode(regularNode)
      await flow.addNode(upstreamNode)
      await flow.addNode(listenerNode)

      // Connect upstream to listener
      const upstreamOutPort = upstreamNode.getFlowOutPort()
      const listenerInPort = listenerNode.getFlowInPort()

      if (upstreamOutPort && listenerInPort) {
        const edge = new Edge('edge-1', upstreamNode, upstreamOutPort, listenerNode, listenerInPort)
        await flow.addEdge(edge)
      }

      // Create ROOT execution context
      const abortController = new AbortController()
      const context = new ExecutionContext(
        flow.id,
        abortController,
        undefined,
        'test-execution',
        {},
        undefined,
        undefined,
        undefined,
        false,
      )

      const engine = new ExecutionEngine(flow, context)
      const executedNodes: string[] = []

      engine.on(ExecutionEventEnum.NODE_STARTED, (event) => {
        executedNodes.push(event.data.node.id)
      })

      await engine.execute()

      // Regular node should execute, event-bound nodes should not
      expect(executedNodes).toContain('regular-1')
      expect(executedNodes).not.toContain('upstream-1')
      expect(executedNodes).not.toContain('listener-1')
    })

    it('should handle multiple EventListeners with different events correctly', async () => {
      // Create flow:
      // NodeA -> EventListener(event-a)
      // NodeB -> EventListener(event-b)
      const flow = new Flow({ name: 'test-flow' })

      const nodeA = new RegularTestNode('node-a')
      const nodeB = new RegularTestNode('node-b')
      const listenerA = new TestEventListenerNodeV2('listener-a', 'event-a')
      const listenerB = new TestEventListenerNodeV2('listener-b', 'event-b')

      nodeA.initialize()
      nodeB.initialize()
      listenerA.initialize()
      listenerB.initialize()

      await flow.addNode(nodeA)
      await flow.addNode(nodeB)
      await flow.addNode(listenerA)
      await flow.addNode(listenerB)

      // Connect A -> ListenerA
      const aOut = nodeA.getFlowOutPort()
      const listenerAIn = listenerA.getFlowInPort()
      if (aOut && listenerAIn) {
        await flow.addEdge(new Edge('edge-a', nodeA, aOut, listenerA, listenerAIn))
      }

      // Connect B -> ListenerB
      const bOut = nodeB.getFlowOutPort()
      const listenerBIn = listenerB.getFlowInPort()
      if (bOut && listenerBIn) {
        await flow.addEdge(new Edge('edge-b', nodeB, bOut, listenerB, listenerBIn))
      }

      // Create CHILD execution context for event-a
      const abortController = new AbortController()
      const context = new ExecutionContext(
        flow.id,
        abortController,
        undefined,
        'test-execution',
        {},
        'root-execution',
        'parent-execution',
        { eventName: 'event-a', payload: {} },
        true,
      )

      const engine = new ExecutionEngine(flow, context)
      const executedNodes: string[] = []

      engine.on(ExecutionEventEnum.NODE_STARTED, (event) => {
        executedNodes.push(event.data.node.id)
      })

      await engine.execute()

      // Only event-a chain should execute
      expect(executedNodes).toContain('node-a')
      expect(executedNodes).toContain('listener-a')
      // event-b chain should NOT execute
      expect(executedNodes).not.toContain('node-b')
      expect(executedNodes).not.toContain('listener-b')
    })
  })
})
