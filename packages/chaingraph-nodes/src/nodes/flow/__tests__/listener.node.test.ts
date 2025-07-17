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
    !!eventData, // isChildExecution = true if there's event data
    1, // executionDepth
  )
  return context
}

describe('eventListenerNode', () => {
  it('should process matching events in child execution mode', async () => {
    const node = new EventListenerNode('listener-1')
    node.initialize()

    // Configure listener to listen for 'user-action' events
    node.eventName = 'user-action'

    // Create context with matching event data
    const eventData: EmittedEventContext = {
      eventName: 'user-action',
      payload: { eventName: 'user-action' },
    }
    const context = getTestContext(eventData)

    // Execute node
    await node.execute(context)

    // Verify output (payload directly when no schema is provided)
    expect(node.outputData).toEqual({ eventName: 'user-action' })
  })

  it('should skip processing when event type does not match filter', async () => {
    const node = new EventListenerNode('listener-2')
    node.initialize()

    // Configure listener to listen for 'user-action' events
    node.eventName = 'user-action'

    // Set initial output data to verify it's not changed
    node.outputData = { initial: 'data' }

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
      true, // isChildExecution
      1, // executionDepth
    )

    // Execute node - should return {} and not process the event
    const result = await node.execute(context)
    expect(result).toEqual({})

    // Output data should remain unchanged since event was skipped
    expect(node.outputData).toEqual({ initial: 'data' })
  })

  it('should skip processing when no event data is available', async () => {
    const node = new EventListenerNode('listener-3')
    node.initialize()

    node.eventName = 'test-event'

    // Set some initial output data to verify it's not changed
    node.outputData = { eventName: 'old-data' }

    // Create context without event data (normal execution mode)
    const context = getTestContext()

    // Execute node - should return {} and skip processing
    const result = await node.execute(context)
    expect(result).toEqual({})

    // Output data should remain unchanged since execution was skipped
    expect(node.outputData).toEqual({ eventName: 'old-data' })
  })

  it('should handle event from EventEmitterNode correctly', async () => {
    const node = new EventListenerNode('listener-4')
    node.initialize()

    node.eventName = 'test-event'

    // Simulate what EventEmitterNode sends: eventName as type, eventData object as payload
    const eventData: EmittedEventContext = {
      eventName: 'test-event',
      payload: {
        eventName: 'test-event', // EventEmitterNode sends the whole eventData object
      },
    }
    const context = getTestContext(eventData)

    // Execute node
    await node.execute(context)

    // Verify output (payload directly when no schema is provided)
    expect(node.outputData).toEqual({ eventName: 'test-event' })
  })

  it('should handle event data with payload containing additional data', async () => {
    const node = new EventListenerNode('listener-5')
    node.initialize()

    node.eventName = 'complex-event'

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

    // Verify output (payload directly when no schema is provided)
    expect(node.outputData).toEqual({
      eventName: 'complex-event',
      additionalData: 'test-data',
      nested: { value: 123 },
    })
  })
})
