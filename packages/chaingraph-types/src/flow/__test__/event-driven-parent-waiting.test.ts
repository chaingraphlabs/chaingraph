/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeExecutionResult } from '@badaitech/chaingraph-types'
import { describe, expect, it } from 'vitest'
import { Node } from '../../decorator'
import { ExecutionContext } from '../../execution'
import { BaseNode } from '../../node/base-node'
import { ExecutionEngine } from '../execution-engine'
import { ExecutionEventEnum } from '../execution-events'
import { Flow } from '../flow'

// Mock event emitter that emits events
@Node({
  type: 'EventEmitterNode',
  title: 'Event Emitter Node',
  description: 'A node that emits events to spawn child executions',
})
class EventEmitterNode extends BaseNode {
  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    context.emitEvent('user-action', { action: 'click', target: 'button' })
    context.emitEvent('user-action', { action: 'hover', target: 'link' })
    return {}
  }
}

// Mock execution service behavior
class MockExecutionService {
  private childExecutions = new Map<string, Set<string>>()
  private executionStatuses = new Map<string, string>()

  async processEmittedEvents(context: ExecutionContext, parentId: string): Promise<void> {
    if (!context.emittedEvents || context.emittedEvents.length === 0) {
      return
    }

    const childIds = new Set<string>()

    for (const event of context.emittedEvents) {
      if (!event.processed) {
        // Simulate spawning child execution
        const childId = `child-${event.id}`
        childIds.add(childId)
        event.childExecutionId = childId
        event.processed = true

        // Track child execution
        this.executionStatuses.set(childId, 'running')
      }
    }

    this.childExecutions.set(parentId, childIds)
  }

  getChildExecutions(parentId: string): string[] {
    return Array.from(this.childExecutions.get(parentId) || [])
  }

  completeChildExecution(childId: string): void {
    this.executionStatuses.set(childId, 'completed')
  }

  areAllChildrenCompleted(parentId: string): boolean {
    const childIds = this.getChildExecutions(parentId)
    return childIds.every(id => this.executionStatuses.get(id) === 'completed')
  }
}

describe('event-driven Parent Execution Waiting', () => {
  it('should defer parent completion when children exist', async () => {
    const flow = new Flow({ name: 'Parent Flow' })

    const emitterNode = new EventEmitterNode('emitter-1')
    emitterNode.initialize()
    await flow.addNode(emitterNode, true)

    const abortController = new AbortController()
    const parentContext = new ExecutionContext(flow.id, abortController)
    const parentId = parentContext.executionId

    const engine = new ExecutionEngine(flow, parentContext)
    const mockService = new MockExecutionService()

    // Track flow completion events
    let flowCompletedCalled = false
    let completionDeferred = false

    engine.on(ExecutionEventEnum.FLOW_COMPLETED, async (event) => {
      flowCompletedCalled = true

      // Simulate execution service behavior
      await mockService.processEmittedEvents(parentContext, parentId)
      const childIds = mockService.getChildExecutions(parentId)

      if (childIds.length > 0) {
        // This simulates the logic in ExecutionService.createEventHandlers
        completionDeferred = true
        console.log(`Parent execution ${parentId} has ${childIds.length} active children, deferring completion`)
        // Don't mark as completed
      }
    })

    // Execute the flow
    await engine.execute()

    // Verify flow completed event was triggered
    expect(flowCompletedCalled).toBe(true)

    // Verify completion was deferred due to children
    expect(completionDeferred).toBe(true)

    // Verify children were created
    const childIds = mockService.getChildExecutions(parentId)
    expect(childIds.length).toBe(2)

    // Verify events were marked as processed
    expect(parentContext.emittedEvents!.every(e => e.processed)).toBe(true)
  })

  it('should complete parent after all children complete', async () => {
    const flow = new Flow({ name: 'Parent Flow' })

    const emitterNode = new EventEmitterNode('emitter-1')
    emitterNode.initialize()
    await flow.addNode(emitterNode, true)

    const abortController = new AbortController()
    const parentContext = new ExecutionContext(flow.id, abortController)
    const parentId = parentContext.executionId

    const engine = new ExecutionEngine(flow, parentContext)
    const mockService = new MockExecutionService()

    // Set up event callback to process emitted events
    engine.setEventCallback(async (ctx) => {
      await mockService.processEmittedEvents(ctx, parentId)
    })

    await engine.execute()

    // Get child executions
    const childIds = mockService.getChildExecutions(parentId)
    expect(childIds.length).toBe(2)

    // Simulate child completions
    let parentCanComplete = false

    // Complete first child
    mockService.completeChildExecution(childIds[0])
    parentCanComplete = mockService.areAllChildrenCompleted(parentId)
    expect(parentCanComplete).toBe(false)

    // Complete second child
    mockService.completeChildExecution(childIds[1])
    parentCanComplete = mockService.areAllChildrenCompleted(parentId)
    expect(parentCanComplete).toBe(true)
  })

  it('should handle flows without event emissions', async () => {
    const flow = new Flow({ name: 'Simple Flow' })

    // Node that doesn't emit events
    @Node({
      type: 'SimpleNode',
      title: 'Simple Node',
      description: 'A simple node that does not emit events',
    })
    class SimpleNode extends BaseNode {
      async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
        return {}
      }
    }
    const simpleNode = new SimpleNode('simple-1')
    simpleNode.initialize()
    await flow.addNode(simpleNode, true)

    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)

    const engine = new ExecutionEngine(flow, context)
    const mockService = new MockExecutionService()

    let completionDeferred = false

    engine.on(ExecutionEventEnum.FLOW_COMPLETED, async () => {
      await mockService.processEmittedEvents(context, context.executionId)
      const childIds = mockService.getChildExecutions(context.executionId)

      if (childIds.length > 0) {
        completionDeferred = true
      }
    })

    await engine.execute()

    // Should not defer completion when no events
    expect(completionDeferred).toBe(false)
    expect(context.emittedEvents).toBeUndefined()
  })
})
