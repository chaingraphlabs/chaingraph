/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeExecutionResult } from '@badaitech/chaingraph-types'
import { describe, expect, it, vi } from 'vitest'
import { ExecutionContext } from '../../execution'
import { BaseNode } from '../../node/base-node'
import { ExecutionEngine } from '../execution-engine'
import { Flow } from '../flow'

// Mock event emitter node
class TestEmitterNode extends BaseNode {
  eventName = 'test-event'
  emitCount = 1

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Emit multiple events to spawn multiple children
    for (let i = 0; i < this.emitCount; i++) {
      if (context.emitEvent) {
        context.emitEvent(this.eventName, {
          message: `Event ${i + 1}`,
          nodeId: this.id,
          index: i,
        })
      }
    }
    return {}
  }
}

describe('parent-Child Execution Context', () => {
  it('should track emitted events during execution', async () => {
    const flow = new Flow({ name: 'Parent Flow' })

    const emitterNode = new TestEmitterNode('emitter-1')
    emitterNode.emitCount = 3
    emitterNode.initialize()
    flow.addNode(emitterNode)

    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)

    const engine = new ExecutionEngine(flow, context)
    await engine.execute()

    // Verify events were emitted
    expect(context.emittedEvents).toBeDefined()
    expect(context.emittedEvents!.length).toBe(3)

    // Verify event structure
    for (let i = 0; i < 3; i++) {
      expect(context.emittedEvents![i]).toMatchObject({
        type: 'test-event',
        emittedBy: 'emitter-1',
        data: {
          message: `Event ${i + 1}`,
          nodeId: 'emitter-1',
          index: i,
        },
      })
    }
  })

  it('should call event callback for each node that emits events', async () => {
    const flow = new Flow({ name: 'Parent Flow' })

    // Add multiple emitter nodes
    const emitter1 = new TestEmitterNode('emitter-1')
    emitter1.emitCount = 2
    emitter1.initialize()
    flow.addNode(emitter1)

    const emitter2 = new TestEmitterNode('emitter-2')
    emitter2.emitCount = 1
    emitter2.initialize()
    flow.addNode(emitter2)

    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)

    const engine = new ExecutionEngine(flow, context)

    // Set up event callback spy
    const eventCallback = vi.fn()
    engine.setEventCallback(eventCallback)

    await engine.execute()

    // Callback should be called after each node that emits events
    expect(eventCallback).toHaveBeenCalledTimes(2)
    expect(eventCallback).toHaveBeenCalledWith(context)

    // Total events should be 3 (2 from emitter1 + 1 from emitter2)
    expect(context.emittedEvents!.length).toBe(3)
  })

  it('should create proper child execution context', async () => {
    const parentFlow = new Flow({ name: 'Parent Flow' })

    const emitterNode = new TestEmitterNode('emitter-1')
    emitterNode.initialize()
    parentFlow.addNode(emitterNode)

    const abortController = new AbortController()
    const parentContext = new ExecutionContext(parentFlow.id, abortController)

    // Execute parent
    const parentEngine = new ExecutionEngine(parentFlow, parentContext)
    await parentEngine.execute()

    // Simulate child execution creation (as would be done by ExecutionService)
    const event = parentContext.emittedEvents![0]
    const childContext = parentContext.cloneForChildExecution(
      { eventName: event.type, payload: event.data },
      'child-execution-1',
    )

    // Verify child context
    expect(childContext.parentExecutionId).toBe(parentContext.executionId)
    expect(childContext.isChildExecution).toBe(true)
    expect(childContext.eventData).toEqual({
      eventName: 'test-event',
      payload: {
        message: 'Event 1',
        nodeId: 'emitter-1',
        index: 0,
      },
    })

    // Child should share the same abort controller
    expect(childContext.abortController).toBe(parentContext.abortController)
  })

  it('should not process events after abort', async () => {
    const flow = new Flow({ name: 'Parent Flow' })

    const emitterNode = new TestEmitterNode('emitter-1')
    emitterNode.emitCount = 5
    emitterNode.initialize()
    flow.addNode(emitterNode)

    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)

    const engine = new ExecutionEngine(flow, context)

    let callCount = 0
    engine.setEventCallback(async (ctx) => {
      callCount++
      // Abort after first callback
      if (callCount === 1) {
        abortController.abort()
      }
    })

    try {
      await engine.execute()
    } catch (error) {
      // Expected to throw due to abort
    }

    // Should only have called callback once before abort
    expect(callCount).toBe(1)
  })
})
