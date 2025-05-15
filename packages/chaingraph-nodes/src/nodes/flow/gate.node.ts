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
  PortCreateEvent,
  PortDeleteEvent,
  PortDisconnectedEvent,
  PortUpdateEvent,
} from '@badaitech/chaingraph-types'
import {
  findPort,
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

  // ------------------------------------------------------------------------------
  // EXECUTION & EVENT HANDLING
  // ------------------------------------------------------------------------------

  /**
   * Execute the node by transferring values from input ports to output ports
   */
  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const connectionMap = this.getConnectionMap()

    // Transfer values from inputs to corresponding outputs
    for (const [inputKey, outputKey] of Object.entries(connectionMap)) {
      try {
        const inputPort = this.inputObject[inputKey]
        if (!inputPort)
          continue

        if (typeof inputPort === 'object') {
          for (const [key, value] of Object.entries(inputPort)) {
            if (typeof value === 'object' && value !== null) {
              // If the value is an object, we need to create a new object for the output
              this.outputObject[outputKey] = {
                ...this.outputObject[outputKey],
                [key]: value,
              }
            } else {
              this.outputObject[outputKey] = {
                ...this.outputObject[outputKey],
                [key]: value,
              }
            }
          }
        } else {
          this.outputObject[outputKey] = this.inputObject[inputKey]
        }
      } catch (error) {
        this.logError(`Error transferring value from ${inputKey} to ${outputKey}:`, error)
      }
    }

    return {}
  }

  /**
   * Handle node events to maintain port synchronization
   */
  async onEvent(event: NodeEvent): Promise<void> {
    await super.onEvent(event)

    switch (event.type) {
      case NodeEventType.StatusChange:
        await this.handleStatusChange()
        break
      case NodeEventType.PortUpdate:
        await this.handlePortUpdate(event as PortUpdateEvent)
        break
      case NodeEventType.PortCreate:
        await this.handlePortCreate(event as PortCreateEvent)
        break
      case NodeEventType.PortDelete:
        await this.handlePortDelete(event as PortDeleteEvent)
        break
      case NodeEventType.PortConnected:
        await this.handlePortConnected(event as PortConnectedEvent)
        break
      case NodeEventType.PortDisconnected:
        await this.handlePortDisconnected(event as PortDisconnectedEvent)
        break
    }
  }

  /**
   * Handle port creation events - create matching output ports for manually added inputs
   */
  private async handlePortCreate(event: PortCreateEvent): Promise<void> {
    const inputObjectPort = this.getInputObjectPort()

    // Only process creation events for ports that are children of our input object
    if (event.port.getConfig().parentId !== inputObjectPort?.id) {
      return
    }

    const inputPort = event.port
    const inputKey = inputPort.getConfig().key || ''

    // Skip "any" ports as they're handled separately
    if (inputPort.getConfig().type === 'any') {
      // Just ensure we maintain one empty "any" port
      await this.ensureHasOneEmptyAnyPort()
      return
    }

    // For non-any ports (manually added), immediately create matching output port
    const connectionMap = this.getConnectionMap()

    // Skip if this input already has a mapping
    if (connectionMap[inputKey]) {
      return
    }

    // Create output port with the same key (or a unique one if needed)
    // const outputKey = this.getUniquePortKey(inputKey)
    const outputKey = inputKey

    // Update connection map
    connectionMap[inputKey] = outputKey
    this.saveConnectionMap(connectionMap)

    // Create the corresponding output port
    await this.createOutputPort(inputPort, outputKey, inputPort)
  }

  /**
   * Handle port deletion events - remove matching output ports
   */
  private async handlePortDelete(event: PortDeleteEvent): Promise<void> {
    const inputObjectPort = this.getInputObjectPort()

    // Only process deletion events for ports that are children of our input object
    if (event.port.getConfig().parentId !== inputObjectPort?.id) {
      return
    }

    const inputKey = event.port.getConfig().key || ''
    const connectionMap = this.getConnectionMap()
    const outputKey = connectionMap[inputKey]

    if (!outputKey) {
      return
    }

    // Remove this mapping from connection map
    delete connectionMap[inputKey]
    this.saveConnectionMap(connectionMap)

    // Check if any other input still maps to this output
    const isOutputKeyStillUsed = Object.values(connectionMap).includes(outputKey)

    // Only remove the output port if not used by other inputs
    if (!isOutputKeyStillUsed) {
      const outputObjectPort = this.getOutputObjectPort()
      if (outputObjectPort) {
        this.removeObjectProperty(outputObjectPort, outputKey)
      }
    }
  }

  /**
   * Handle port update events (when ports are manually added/changed)
   */
  private async handlePortUpdate(event: PortUpdateEvent): Promise<void> {
    const inputObjectPort = this.getInputObjectPort()
    if (event.port.getConfig().parentId === inputObjectPort?.id) {
      // Check if the port is an "any" port
      if (event.port.getConfig().type === 'any') {
        // Ensure we maintain one empty "any" port
        await this.ensureHasOneEmptyAnyPort()
      } else {
        // For non-any ports, ensure the output port is created/updated
        const inputKey = event.port.getConfig().key || ''
        const connectionMap = this.getConnectionMap()
        const outputKey = connectionMap[inputKey]

        if (!outputKey) {
          // If no mapping exists, create a new output port
          await this.createOutputPort(event.port, inputKey, event.port)
        } else {
          // remove and create the output port again
          const outputObjectPort = this.getOutputObjectPort()
          if (!outputObjectPort)
            return

          const currentOutputPort = findPort(this, port =>
            port.getConfig().parentId === outputObjectPort?.id
            && port.getConfig().key === outputKey)

          // remove the current output port
          if (currentOutputPort) {
            this.removeObjectProperty(outputObjectPort as IPort, outputKey)
          }

          // create the output port again
          const outputPort = await this.createOutputPort(event.port, outputKey, event.port)
          if (outputPort && currentOutputPort) {
            // copy the connections from the current output port to the new one
            const connections = currentOutputPort.getConfig().connections || []
            outputPort.setConfig({
              ...outputPort.getConfig(),
              connections,
            })

            // update the output port
            await this.updatePort(outputPort)
          }
        }
      }
    }
  }

  /**
   * Handle status change events
   */
  private async handleStatusChange(): Promise<void> {
    await this.ensureHasOneEmptyAnyPort()
  }

  /**
   * Handle port connection events - specifically for "any" ports
   */
  private async handlePortConnected(event: PortConnectedEvent): Promise<void> {
    // Only process connections from our own inputs and for "any" ports
    if (event.sourceNode.id !== this.id) {
      return
    }

    const inputPort = event.sourcePort
    const inputObjectPort = this.getInputObjectPort()

    // Check if this is an input port in our inputObject
    if (inputPort.getConfig().parentId !== inputObjectPort?.id) {
      return
    }

    // We only need to handle "any" type ports here
    // Regular ports are handled by the PortCreate event
    if (inputPort.getConfig().type === 'any') {
      const inputKey = inputPort.getConfig().key || ''
      const connectionMap = this.getConnectionMap()

      // Skip if already mapped
      if (connectionMap[inputKey]) {
        return
      }

      // Create a new output port with a unique key based on target port
      const baseOutputKey = event.targetPort.key || inputKey
      const outputKey = this.getUniquePortKey(baseOutputKey)

      // Update connection map
      connectionMap[inputKey] = outputKey
      this.saveConnectionMap(connectionMap)

      // Create the output port based on the connected port's type
      await this.createOutputPort(inputPort, outputKey, event.targetPort)
    }

    // Ensure we maintain one empty "any" port
    await this.ensureHasOneEmptyAnyPort()
  }

  /**
   * Handle port disconnection events - specifically for "any" ports
   */
  private async handlePortDisconnected(event: PortDisconnectedEvent): Promise<void> {
    // Only process disconnections from our own inputs
    if (event.sourceNode.id !== this.id) {
      return
    }

    const inputPort = event.sourcePort
    const inputObjectPort = this.getInputObjectPort()

    // Check if this is an "any" port in our inputObject
    if (inputPort.getConfig().parentId === inputObjectPort?.id
      && inputPort.getConfig().type === 'any') {
      const inputKey = inputPort.getConfig().key || ''
      const connectionMap = this.getConnectionMap()
      const outputKey = connectionMap[inputKey]

      if (outputKey) {
        // Remove this mapping from connection map
        delete connectionMap[inputKey]
        this.saveConnectionMap(connectionMap)

        // Check if any other input uses this output key
        const isOutputKeyStillUsed = Object.values(connectionMap).includes(outputKey)

        // Only remove the output port if it's not used by any other input
        if (!isOutputKeyStillUsed) {
          const outputObjectPort = this.getOutputObjectPort()
          if (outputObjectPort) {
            this.removeObjectProperty(outputObjectPort, outputKey)
          }
        }
      }
    }

    // Ensure we always have one empty "any" port available
    await this.ensureHasOneEmptyAnyPort()
  }

  // ------------------------------------------------------------------------------
  // CORE SYNCHRONIZATION METHODS
  // ------------------------------------------------------------------------------

  /**
   * Ensure there's exactly one empty 'any' input port
   */
  private async ensureHasOneEmptyAnyPort(): Promise<void> {
    const inputObjectPort = this.getInputObjectPort()
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

  // ------------------------------------------------------------------------------
  // PORT CREATION & MANAGEMENT
  // ------------------------------------------------------------------------------

  /**
   * Create output port that matches an input port
   */
  private async createOutputPort(
    inputPort: IPort,
    outputKey: string,
    targetPort: IPort<IPortConfig>,
  ): Promise<IPort | undefined> {
    const outputObjectPort = this.getOutputObjectPort()
    if (!outputObjectPort)
      return undefined

    const inputPortConfig = inputPort.getConfig()
    const inputOrder = inputPortConfig.order || 0

    // Create port config based on port type
    let portConfig: IPortConfig

    if (inputPortConfig.type === 'any') {
      // For 'any' ports, use the underlying type if available
      const anyPort = inputPort as AnyPort
      const underlyingType = anyPort.getRawConfig().underlyingType

      if (!underlyingType)
        return undefined

      portConfig = {
        ...underlyingType,
        id: `${this.id}_${outputKey}`,
        key: outputKey,
        nodeId: this.id,
        parentId: outputObjectPort.id,
        direction: 'output',
        order: inputOrder,
        ui: {
          ...(underlyingType.ui || {}),
          hideEditor: true,
        },
        defaultValue: underlyingType.defaultValue,
        title: targetPort ? targetPort.getConfig().title : underlyingType.title || inputPortConfig.title,
        description: targetPort ? targetPort.getConfig().description : underlyingType.description || inputPortConfig.description,
      }
    } else {
      // For other port types, use the input config directly
      portConfig = {
        ...inputPortConfig,
        id: `${this.id}_${outputKey}`,
        key: outputKey,
        nodeId: this.id,
        parentId: outputObjectPort.id,
        direction: 'output',
        order: inputOrder,
        ui: {
          ...(inputPortConfig.ui || {}),
          hideEditor: true,
        },
        defaultValue: inputPortConfig.defaultValue as any,

        title: targetPort ? targetPort.getConfig().title : inputPortConfig.title,
        description: targetPort ? targetPort.getConfig().description : inputPortConfig.description,
      }
    }

    // Add the port to the output object
    return this.addObjectProperty(outputObjectPort, outputKey, portConfig)
  }

  /**
   * Create an empty 'any' port for dynamic connections
   */
  private async createEmptyAnyPort(): Promise<void> {
    const inputObjectPort = this.getInputObjectPort()
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
      direction: 'input',
      connections: [],
    })

    this.addObjectProperty(inputObjectPort, portKey, anyPort.getConfig())
  }

  // ------------------------------------------------------------------------------
  // PORT QUERY HELPERS
  // ------------------------------------------------------------------------------

  /**
   * Get the input object port
   */
  private getInputObjectPort(): IPort | undefined {
    return this.findPortByKey('inputObject')
  }

  /**
   * Get the output object port
   */
  private getOutputObjectPort(): IPort | undefined {
    return this.findPortByKey('outputObject')
  }

  /**
   * Get all input ports
   */
  private getInputPorts(): IPort[] {
    const inputObjectPort = this.getInputObjectPort()
    if (!inputObjectPort)
      return []

    return filterPorts(this, port =>
      port.getConfig().parentId === inputObjectPort.id)
  }

  /**
   * Get all output ports
   */
  private getOutputPorts(): IPort[] {
    const outputObjectPort = this.getOutputObjectPort()
    if (!outputObjectPort)
      return []

    return filterPorts(this, port =>
      port.getConfig().parentId === outputObjectPort.id)
  }

  /**
   * Get empty any ports (no underlying type, no connections)
   */
  private getEmptyAnyPorts(): IPort[] {
    const inputObjectPort = this.getInputObjectPort()
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

  // ------------------------------------------------------------------------------
  // UTILITY METHODS
  // ------------------------------------------------------------------------------

  /**
   * Get connections map from string representation
   */
  private getConnectionMap(): Record<string, string> {
    try {
      return JSON.parse(this.connectionsMap)
    } catch (e) {
      this.logError('Error parsing connections map:', e)
      return {}
    }
  }

  /**
   * Save connections map to string representation
   */
  private saveConnectionMap(connections: Record<string, string>): void {
    try {
      // check if connections has been changed
      const connectionsString = JSON.stringify(connections)
      if (connectionsString === this.connectionsMap)
        return

      this.connectionsMap = connectionsString
    } catch (e) {
      this.logError('Error serializing connections:', e)
    }
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

  /**
   * Log an error with node context
   */
  private logError(message: string, error: any): void {
    console.error(`[GateNode ${this.id}] ${message}`, error)
  }
}

export default GateNode
