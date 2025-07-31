/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  IPort,
  NodeEvent,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import {
  Passthrough,
} from '@badaitech/chaingraph-types'

import {
  AnyPort,
  filterPorts,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Node,
  PortObject,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

/**
 * Gate Node - Creates dynamic port mappings between different parts of a flow
 *
 * 1. Provides 'any' type input ports that inherit types from connected ports
 * 2. Creates matching output ports with the same types as connected input ports
 * 3. Forwards data from inputs to corresponding outputs during execution
 */
@Node({
  type: 'GateNodeV2',
  title: 'Gate',
  description: 'Collects inputs and routes them to matching outputs, acting as a connection hub between different parts of the flow',
  category: NODE_CATEGORIES.FLOW,
  tags: ['flow', 'connect', 'route', 'hub', 'junction'],
})
class GateNodeV2 extends BaseNode {
  @Passthrough()
  @PortObject({
    title: 'Gate',
    description: 'Connect inputs to properties of this object',
    isSchemaMutable: true,
    schema: {
      type: 'object',
      properties: {},
    },
    ui: {
      collapsed: true,
      hidePort: true,
      keyDeletable: true,
    },
  })
  gate: Record<string, any> = {}

  /**
   * Execute the node by transferring values from input ports to output ports
   */
  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {}
  }

  /**
   * Handle node events to maintain port synchronization
   */
  async onEvent(event: NodeEvent): Promise<void> {
    await super.onEvent(event)
    await this.ensureHasOneEmptyAnyPort()
  }

  /**
   * Ensure there's exactly one empty 'any' input port
   */
  private async ensureHasOneEmptyAnyPort(): Promise<void> {
    const inputObjectPort = this.getGatePort()
    if (!inputObjectPort)
      return

    const emptyAnyPorts = this.getEmptyAnyPorts()

    if (emptyAnyPorts.length === 0) {
      // Create a new empty any port
      await this.createEmptyAnyPort()
    } else if (emptyAnyPorts.length > 1) {
      // Remove excess empty any ports, keep only the first one
      for (const port of emptyAnyPorts.slice(1)) {
        this.removeObjectProperty(inputObjectPort, port.getConfig().key || '')
      }
    }
  }

  /**
   * Create an empty 'any' port for dynamic connections
   */
  private async createEmptyAnyPort(): Promise<void> {
    const inputObjectPort = this.getGatePort()
    if (!inputObjectPort)
      return

    const nextId = this.getNextAvailableInputPortId()
    const nextOrder = this.getNextAvailablePortOrder()
    const portKey = this.getUniquePortKey(`gate-input-${nextId}`)

    // Create any port
    const anyPort = new AnyPort({
      id: portKey,
      type: 'any',
      key: portKey,
      parentId: inputObjectPort.id,
      nodeId: this.id,
      order: nextOrder,
      direction: 'passthrough',
      connections: [],
    })

    this.addObjectProperty(inputObjectPort, portKey, anyPort.getConfig())
  }

  /**
   * Get the input object port
   */
  private getGatePort(): IPort | undefined {
    return this.findPortByKey('gate')
  }

  /**
   * Get all input ports
   */
  private getInputPorts(): IPort[] {
    const inputObjectPort = this.getGatePort()
    if (!inputObjectPort)
      return []

    return filterPorts(this, port =>
      port.getConfig().parentId === inputObjectPort.id)
  }

  /**
   * Get empty any ports (no underlying type, no connections)
   */
  private getEmptyAnyPorts(): IPort[] {
    const inputObjectPort = this.getGatePort()
    if (!inputObjectPort)
      return []

    return filterPorts(this, (port) => {
      const config = port.getConfig()
      if (config.type !== 'any')
        return false

      const anyPort = port as AnyPort
      const underlyingType = anyPort.getRawConfig().underlyingType

      return config.parentId === inputObjectPort.id
        && !underlyingType
        && (!config.connections || config.connections.length === 0)
    }).sort((a, b) => {
      // Sort by order for consistent behavior
      const aOrder = a.getConfig().order ?? 100
      const bOrder = b.getConfig().order ?? 100
      return aOrder - bOrder
    })
  }

  /**
   * Generate a unique port key
   */
  private getUniquePortKey(baseKey: string): string {
    // Get all existing port keys
    const allPorts = filterPorts(this, () => true)
    const existingKeys = new Set<string>()

    for (const port of allPorts) {
      const key = port.getConfig().key
      if (key)
        existingKeys.add(key)
    }

    // If base key is available, use it
    if (!existingKeys.has(baseKey))
      return baseKey

    // Otherwise, try with numeric suffixes
    let suffix = 1
    let candidateKey = `${baseKey}_${suffix}`

    while (existingKeys.has(candidateKey)) {
      suffix++
      candidateKey = `${baseKey}_${suffix}`
    }

    return candidateKey
  }

  /**
   * Find the next available input port ID
   */
  private getNextAvailableInputPortId(): number {
    const existingIds = new Set<number>()

    // Extract IDs from port keys matching pattern gate-input-XX
    for (const port of this.getInputPorts()) {
      const key = port.getConfig().key || ''
      const match = key.match(/gate-input-(\d+)/)

      if (match && match[1]) {
        const id = Number.parseInt(match[1], 10)
        if (!Number.isNaN(id))
          existingIds.add(id)
      }
    }

    // Find lowest available ID
    let nextId = 1
    while (existingIds.has(nextId)) {
      nextId++
    }

    return nextId
  }

  /**
   * Get next available order value for ports
   */
  private getNextAvailablePortOrder(): number {
    let maxOrder = 0

    for (const port of this.getInputPorts()) {
      const order = port.getConfig().order || 0
      if (order > maxOrder)
        maxOrder = order
    }

    return maxOrder + 1
  }
}

export default GateNodeV2
