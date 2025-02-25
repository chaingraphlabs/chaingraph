/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../execution'
import type { EventReturnType, NodeEvent, NodeEventDataType } from '../node/events'
import type { INode } from '../node/interface'
import type { Dimensions, NodeUIMetadata, Position } from '../node/node-ui'
import type { NodeExecutionResult, NodeMetadata, NodeValidationResult } from '../node/types'
import type { IPort, IPortConfig } from '../port'
import type { JSONValue } from '../utils/json'
import { getOrCreateNodeMetadata } from '../decorator'
import { NodeEventType } from '../node/events'
import { NodeStatus } from '../node/node-enums'
import { PortConfigProcessor } from '../node/port-config-processor'
import { SerializedNodeSchema } from '../node/types.zod'
import { PortDirection, PortFactory, PortPluginRegistry } from '../port'
import { deepCopy, EventQueue } from '../utils'
import 'reflect-metadata'

export abstract class BaseNode implements INode {
  protected readonly _id: string
  protected _metadata: NodeMetadata
  protected _status: NodeStatus = NodeStatus.Idle
  protected _ports: Map<string, IPort> = new Map()

  protected eventQueue = new EventQueue<NodeEvent>()
  private eventsDisabled = false

  constructor(id: string, _metadata?: NodeMetadata) {
    this._id = id

    // Get node metadata
    if (_metadata) {
      if (!_metadata.type) {
        throw new Error('Node type is required in metadata.')
      }

      this._metadata = { ..._metadata }
    } else {
      const metadata = getOrCreateNodeMetadata(this)
      if (!metadata) {
        throw new Error('Node metadata missing. Ensure @Node decorator is used or metadata is provided.')
      }

      if (!metadata.type) {
        throw new Error('Node type is required in metadata.')
      }

      this._metadata = { ...metadata }
    }

    // Initialize version if not set
    if (!this._metadata.version) {
      this._metadata.version = 1
    }

    // if (this._id !== '' && this._id !== this._metadata.id) {
    //   this._metadata.id = this._id
    // }
  }

  abstract execute(context: ExecutionContext): Promise<NodeExecutionResult>

  initialize(): void {
    // Process PortConfigs using PortConfigProcessor
    this._metadata = (new PortConfigProcessor()).processNodePorts(this)
    this.initializePorts()
    this.setStatus(NodeStatus.Initialized, false)
  }

  initializePorts(): void {
    const ports = this._metadata.portsConfig
    if (!ports) {
      return
    }

    const newPorts = new Map<string, IPort>()
    for (const [_, portConfig] of ports.entries()) {
      const ports = this.initializePort(this, portConfig)
      for (const port of ports) {
        newPorts.set(port.id, port)

        // check if portConfigWithSame key exists
        if (port.getConfig().key && !port.getConfig().parentId) {
          // update metadata port config from the initialized port
          this.setPortConfig(
            port.getConfig().key ?? port.getConfig().id ?? 'new_port',
            port.getConfig(),
          )
        }
      }
    }

    this._ports = newPorts
  }

  protected initializePort(
    objectValue: object,
    portConfig: IPortConfig,
    parentPortId?: string,
  ): IPort[] {
    const ports: IPort[] = []

    // Create the port instance
    const existsPort = portConfig.id ? this._ports.get(portConfig.id) : undefined
    if (existsPort) {
      existsPort.setConfig(portConfig)
    }
    const port = existsPort ?? PortFactory.createFromConfig(portConfig)

    // Generate a unique port ID if it doesn't exist
    const portId = portConfig.id ?? `${parentPortId ?? ''}.${portConfig.key}`

    const connectInternalFields = (val: object) => {
      if (portConfig.type === 'object') {
        // for the object port, initialize its nested ports recursively
        const nestedPorts = portConfig.schema?.properties
        if (nestedPorts) {
          for (const [_, nestedPortConfig] of Object.entries(nestedPorts)) {
            const childPorts = this.initializePort(
              val,
              nestedPortConfig as IPortConfig,
              portId,
            )
            for (const childPort of childPorts) {
              ports.push(childPort)
            }
          }
        }
      }
    }

    // check if the node has a field with the same key as the port
    if (portConfig.key && objectValue && Object.prototype.hasOwnProperty.call(objectValue, portConfig.key)) {
      const value = (objectValue as any)[portConfig.key]
      if (value !== undefined) {
        port.setValue(deepCopy(value))
      }

      // set up a getter and setter for the field
      Object.defineProperty(objectValue, portConfig.key, {
        get: () => {
          return port.getValue()
        },
        set: (newValue: any) => {
          port.setValue(newValue)
          connectInternalFields(port.getValue() as object)
        },
        configurable: true,
        enumerable: true,
      })
    }

    ports.push(port)
    connectInternalFields(port.getValue() as object)

    return ports
  }

