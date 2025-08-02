/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  AnyPort,

  ArrayPort,
  ExecutionContext,
  IPort,
  IPortConfig,
  NodeEvent,
  NodeExecutionResult,
  PortDisconnectedEvent,
  PortUpdateEvent,
} from '@badaitech/chaingraph-types'
import {
  deepCopy,
} from '@badaitech/chaingraph-types'
import {
  PortArray,
} from '@badaitech/chaingraph-types'

import {
  BaseNode,
  findPort,
  Node,
  NodeEventType,
  Output,
  Passthrough,
  PortAny,
  PortNumber,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'ArrayElementNode',
  title: 'Array Element',
  description: 'Extracts an element from an array at the specified index',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['array', 'element', 'index', 'extract'],
})
class ArrayElementNode extends BaseNode {
  @Passthrough()
  @PortArray({
    title: 'Array',
    description: 'The array to extract an element from',
    itemConfig: {
      type: 'any',
      title: 'Item',
      description: 'The type of items in the array',
    },
  })
  array: any[] = []

  @Passthrough()
  @PortNumber({
    title: 'Index',
    description: 'The index of the element to extract',
    defaultValue: 0,
    integer: true,
  })
  index: number = 0

  @Output()
  @PortAny({
    title: 'Element',
    description: 'The extracted element from the array',
  })
  element: any = null

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Reset the element value
    this.element = null

    // Check if array is valid
    if (!Array.isArray(this.array)) {
      throw new TypeError('The "array" is empty or not an array')
    }

    // Check if index is within bounds
    if (this.index < 0 || this.index >= this.array.length) {
      throw new RangeError(`Index ${this.index} is out of bounds for array of length ${this.array.length}`)
    }

    // Extract the element
    this.element = this.array[this.index]

    return {}
  }

  /**
   * Handle node events to maintain port synchronization
   */
  async onEvent(event: NodeEvent): Promise<void> {
    await super.onEvent(event)

    switch (event.type) {
      case NodeEventType.PortUpdate:
        await this.handlePortUpdate(event as PortUpdateEvent)
        break

      case NodeEventType.PortDisconnected:
        await this.handlePortDisconnected(event as PortDisconnectedEvent)
        break
    }
  }

  private async handlePortUpdate(event: PortUpdateEvent): Promise<void> {
    // Check if the source port is the array port
    if (
      event.port.getConfig().key !== 'array'
      || event.port.getConfig().parentId
      || event.port.getConfig().direction !== 'passthrough'
    ) {
      return
    }

    // Get the item type from the array port
    const arrayPort = event.port as ArrayPort

    // Get the item configuration from the array
    const itemConfig = arrayPort.getConfig().itemConfig

    // Generate title for the element port based on the item type
    const itemTitle = itemConfig.title || itemConfig.type || 'Unknown Type'
    const title = `Element (${itemTitle})`

    // Set the element port configuration based on the array's item type
    this.setElementPortConfig(title, {
      ...itemConfig,
      direction: arrayPort.getConfig().direction,
    })
  }

  /**
   * Handle port disconnection events
   */
  private async handlePortDisconnected(event: PortDisconnectedEvent): Promise<void> {
    // Only process disconnections from our own ports
    const sourcePort = event.sourcePort
    const sourcePortConfig = sourcePort.getConfig()

    // Only process the array port and ensure it is a passthrough port without a parent
    if (
      sourcePortConfig.key !== 'array'
      || sourcePortConfig.direction !== 'passthrough'
      || sourcePortConfig.parentId
    ) {
      return
    }

    // Reset the element port configuration to default any configuration
    this.setElementPortConfig('Element', undefined)

    const arrayPort = sourcePort as ArrayPort
    arrayPort.setConfig({
      ...arrayPort.getConfig(),
      type: 'array',
      itemConfig: {
        type: 'any',
        title: 'Item',
        description: 'The type of items in the array',
      },
    })
    arrayPort.setValue([])
    return this.updatePort(sourcePort)
  }

  /**
   * Set configuration for the element port
   */
  private setElementPortConfig(title: string, itemConfig: IPortConfig | undefined): void {
    // Get the element port and update its configuration
    const elementPort = findPort(this, (port) => {
      return port.getConfig().key === 'element'
        && !port.getConfig().parentId
        && port.getConfig().direction === 'output'
    }) as AnyPort | undefined

    if (!elementPort) {
      console.warn('[ArrayElementNode] Element port not found')
      return
    }

    const elementPortConfig = elementPort.getConfig()
    if (elementPortConfig.type !== 'any') {
      return
    }

    // Update the element port configuration
    elementPort.setUnderlyingType(deepCopy(itemConfig))
    this.refreshAnyPortUnderlyingPorts(elementPort as IPort)
  }
}

export default ArrayElementNode
