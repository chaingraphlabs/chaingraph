/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../../execution'
import { beforeEach, describe, expect, it } from 'vitest'
import { Node } from '../../decorator/node.decorator'
import { PortVisibility } from '../../decorator/port-visibility.decorator'
import { Port } from '../../decorator/port.decorator'
import { PortPluginRegistry } from '../../port'
import { BooleanPortPlugin, NumberPortPlugin, StringPortPlugin } from '../../port/plugins'
import { BaseNodeCompositional } from '../base-node-compositional'
import { NodeEventType } from '../events'
import 'reflect-metadata'

// Register port plugins for testing
beforeEach(() => {
  const registry = PortPluginRegistry.getInstance()
  registry.register(StringPortPlugin)
  registry.register(NumberPortPlugin)
  registry.register(BooleanPortPlugin)
})

/**
 * A test node that implements event handling and port visibility rules
 */
@Node({
  type: 'EventTestNode',
  title: 'Event Test Node',
  description: 'A node for testing event handling',
})
class EventTestNode extends BaseNodeCompositional {
  @Port({
    type: 'string',
    direction: 'input',
  })
  message: string = ''

  @Port({
    type: 'string',
    direction: 'input',
  })
  messageSuffix: string = ''

  @Port({
    type: 'boolean',
    direction: 'input',
    ui: { hidden: true }, // Start hidden by default
  })
  @PortVisibility({
    showIf: instance => (instance as EventTestNode).message.length > 0,
  })
  showAdditionalOptions: boolean = true

  eventHandled = false
  lastEventType = ''

  async execute(_context: ExecutionContext) {
    return {}
  }

  async onEvent(event: any): Promise<void> {
    // Call parent implementation first to apply visibility rules
    await super.onEvent(event)

    // Mark event as handled for test verification
    this.eventHandled = true
    this.lastEventType = event.type

    // When message is updated, update messageSuffix
    if (
      event.type === NodeEventType.PortUpdate
      && event.port?.getConfig().key === 'message'
    ) {
      const portMessageSuffix = this.findPortByKey('messageSuffix')
      if (portMessageSuffix) {
        portMessageSuffix.setValue(`${this.message} [suffix]`)
        // Use portManager directly to avoid recursive event loop
        await this.updatePort(portMessageSuffix)
      }
    }

    return Promise.resolve()
  }
}

describe('event Handling and Port Visibility', () => {
  let node: EventTestNode

  beforeEach(() => {
    node = new EventTestNode('event-test-node')
    node.initialize()
    // Reset event handled flag
    node.eventHandled = false
    node.lastEventType = ''
  })

  it('should handle port update events and update related ports', async () => {
    // Check initial state
    expect(node.message).toBe('')
    expect(node.messageSuffix).toBe('')

    // Update the message port
    const messagePort = node.findPortByKey('message')
    if (!messagePort) {
      throw new Error('Message port not found')
    }

    // Set a new value which should trigger an event
    messagePort.setValue('Hello World')

    // Update port and wait for the event to be processed
    await node.updatePort(messagePort)

    // Verify the event was handled
    expect(node.eventHandled).toBe(true)
    expect(node.lastEventType).toBe(NodeEventType.PortUpdate)

    // Verify the message suffix was updated by the event handler
    expect(node.messageSuffix).toBe('Hello World [suffix]')
  })

  it('should automatically apply port visibility rules when properties change', async () => {
    // Get the options port and verify initial hidden state
    const optionsPort = node.findPortByKey('showAdditionalOptions')
    if (!optionsPort) {
      throw new Error('Options port not found')
    }

    // Since message is empty initially, the options port should be hidden
    expect(optionsPort.getConfig().ui?.hidden).toBe(true)

    // Update the message property through a port update
    const messagePort = node.findPortByKey('message')
    if (!messagePort) {
      throw new Error('Message port not found')
    }

    // Set a non-empty value (should trigger automatic visibility update)
    messagePort.setValue('Hello World')
    await node.updatePort(messagePort)

    // The port visibility should have been updated automatically by the node's onEvent
    expect(optionsPort.getConfig().ui?.hidden).toBe(false)

    // Clear the message
    messagePort.setValue('')
    await node.updatePort(messagePort)

    // The port visibility should have been updated automatically again
    expect(optionsPort.getConfig().ui?.hidden).toBe(true)
  })

  it('should serialize and preserve visibility state through event handling', async () => {
    // Set up a non-empty message to make options visible
    const messagePort = node.findPortByKey('message')
    if (!messagePort) {
      throw new Error('Message port not found')
    }

    // Set non-empty message to show the options port
    messagePort.setValue('Hello World')
    await node.updatePort(messagePort)

    // Get the options port to verify its visibility changed
    const optionsPort = node.findPortByKey('showAdditionalOptions')
    if (!optionsPort) {
      throw new Error('Options port not found')
    }

    // Visibility should be automatically updated by event handling
    expect(optionsPort.getConfig().ui?.hidden).toBe(false)

    // Serialize the node
    const serialized = node.serialize()

    // Create a new node
    const newNode = new EventTestNode('event-test-node')
    newNode.deserialize(serialized)
    newNode.initialize()

    // Verify the state was preserved
    expect(newNode.message).toBe('Hello World')
    expect(newNode.messageSuffix).toBe('Hello World [suffix]')

    // Verify the visibility state was preserved through initialization
    const newOptionsPort = newNode.findPortByKey('showAdditionalOptions')
    if (!newOptionsPort) {
      throw new Error('Options port not found in deserialized node')
    }

    // The visibility should have been applied during initialization
    expect(newOptionsPort.getConfig().ui?.hidden).toBe(false)

    // Test that visibility rules continue to work on the new instance
    const newMessagePort = newNode.findPortByKey('message')
    if (!newMessagePort) {
      throw new Error('Message port not found in deserialized node')
    }

    // Clear the message to hide the options port
    newMessagePort.setValue('')
    await newNode.updatePort(newMessagePort)

    // Verify the visibility was updated automatically
    expect(newOptionsPort.getConfig().ui?.hidden).toBe(true)
  })
})