  /**
   * Get the node ID
   */
  get id(): string {
    return this._id
  }

  /**
   * Get the node metadata
   */
  get metadata(): NodeMetadata {
    return this._metadata
  }

  /**
   * Get the node status
   */
  get status(): NodeStatus {
    return this._status
  }

  /**
   * Get the node inputs
   */
  get ports(): Map<string, IPort> {
    return this._ports
  }

  async validate(): Promise<NodeValidationResult> {
    // TODO: Validation logic
    return { isValid: true, messages: [] }
  }

  async reset(): Promise<void> {
    // Reset ports
    for (const port of this.ports.values()) {
      port.reset()
    }
    this.setStatus(NodeStatus.Idle, false)
  }

  async dispose(): Promise<void> {
    this._ports.clear()

    // Close event queue
    await this.eventQueue.close()

    this.setStatus(NodeStatus.Disposed, false)
  }

  getPort(portId: string): IPort | undefined {
    return this._ports.get(portId)
  }

  hasPort(portId: string): boolean {
    return this._ports.has(portId)
  }

  getInputs(): IPort[] {
    return Array.from(
      this._ports
        .values()
        .filter(port => port.getConfig().direction === PortDirection.Input),
    )
  }

  getOutputs(): IPort[] {
    return Array.from(
      this._ports.values()
        .filter(port => port.getConfig().direction === PortDirection.Output),
    )
  }

  /**
   * Subscribe to node events of a specific type.
   * @param eventType - The type of event to subscribe to.
   * @param handler - The event handler function.
   * @returns An unsubscribe function.
   */
  on<T extends NodeEvent>(
    eventType: T['type'],
    handler: (event: T) => void,
  ): () => void {
    return this.eventQueue.subscribe((event) => {
      if (event.type === eventType) {
        handler(event as T)
      }
    })
  }

  /**
   * Subscribe to all node events.
   * @param handler - The event handler function.
   * @returns An unsubscribe function.
   */
  onAll(handler: (event: NodeEvent) => void): () => void {
    return this.eventQueue.subscribe(handler)
  }

  /**
   * Emit an event to all subscribers.
   * @param event - The event object.
   */
  protected emit<T extends NodeEvent>(event: T): Promise<void> {
    if (this.eventsDisabled) {
      return Promise.resolve()
    }

    return this.eventQueue.publish(event)
  }

  clone(): INode {
    const serialized = this.serialize()
    const node = new (this.constructor as any)(this.id) as INode
    return node.deserialize(serialized)
  }

  setPort(port: IPort): IPort {
    if (!port.id) {
      throw new Error('Port ID is required.')
    }

    this._ports.set(port.id!, port)

    return port
  }

  setPorts(ports: Map<string, IPort>): void {
    this._ports = ports
  }

  removePort(portId: string): void {
    if (this._ports.delete(portId)) {
      // Port removed successfully
      // TODO: add event and version update
    } else {
      throw new Error(`Port with ID ${portId} does not exist in inputs or outputs.`)
    }
  }

