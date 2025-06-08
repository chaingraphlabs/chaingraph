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
import { ExecutionContext } from '../../execution/execution-context'
import { BaseNode } from '../../node/base-node'
import { Edge } from '../../edge'
import { ExecutionEngine } from '../execution-engine'
import { ExecutionEventEnum } from '../execution-events'
import { Flow } from '../flow'

describe('DisabledAutoExecution', () => {
  // Normal test node
  class TestNode extends BaseNode {
    constructor(id: string, metadata?: NodeMetadata) {
      super(id, metadata || {
        type: 'TestNode',
        title: 'Test Node',
      })
    }

    async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
      console.log(`TestNode ${this.id} executing`)
      return { success: true }
    }
  }

  // Node with disabledAutoExecution should not execute in parent context
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
      return { success: true }
    }
  }

  it('should not execute nodes with disabledAutoExecution in parent context', async () => {
    // Create flow with a node that has disabledAutoExecution
    const flow = new Flow({ name: 'test-flow' })
    const disabledNode = new DisabledAutoExecNode('disabled-1')
    disabledNode.initialize()
    flow.addNode(disabledNode)
    
    // Add a normal node so flow can complete
    const normalNode = new TestNode('normal-1')
    normalNode.initialize()
    flow.addNode(normalNode)

    // Create parent execution context
    const abortController = new AbortController()
    const context = new ExecutionContext(
      flow.id,
      abortController,
      undefined,
      'test-execution',
      {},
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

  it('should execute nodes with disabledAutoExecution in child context', async () => {
    // Create flow with a node that has disabledAutoExecution
    const flow = new Flow({ name: 'test-flow' })
    const disabledNode = new DisabledAutoExecNode('disabled-2')
    disabledNode.initialize()
    flow.addNode(disabledNode)

    // Create child execution context
    const abortController = new AbortController()
    const context = new ExecutionContext(
      flow.id,
      abortController,
      undefined,
      'test-execution',
      {},
      'parent-execution', // has parent
      { eventName: 'test-event', payload: {} }, // has event data
      true, // is a child execution
    )

    // Create and run engine
    const engine = new ExecutionEngine(flow, context)
    
    let nodeExecuted = false
    engine.on(ExecutionEventEnum.NODE_STARTED, (event) => {
      if (event.data.node.id === 'disabled-2') {
        nodeExecuted = true
      }
    })

    await engine.execute()

    // Node should have executed in child context
    expect(nodeExecuted).toBe(true)
  })

  it('should handle mixed nodes correctly', async () => {
    // Create flow with both normal and disabled-auto-exec nodes
    const flow = new Flow({ name: 'test-flow' })
    
    const normalNode = new TestNode('normal-1')
    const disabledNode = new DisabledAutoExecNode('disabled-3')
    const dependentNode = new TestNode('dependent-1')
    
    flow.addNode(normalNode)
    flow.addNode(disabledNode)
    flow.addNode(dependentNode)
    
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
      flow.addEdge(edge1)
    }
    
    if (disabledOutPort && dependentInPort) {
      const edge2 = new Edge(
        'edge-2',
        disabledNode,
        disabledOutPort,
        dependentNode,
        dependentInPort,
      )
      flow.addEdge(edge2)
    }

    // Create parent execution context
    const abortController = new AbortController()
    const context = new ExecutionContext(
      flow.id,
      abortController,
      undefined,
      'test-execution',
      {},
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
    
    // Dependent node should NOT execute because disabled node never completes
    // (all dependencies must be satisfied for a node to execute)
    expect(executedNodes).not.toContain('dependent-1')
  })
})