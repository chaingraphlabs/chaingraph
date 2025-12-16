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

describe('disabledAutoExecution', () => {
  // Normal test node
  @Node({
    type: 'TestNode',
    title: 'Test Node',
    description: 'A simple test node',
  })
  class TestNode extends BaseNode {
    constructor(id: string, metadata?: NodeMetadata) {
      super(id, metadata || {
        type: 'TestNode',
        title: 'Test Node',
      })
    }

    async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
      console.log(`TestNode ${this.id} executing`)
      return {}
    }
  }

  // Node with disabledAutoExecution should not execute in parent context
  @Node({
    type: 'DisabledAutoExecNode',
    title: 'Disabled Auto Exec Node',
    description: 'A node that should not auto-execute in parent context',
  })
  class DisabledAutoExecNode extends BaseNode {
    constructor(id: string) {
      super(id, {
        type: 'DisabledAutoExecNode',
        title: 'Disabled Auto Exec',
        flowPorts: {
          disabledAutoExecution: true,
        },
      })
    }

    async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
      console.log(`DisabledAutoExecNode ${this.id} executing`)
      return {}
    }
  }

  // Add an EventListenerNode so the engine has something to execute
  @Node({
    type: 'EventListenerNode',
    title: 'Event Listener Node',
    description: 'A node that listens for events to trigger execution',
  })
  class TestEventListenerNode extends BaseNode {
    eventName: string = 'test-event'

    constructor(id: string) {
      super(id, {
        type: 'EventListenerNode',
        title: 'Test Event Listener',
        flowPorts: {
          disabledAutoExecution: true,
        },
      })
    }

    async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
      return {}
    }
  }

  it('should not execute nodes with disabledAutoExecution in parent context', async () => {
    NodeRegistry.getInstance().registerNode(DisabledAutoExecNode)
    NodeRegistry.getInstance().registerNode(TestNode)

    // Create flow with a node that has disabledAutoExecution
    const flow = new Flow({ name: 'test-flow' })
    const disabledNode = new DisabledAutoExecNode('disabled-1')
    disabledNode.initialize()
    await flow.addNode(disabledNode, false)

    // Add a normal node so flow can complete
    const normalNode = new TestNode('normal-1')
    normalNode.initialize()
    await flow.addNode(normalNode)

    // Create parent execution context
    const abortController = new AbortController()
    const context = new ExecutionContext(
      flow.id,
      abortController,
      undefined,
      'test-execution',
      {},
      undefined, // no parent
      undefined, // no parent
      undefined, // no event data
      false, // not a child execution
    )

    // Create and run engine
    const engine = new ExecutionEngine(flow, context)

    let nodeExecuted = false
    engine.on(ExecutionEventEnum.NODE_STARTED, (event) => {
      if (event.data.node.id === 'disabled-1') {
        nodeExecuted = true
      }
    })

    await engine.execute()

    // Node should not have executed
    expect(nodeExecuted).toBe(false)
  })

  it('should only execute EventListenerNodes in child context with event data', async () => {
    // Create flow with both a regular node and an EventListenerNode
    const flow = new Flow({ name: 'test-flow' })

    const disabledNode = new DisabledAutoExecNode('disabled-2')
    disabledNode.initialize()
    await flow.addNode(disabledNode, true)

    NodeRegistry.getInstance().registerNode(TestEventListenerNode)
    // NodeRegistry.getInstance().registerNode(EventListenerNode)

    const listenerNode = new TestEventListenerNode('listener-1')
    listenerNode.initialize()
    await flow.addNode(listenerNode, true)

    // Create child execution context with event data
    const abortController = new AbortController()
    const context = new ExecutionContext(
      flow.id,
      abortController,
      undefined,
      'test-execution',
      {},
      'test-execution',
      'parent-execution', // has parent
      { eventName: 'test-event', payload: {} }, // has event data
      true, // is a child execution
    )

    // Create and run engine
    const engine = new ExecutionEngine(flow, context)

    const executedNodes: string[] = []

    engine.on(ExecutionEventEnum.NODE_STARTED, (event) => {
      executedNodes.push(event.data.node.id)
    })

    await engine.execute()

    // Only the EventListenerNode should have executed
    expect(executedNodes).toEqual(['listener-1'])
    expect(executedNodes).not.toContain('disabled-2')
  })

  it('should handle mixed nodes correctly', async () => {
    // Create flow with both normal and disabled-auto-exec nodes
    const flow = new Flow({ name: 'test-flow' })

    const normalNode = new TestNode('normal-1')
    const disabledNode = new DisabledAutoExecNode('disabled-3')
    const dependentNode = new TestNode('dependent-1')

    await flow.addNode(normalNode)
    await flow.addNode(disabledNode)
    await flow.addNode(dependentNode)

    // Initialize nodes first
    normalNode.initialize()
    disabledNode.initialize()
    dependentNode.initialize()

    // Create edges: normalNode -> dependentNode, disabledNode -> dependentNode
    const normalOutPort = normalNode.getFlowOutPort()
    const disabledOutPort = disabledNode.getFlowOutPort()
    const dependentInPort = dependentNode.getFlowInPort()

    if (normalOutPort && dependentInPort) {
      const edge1 = new Edge(
        'edge-1',
        normalNode,
        normalOutPort,
        dependentNode,
        dependentInPort,
      )
      await flow.addEdge(edge1)
    }

    if (disabledOutPort && dependentInPort) {
      const edge2 = new Edge(
        'edge-2',
        disabledNode,
        disabledOutPort,
        dependentNode,
        dependentInPort,
      )
      await flow.addEdge(edge2)
    }

    // Create parent execution context
    const abortController = new AbortController()
    const context = new ExecutionContext(
      flow.id,
      abortController,
      undefined,
      'test-execution',
      {},
      'test-execution',
      undefined,
      undefined,
      false,
    )

    // Create and run engine
    const engine = new ExecutionEngine(flow, context)

    const executedNodes: string[] = []
    engine.on(ExecutionEventEnum.NODE_STARTED, (event) => {
      executedNodes.push(event.data.node.id)
    })

    await engine.execute()

    // Normal node should execute, disabled node should not
    expect(executedNodes).toContain('normal-1')
    expect(executedNodes).not.toContain('disabled-3')

    // Dependent node SHOULD execute because normal-1 provides data
    // (at least one source per port is sufficient - OR semantics)
    expect(executedNodes).toContain('dependent-1')
  })
})