  updatePort(portId: string, port: IPort): void {
    if (!this._ports.has(portId)) {
      throw new Error(`Port with ID ${portId} does not exist in inputs or outputs.`)
    }

    this.incrementVersion()
    this._ports.set(portId, port)
    this.emit(this.createEvent(NodeEventType.PortUpdate, {
      portId,
      port,
    }))
  }

  /**
   * Set the node metadata. Does not emit an event and does not update the version.
   * @param metadata
   */
  setMetadata(metadata: NodeMetadata): void {
    this._metadata = metadata
  }

  setPortConfig(portId: string, config: IPortConfig): void {
    if (this._metadata.portsConfig) {
      this._metadata.portsConfig.set(portId, config)
    } else {
      this._metadata.portsConfig = new Map([[portId, config]])
    }
  }

  setStatus(status: NodeStatus, emitEvent?: boolean): void {
    const oldStatus = this._status
    this._status = status

    if (!emitEvent) {
      return
    }
    this.incrementVersion()
    this.emit(this.createEvent(NodeEventType.StatusChange, {
      oldStatus,
      newStatus: status,
    }))
  }

  /**
   * Updates node UI position
   * @param position New position coordinates
   * @param emitEvent
   */
  setPosition(position: Position, emitEvent?: boolean): void {
    const oldPosition = this._metadata.ui?.position
    if (!this._metadata.ui) {
      this._metadata = {
        ...this._metadata,
        ui: {
          position,
        },
      }
    } else {
      this._metadata = {
        ...this._metadata,
        ui: {
          ...this._metadata.ui,
          position,
        },
      }
    }

    if (!emitEvent) {
      return
    }

    // update the version
    this.incrementVersion()

    this.emit(this.createEvent(NodeEventType.UIPositionChange, {
      oldPosition,
      newPosition: { ...position },
    }))
  }

  setNodeParent(position: Position, parentNodeId?: string, emitEvent?: boolean): void {
    const oldParent = this._metadata?.parentNodeId ?? undefined
    const oldPosition = this._metadata?.ui?.position

    this._metadata.parentNodeId = parentNodeId
    if (!this._metadata.ui) {
      this._metadata.ui = { position }
    } else {
      this._metadata.ui.position = position
    }

    if (!emitEvent) {
      return
    }

    this.incrementVersion()
    this.emit(this.createEvent(NodeEventType.ParentChange, {
      oldParentNodeId: oldParent,
      newParentNodeId: parentNodeId,
      oldPosition,
      newPosition: position,
    }))
  }

  setDimensions(dimensions: Dimensions, emitEvent?: boolean): void {
    const oldDimensions = this._metadata.ui?.dimensions
    if (!this._metadata.ui) {
      this._metadata.ui = { dimensions }
    } else {
      this._metadata.ui.dimensions = dimensions
    }

    if (!emitEvent) {
      return
    }

    this.incrementVersion()
    this.emit(this.createEvent(NodeEventType.UIDimensionsChange, {
      oldDimensions,
      newDimensions: dimensions,
    }))
  }

  /**
   * Updates node UI metadata
   * @param ui New UI metadata
   * @param emitEvent
   */
  setUI(ui: NodeUIMetadata, emitEvent?: boolean): void {
    if (!this._metadata.ui) {
      this._metadata.ui = ui
    } else {
      this._metadata.ui = { ...this._metadata.ui, ...ui }
    }

    if (!emitEvent) {
      return
    }

    // update the version
    this.incrementVersion()

    this.emit(this.createEvent(NodeEventType.UIChange, {
      ui: this._metadata.ui,
    }))
  }

  /**
   * Gets current node UI metadata
   * @returns Node UI metadata or undefined if not set
   */
  getUI(): NodeUIMetadata | undefined {
    return this._metadata.ui
  }

  /**
   * Disables node events to prevent event emission
   */
  disableEvents(): void {
    this.eventsDisabled = true
  }

  /**
   * Enables node events to allow event emission
   */
  enableEvents(): void {
    this.eventsDisabled = false
  }

