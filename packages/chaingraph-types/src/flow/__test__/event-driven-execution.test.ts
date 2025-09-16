/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeExecutionResult } from '@badaitech/chaingraph-types'
import { describe, expect, it, vi } from 'vitest'
import { Node } from '../../decorator'
import { ExecutionContext } from '../../execution'
import { BaseNode } from '../../node/base-node'
import { ExecutionEngine } from '../execution-engine'
import { Flow } from '../flow'

// Simple mock event emitter node without decorators
@Node({
  type: 'TestEmitterNode',
  title: 'Test Emitter Node',
  description: 'A node that emits events to spawn child executions',
})
class TestEmitterNode extends BaseNode {
  eventName = 'test-event'
  statusOutput = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (context.emitEvent) {
      context.emitEvent(
        this.eventName,
        { message: 'Hello from emitter', nodeId: this.id },
        this.id,
      )
    }
    this.statusOutput = 'emitted'
    return {}
  }
}

// Simple mock event listener node without decorators
@Node({
  type: 'EventListenerNode',
  title: 'Test Event Listener',
  description: 'A node that listens for events and processes them',
})
class TestListenerNode extends BaseNode {
  eventName = 'test-event' // This is what the execution engine looks for
  receivedMessage = ''

  constructor(id: string) {
    super(id, {
      type: 'EventListenerNode', // Mark as EventListenerNode type
      title: 'Test Event Listener',
      flowPorts: {
        disabledAutoExecution: true, // Event listeners have auto-execution disabled
      },
    })
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (context.eventData) {
      const { eventName, payload } = context.eventData
      if (eventName === this.eventName && payload) {
        this.receivedMessage = payload.message || 'no message'
      }
    }
    return {}
  }
}

describe('event-driven execution', () => {
  it('should track currentNodeId when emitting events', async () => {
    const flow = new Flow({ name: 'Test Event Flow' })

    const emitterNode = new TestEmitterNode('emitter-1')
    emitterNode.initialize()
    await flow.addNode(emitterNode)

    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)

    const engine = new ExecutionEngine(flow, context)
    await engine.execute()

    // Verify event was emitted with correct nodeId
    expect(context.emittedEvents).toBeDefined()
    expect(context.emittedEvents!.length).toBe(1)
    expect(context.emittedEvents![0]).toMatchObject({
      type: 'test-event',
      emittedBy: 'emitter-1',
      data: { message: 'Hello from emitter', nodeId: 'emitter-1' },
    })
  })

  it('should handle event callback after node completion', async () => {
    const flow = new Flow({ name: 'Test Event Flow' })

    const emitterNode = new TestEmitterNode('emitter-1')
    emitterNode.initialize()
    await flow.addNode(emitterNode)

    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)

    const engine = new ExecutionEngine(flow, context)

    // Set up event callback spy
    const eventCallback = vi.fn()
    engine.setEventCallback(eventCallback)

    await engine.execute()

    // Verify callback was called with context
    expect(eventCallback).toHaveBeenCalledWith(context)
    expect(eventCallback).toHaveBeenCalledTimes(1)
  })

  it('should support parent-child execution contexts', async () => {
    const parentFlow = new Flow({ name: 'Parent Flow' })

    const emitterNode = new TestEmitterNode('emitter-1')
    emitterNode.initialize()
    await parentFlow.addNode(emitterNode)

    const abortController = new AbortController()
    const parentContext = new ExecutionContext(parentFlow.id, abortController)

    // Execute parent flow
    const parentEngine = new ExecutionEngine(parentFlow, parentContext)
    await parentEngine.execute()

    // Simulate child execution creation
    const event = parentContext.emittedEvents![0]
    const childContext = parentContext.cloneForChildExecution(
      { eventName: event.type, payload: event.data },
      'child-execution-1',
    )

    // Verify child context properties
    expect(childContext.parentExecutionId).toBe(parentContext.executionId)
    expect(childContext.isChildExecution).toBe(true)
    expect(childContext.eventData).toEqual({
      eventName: 'test-event',
      payload: { message: 'Hello from emitter', nodeId: 'emitter-1' },
    })
  })

  it('should execute listener node with event data', async () => {
    const flow = new Flow({ name: 'Listener Flow' })

    const listenerNode = new TestListenerNode('listener-1')
    listenerNode.initialize()
    await flow.addNode(listenerNode)

    const abortController = new AbortController()

    // Create child context with event data
    const eventData = {
      eventName: 'test-event',
      payload: { message: 'Hello from parent' },
    }
    const context = new ExecutionContext(
      flow.id,
      abortController,
      {},
      'child-execution-1',
      {},
      'parent-execution-1',
      'parent-execution-1',
      eventData,
      true,
    )

    const engine = new ExecutionEngine(flow, context)
    await engine.execute()

    // Verify listener processed the event
    expect(listenerNode.receivedMessage).toBe('Hello from parent')
  })
})
