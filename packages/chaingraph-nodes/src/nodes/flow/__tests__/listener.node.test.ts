/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EmittedEventContext } from '@badaitech/chaingraph-types'
import { ExecutionContext } from '@badaitech/chaingraph-types'
import { describe, expect, it } from 'vitest'
import EventListenerNode from '../listener.node'

function getTestContext(eventData?: EmittedEventContext): ExecutionContext {
  const abortController = new AbortController()
  const context = new ExecutionContext(
    'test-flow',
    abortController,
    {},
    'test-execution',
    {},
    eventData ? 'parent-execution' : undefined, // parentExecutionId if there's event data
    eventData,
    !!eventData // isChildExecution = true if there's event data
  )
  return context
}

describe('eventListenerNode', () => {
  it('should process matching events in child execution mode', async () => {
    const node = new EventListenerNode('listener-1')
    node.initialize()

    // Configure listener to listen for 'user-action' events
    node.inputFilter.eventName = 'user-action'

    // Create context with matching event data
    const eventData: EmittedEventContext = {
      eventName: 'user-action',
      payload: { eventName: 'user-action' },
    }
    const context = getTestContext(eventData)

    // Execute node
    await node.execute(context)

    // Verify output
    expect(node.outputData.eventName).toBe('user-action')
  })

  it('should return success=false when event type does not match filter', async () => {
    const node = new EventListenerNode('listener-2')
    node.initialize()

    // Configure listener to listen for 'user-action' events
    node.inputFilter.eventName = 'user-action'

    // Create context with non-matching event in child execution
    const eventData: EmittedEventContext = {
      eventName: 'system-event',
      payload: {},
    }
    const context = new ExecutionContext(
      'test-flow',
      new AbortController(),
      {},
      'test-execution',
      {},
      'parent-execution',
      eventData,
      true // isChildExecution
    )

    // Execute node
    const result = await node.execute(context)
    
    // Should return empty result for mismatched event
    expect(result.success).toBeUndefined()
  })

  it('should not execute in parent context and return empty result', async () => {
    const node = new EventListenerNode('listener-3')
    node.initialize()

    node.inputFilter.eventName = 'test-event'
    
    // Set some initial output data to verify it gets cleared
    node.outputData.eventName = 'old-data'

    // Create context without event data (normal execution mode)
    const context = getTestContext()

    // Execute node
    const result = await node.execute(context)
    
    // Verify it returns empty result
    expect(result.success).toBeUndefined()
    
    // Verify output data was cleared
    expect(node.outputData.eventName).toBe('')
  })

  it('should handle event from EventEmitterNode correctly', async () => {
    const node = new EventListenerNode('listener-4')
    node.initialize()

    node.inputFilter.eventName = 'test-event'

    // Simulate what EventEmitterNode sends: eventName as type, eventData object as payload
    const eventData: EmittedEventContext = {
      eventName: 'test-event',
      payload: {
        eventName: 'test-event' // EventEmitterNode sends the whole eventData object
      },
    }
    const context = getTestContext(eventData)

    // Execute node
    await node.execute(context)

    // Verify output has the event name
    expect(node.outputData.eventName).toBe('test-event')
  })

  it('should handle event data with payload containing additional data', async () => {
    const node = new EventListenerNode('listener-4')
    node.initialize()

    node.inputFilter.eventName = 'complex-event'

    // Create context with complex payload
    const eventData: EmittedEventContext = {
      eventName: 'complex-event',
      payload: {
        eventName: 'complex-event',
        additionalData: 'test-data',
        nested: { value: 123 },
      },
    }
    const context = getTestContext(eventData)

    // Execute node
    await node.execute(context)

    // Verify output has correct eventName
    // Note: EventData class only has eventName property, so additional data is not stored
    expect(node.outputData.eventName).toBe('complex-event')
  })
})