  incrementVersion(): number {
    this._metadata.version = this.getVersion() + 1
    return this._metadata.version
  }

  getVersion(): number {
    return this._metadata.version || 0
  }

  protected createEvent<T extends NodeEventType>(
    type: T,
    data: NodeEventDataType<T>,
  ): EventReturnType<T> {
    return {
      type,
      nodeId: this.id,
      timestamp: new Date(),
      version: this.getVersion(),
      ...data,
    } as EventReturnType<T>
  }

  /**
   * Serializes the node into a JSON-compatible object.
   * In this implementation we only serialize the port values (reducing object size).
   */
  serialize(): JSONValue {
    // Helper: serialize the ports configuration from metadata.
    const serializedPortsConfig: Record<string, JSONValue> = {}
    if (this._metadata.portsConfig) {
      for (const [key, config] of this._metadata.portsConfig.entries()) {
        const plugin = PortPluginRegistry.getInstance().getPlugin(config.type)
        serializedPortsConfig[key.toString()] = plugin
          ? plugin.serializeConfig(config)
          : config
      }
    }

    // Serialize ports values only.
    // const serializedPortsValues: Record<string, JSONValue> = {}
    const serializedPorts: Record<string, JSONValue> = {}
    for (const [portId, port] of this._ports.entries()) {
      serializedPorts[portId] = port.serialize()
    }

    return {
      id: this._id,
      metadata: {
        ...this._metadata,
        portsConfig: serializedPortsConfig,
      },
      status: this._status,
      ports: serializedPorts,
    }
  }

  /**
   * Deserializes the given JSON data into the node.
   * This implementation uses the PortFactory to re-create each port instance,
   * then uses the appropriate port plugin to set the port value from the serialized data.
   */
  deserialize(data: JSONValue): this {
    // Validate incoming data using the Zod schema.
    const obj = SerializedNodeSchema.parse(data)

    // Update node status (id is typically immutable).
    this._status = obj.status

    // Deserialize metadata and portsConfig.
    const metadataFromData = obj.metadata || {}
    const deserializedPortsConfig: Map<string, IPortConfig> = new Map()
    if (metadataFromData.portsConfig && typeof metadataFromData.portsConfig === 'object') {
      for (const key in metadataFromData.portsConfig) {
        const configData = metadataFromData.portsConfig[key]
        if (configData && typeof configData === 'object' && 'type' in configData) {
          const plugin = PortPluginRegistry.getInstance().getPlugin(configData.type)
          if (!plugin) {
            throw new Error(`No plugin found for port type "${configData.type}"`)
          }

          const deserializedConfig = plugin.deserializeConfig(configData)
          deserializedPortsConfig.set(key, deserializedConfig)
        }
      }
    }
    this._metadata = {
      ...this._metadata,
      ...metadataFromData,
      portsConfig: deserializedPortsConfig,
    }

    // Clear current ports map.
    this._ports.clear()

    // We now use the "ports_values" field (instead of "ports") from the serialized object.
    const ports = obj.ports as Record<string, any>

    // For each key in ports_values we recreate the port.
    const nodePorts = new Map<string, IPort>()
    for (const portId in ports) {
      const serializedPort = ports[portId]
      if (serializedPort === undefined || serializedPort === null || !('config' in serializedPort)) {
        continue
      }

      const newPort = PortFactory.create(serializedPort.config)
      newPort.deserialize(serializedPort)

      const portConfig = newPort.getConfig()

      // check if the node has a field with the same key as the port then set the port value to the node field
      if (portConfig.key && Object.prototype.hasOwnProperty.call(this, portConfig.key)) {
        if (portConfig.parentId === '') {
          continue
        }
        (this as any)[portConfig.key] = newPort.getValue()
      }

      nodePorts.set(portId, newPort as IPort)
    }

    // this._ports = nodePorts

    // this.initialize()
    this.initializePorts()

    return this
  }
}
