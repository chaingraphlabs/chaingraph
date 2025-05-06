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
  IPortConfig,
  NodeEvent,
  NodeExecutionResult,
  PortConnectedEvent,
  PortDisconnectedEvent,
} from '@badaitech/chaingraph-types'
import {
  AnyPort,
  filterPorts,
  NodeEventType,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortObject,
  String,
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
  type: 'GateNode',
  title: 'Gate',
  description: 'Collects inputs and routes them to matching outputs, acting as a connection hub between different parts of the flow',
  category: NODE_CATEGORIES.FLOW,
  tags: ['flow', 'connect', 'route', 'hub', 'junction'],
})
class GateNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'Gate Inputs',
    description: 'Connect inputs to properties of this object',
    isSchemaMutable: false,
    schema: {
      type: 'object',
      properties: {},
    },
    ui: {
      collapsed: true,
    },
  })
  inputObject: Record<string, any> = {}

  @Output()
  @PortObject({
    title: 'Gate Outputs',
    description: 'Connect these outputs to other nodes',
    isSchemaMutable: true,
    schema: {
      type: 'object',
      properties: {},
    },
    ui: {
      collapsed: true,
    },
  })
  outputObject: Record<string, any> = {}

  @Input()
  @String({
    title: 'Connections Map',
    description: 'Internal storage for input-output port mappings',
    ui: {
      hidden: true,
    },
  })
  connectionsMap: string = '{}'

  // Get the connection map from the string
  private get connections(): Record<string, string> {
    try {
      return JSON.parse(this.connectionsMap)
    } catch (e) {
      console.error(`[GateNode ${this.id}] Error parsing connections map:`, e)
      return {}
    }
  }

  // Save the connection map to the string
  private saveConnections(connections: Record<string, string>): void {
    try {
      this.connectionsMap = JSON.stringify(connections)
    } catch (e) {
      console.error(`[GateNode ${this.id}] Error serializing connections:`, e)
    }
  }

  /**
   * Finds a unique port key that doesn't conflict with any existing port in the node
   * @param baseKey The desired port key
   * @returns A unique key not currently used by any port in the node
   */
  private getUniquePortKey(baseKey: string): string {
    // Get all ports in this node
    const allPorts = filterPorts(this, port => true)

    // Get all existing keys
    const existingKeys = new Set<string>()
    for (const port of allPorts) {
      const key = port.getConfig().key
      if (key) {
        existingKeys.add(key)
      }
    }

    // If the base key doesn't exist, return it directly
    if (!existingKeys.has(baseKey))
      return baseKey

    // Try adding numeric suffixes until we find an available key
    let suffix = 1
    let candidateKey = `${baseKey}_${suffix}`

    while (existingKeys.has(candidateKey)) {
      suffix++
      candidateKey = `${baseKey}_${suffix}`
    }

    return candidateKey
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Transfer values from input properties to corresponding output properties
    const connectionMap = this.connections

    for (const [inputKey, outputKey] of Object.entries(connectionMap)) {
      try {
        // Get the value from input and set it to the output
        this.outputObject[outputKey] = this.inputObject[inputKey]
      } catch (error) {
        console.error(`[GateNode ${this.id}] Error transferring value from ${inputKey} to ${outputKey}:`, error)
      }
    }

    return {}
  }

  async onEvent(event: NodeEvent): Promise<void> {
    await super.onEvent(event)

    if (event.type === NodeEventType.StatusChange) {
      await this.handleStatusChange()
    } else if (event.type === NodeEventType.PortConnected) {
      await this.handlePortConnected(event as PortConnectedEvent)
    } else if (event.type === NodeEventType.PortDisconnected) {
      await this.handlePortDisconnected(event as PortDisconnectedEvent)
    }
  }

  private async handleStatusChange(): Promise<void> {
    await this.ensureHasOneNotConnectedInputAnyPort()
    return Promise.resolve()
  }

  private async handlePortConnected(event: PortConnectedEvent): Promise<void> {
    // If the connection is with one of our inputs
    if (event.sourceNode.id === this.id) {
      const inputPort = event.sourcePort
      const targetPort = event.targetPort

      // Check if this is an input port inside our inputObject
      const inputObjectPort = this.findPortByKey('inputObject')
      if (inputPort.getConfig().parentId === inputObjectPort?.id) {
        const inputKey = inputPort.getConfig().key || ''

        // Check if this input port already has an output mapping
        const connectionMap = this.connections
        if (connectionMap[inputKey]) {
          // This input already has a mapped output port, so ignore this event
          console.log(`[GateNode ${this.id}] Input port ${inputKey} already has an output mapping, ignoring connection event`)
          return
        }

        // Use the target port's key for better readability, ensuring it's unique
        let outputKey = targetPort.key || inputKey
        outputKey = this.getUniquePortKey(outputKey)

        // Update the connections map
        connectionMap[inputKey] = outputKey
        this.saveConnections(connectionMap)

        // Create or update the output port based on the connected port's type
        await this.createOutputPort(inputPort, outputKey, targetPort)
      }
    }

    await this.ensureHasOneNotConnectedInputAnyPort()
  }

  private async handlePortDisconnected(event: PortDisconnectedEvent): Promise<void> {
    if (event.sourceNode.id === this.id) {
      const inputPort = event.sourcePort
      const inputObjectPort = this.findPortByKey('inputObject')

      // Only process for our input ports
      if (inputPort.getConfig().parentId === inputObjectPort?.id) {
        const inputKey = inputPort.getConfig().key || ''

        // Get the current connection map
        const connectionMap = this.connections

        // Find the output key this input was mapped to
        const outputKey = connectionMap[inputKey]

        if (outputKey) {
          // Remove this mapping from connections
          delete connectionMap[inputKey]
          this.saveConnections(connectionMap)

          // Check if any other input uses this output key
          const isOutputKeyUsed = Object.values(connectionMap).includes(outputKey)

          // Only remove the output port if it's not used by any other input
          if (!isOutputKeyUsed) {
            const outputObjectPort = this.findPortByKey('outputObject')
            if (outputObjectPort) {
              this.removeObjectProperty(outputObjectPort, outputKey)
              await this.updatePort(outputObjectPort)
            }
          }
        }
      }
    }

    await this.ensureHasOneNotConnectedInputAnyPort()
  }

  private async createOutputPort(
    inputPort: IPort,
    outputKey: string,
    targetPort: IPort<IPortConfig>,
  ): Promise<void> {
    const outputObjectPort = this.findPortByKey('outputObject')
    if (!outputObjectPort)
      return

    const inputPortConfig = inputPort.getConfig()
    const inputOrder = inputPortConfig.order || 0

    // Determine the port type to create based on the input port
    let portConfig

    if (inputPortConfig.type === 'any') {
      // Get the underlying type for 'any' ports
      const anyPort = inputPort as AnyPort
      const underlyingType = anyPort.getRawConfig().underlyingType

      if (!underlyingType) {
        // If no underlying type, we don't create an output yet
        return
      }

      portConfig = {
        ...underlyingType,
        id: `${this.id}_${outputKey}`,
        key: outputKey,
        nodeId: this.id,
        parentId: outputObjectPort.id,
        direction: 'output',
        order: inputOrder, // Inherit order from input port
      }
    } else {
      // For non-any ports, use their config directly
      portConfig = {
        ...inputPortConfig,
        id: `${this.id}_${outputKey}`,
        key: outputKey,
        nodeId: this.id,
        parentId: outputObjectPort.id,
        direction: 'output',
        order: inputOrder, // Inherit order from input port
      }
    }

    // Add the output port to the output object
    this.addObjectProperty(outputObjectPort, outputKey, portConfig)
    await this.updatePort(outputObjectPort)
  }

  private async ensureHasOneNotConnectedInputAnyPort(): Promise<void> {
    const gateInputObjectPort = this.findPortByKey('inputObject')
    if (!gateInputObjectPort)
      return

    // Find empty any ports (those without connections or underlying type)
    const emptyAnyPorts = filterPorts(this, (port) => {
      const config = port.getConfig()
      if (config.type !== 'any')
        return false

      const anyPort = port as AnyPort
      const underlyingType = anyPort.getRawConfig().underlyingType

      return config.parentId === gateInputObjectPort.id
        && !underlyingType
        && (!config.connections || config.connections.length === 0)
    }).sort((a, b) => {
      const aOrder = a.getConfig().order ?? 100
      const bOrder = b.getConfig().order ?? 100
      return aOrder - bOrder
    })

    if (emptyAnyPorts.length === 0) {
      // Create a new empty any port if none exists
      const nextId = this.getNextAvailableInputPortId()
      const nextOrder = this.getNextAvailableOrder()
      const basePortId = `gate-input-${nextId}`
      const newPortId = this.getUniquePortKey(basePortId)

      const gateInputAnyPort = new AnyPort({
        id: newPortId,
        type: 'any',
        key: newPortId,
        parentId: gateInputObjectPort.id,
        nodeId: this.id,
        order: nextOrder, // Set proper order for sorting
        direction: 'input',
        connections: [],
      })

      this.addObjectProperty(
        gateInputObjectPort,
        gateInputAnyPort.key,
        gateInputAnyPort.getConfig(),
      )
      await this.updatePort(gateInputObjectPort)
    } else if (emptyAnyPorts.length > 1) {
      // Remove excess empty ports, keeping just one
      const portsToRemove = emptyAnyPorts.slice(1)

      for (const port of portsToRemove) {
        this.removeObjectProperty(gateInputObjectPort, port.getConfig().key || '')
      }

      await this.updatePort(gateInputObjectPort)
    }
  }

  /**
   * Finds the next available input port ID that's not currently in use
   */
  private getNextAvailableInputPortId(): number {
    const gateInputObjectPort = this.findPortByKey('inputObject')
    if (!gateInputObjectPort)
      return 1

    // Get all child ports of the input object
    const allInputPorts = filterPorts(this, port =>
      port.getConfig().parentId === gateInputObjectPort.id)

    // Extract existing IDs
    const existingIds = new Set<number>()

    for (const port of allInputPorts) {
      const key = port.getConfig().key || ''
      // Extract numeric ID from keys like "gate-input-42"
      const match = key.match(/gate-input-(\d+)/)
      if (match && match[1]) {
        const id = Number.parseInt(match[1], 10)
        if (!Number.isNaN(id)) {
          existingIds.add(id)
        }
      }
    }

    // Find the smallest available ID
    let nextId = 1
    while (existingIds.has(nextId)) {
      nextId++
    }

    return nextId
  }

  /**
   * Finds the next available order value for a new port
   */
  private getNextAvailableOrder(): number {
    const gateInputObjectPort = this.findPortByKey('inputObject')
    if (!gateInputObjectPort)
      return 1

    // Get all child ports of the input object
    const allInputPorts = filterPorts(this, port =>
      port.getConfig().parentId === gateInputObjectPort.id)

    // Find highest existing order
    let maxOrder = 0
    for (const port of allInputPorts) {
      const order = port.getConfig().order || 0
      if (order > maxOrder) {
        maxOrder = order
      }
    }

    return maxOrder + 1
  }
}

export default GateNode
