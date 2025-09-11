/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { ExecutionContext } from '@badaitech/chaingraph-types'
import { describe, expect, it, vi } from 'vitest'
import EventEmitterNode from '../emitter.node'

function getTestContext(): ExecutionContext {
  const abortController = new AbortController()
  const context = new ExecutionContext('test-flow', abortController)
  // Mock the emitEvent method
  context.emitEvent = vi.fn()
  return context
}

describe('eventEmitterNode', () => {
  it('should emit an event with the specified name and data', async () => {
    const node = new EventEmitterNode('emitter-1')
    node.initialize()

    // Set event name and payload
    node.eventName = 'test-event'
    node.payload = { message: 'test payload' }

    const context = getTestContext()

    // Execute node
    await node.execute(context)

    // Verify emitEvent was called
    expect(context.emitEvent).toHaveBeenCalledWith('test-event', { message: 'test payload' }, 'emitter-1')
  })

  it('should throw an error when event name is empty', async () => {
    const node = new EventEmitterNode('emitter-2')
    node.initialize()

    // Leave event name empty
    node.eventName = ''

    const context = getTestContext()

    // Execute node and expect error
    await expect(node.execute(context)).rejects.toThrow('Event name is required to emit an event')
  })

  it('should throw an error when context does not support event emission', async () => {
    const node = new EventEmitterNode('emitter-3')
    node.initialize()

    node.eventName = 'test-event'

    // Create context without emitEvent
    const abortController = new AbortController()
    const context = new ExecutionContext('test-flow', abortController)
    // ExecutionContext has emitEvent defined, so we need to set it to undefined
    ;(context as any).emitEvent = undefined

    // Execute node and expect error
    await expect(node.execute(context)).rejects.toThrow('Event emission is not supported in this context')
  })

  it('should track currentNodeId when emitting events', async () => {
    const node = new EventEmitterNode('emitter-4')
    node.initialize()

    node.eventName = 'test-event'
    node.payload = { data: 'test' }

    // Create real context to test emittedEvents
    const abortController = new AbortController()
    const context = new ExecutionContext('test-flow', abortController)
    context.currentNodeId = 'emitter-4'

    // Execute node
    await node.execute(context)

    // Verify event was added to emittedEvents
    expect(context.emittedEvents).toBeDefined()
    expect(context.emittedEvents!.length).toBe(1)
    expect(context.emittedEvents![0]).toMatchObject({
      type: 'test-event',
      emittedBy: 'emitter-4',
      data: { data: 'test' },
    })
  })

  it('should emit event with object payload', async () => {
    const node = new EventEmitterNode('emitter-5')
    node.initialize()

    node.eventName = 'test-event'
    node.payload = { message: 'hello', count: 42 }

    const context = getTestContext()

    // Should execute without error
    await node.execute(context)

    expect(context.emitEvent).toHaveBeenCalledWith('test-event', { message: 'hello', count: 42 }, 'emitter-5')
  })

  it('should handle payload as object (PortObject ensures object type)', async () => {
    const node = new EventEmitterNode('emitter-6')
    node.initialize()

    node.eventName = 'test-event'
    // PortObject will convert any value to an object structure
    node.payload = { converted: 'value' }

    const context = getTestContext()

    // Should execute without error
    await node.execute(context)

    expect(context.emitEvent).toHaveBeenCalledWith('test-event', { converted: 'value' }, 'emitter-6')
  })

  it('should handle complex object payload', async () => {
    const node = new EventEmitterNode('emitter-7')
    node.initialize()

    node.eventName = 'test-event'
    // Complex object payload with nested structures
    node.payload = { anything: 'goes', numbers: [1, 2, 3], nested: { deep: true } }

    const context = getTestContext()

    // Should execute without error
    await node.execute(context)

    expect(context.emitEvent).toHaveBeenCalledWith('test-event', {
      anything: 'goes',
      numbers: [1, 2, 3],
      nested: { deep: true },
    }, 'emitter-7')
  })
})
