import type { ExecutionContext } from '@badaitech/chaingraph-types/flow/execution-context'
import type { EventReturnType, NodeEvent, NodeEventDataType } from '@badaitech/chaingraph-types/node/events'
import type { INode } from '@badaitech/chaingraph-types/node/interface'
import type {
  Dimensions,
  NodeUIMetadata,
  NodeUIStyle,
  Position,
} from '@badaitech/chaingraph-types/node/node-ui'
import type {
  NodeExecutionResult,
  NodeMetadata,
  NodeValidationResult,
} from '@badaitech/chaingraph-types/node/types'
import type { IPort, IPortConfig, JSONValue } from '@badaitech/chaingraph-types/port/base'
import {
  getOrCreateNodeMetadata,
} from '@badaitech/chaingraph-types/node/decorator-new/getOrCreateNodeMetadata'
import { NodeEventType } from '@badaitech/chaingraph-types/node/events'
import { NodeStatus } from '@badaitech/chaingraph-types/node/node-enums'
import { SerializedNodeSchema } from '@badaitech/chaingraph-types/node/types.zod'
import { PortDirection } from '@badaitech/chaingraph-types/port/base'
import { PortFactory } from '@badaitech/chaingraph-types/port/factory'
import { portRegistry } from '@badaitech/chaingraph-types/port/registry'
import { deepCopy } from '@badaitech/chaingraph-types/utils/deep-copy'
import { EventQueue } from '@badaitech/chaingraph-types/utils/event-queue'
import { PortConfigProcessor } from './port-config-processor'
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
    (new PortConfigProcessor()).processNodePorts(this)
    this.initializePorts()
    this.setStatus(NodeStatus.Initialized, false)
  }

  protected initializePorts(): void {
    const ports = this._metadata.portsConfig
    if (!ports) {
      return
    }

    for (const [portId, portConfig] of ports.entries()) {
      this.initializePort(this, portConfig)
    }
  }

  protected initializePort(objectValue: object, portConfig: IPortConfig, parentPortId?: string): void {
    // Create the port instance
    const existsPort = portConfig.id ? this._ports.get(portConfig.id) : undefined
    const port = existsPort ?? PortFactory.createFromConfig(portConfig)

    // Generate a unique port ID if it doesn't exist
    const portId = portConfig.id || `${parentPortId || ''}.${portConfig.key}`

    const connectInternalFields = (val: object) => {
      if (portConfig.type === 'object') {
        // for the object port, initialize its nested ports recursively
        const nestedPorts = portConfig.schema?.properties
        if (nestedPorts) {
          for (const [_, nestedPortConfig] of Object.entries(nestedPorts)) {
            this.initializePort(
              val,
              nestedPortConfig as IPortConfig,
              portId,
            )
          }
        }
      }
    }

    // check if the node has a field with the same key as the port
    if (portConfig.key && Object.prototype.hasOwnProperty.call(objectValue, portConfig.key)) {
      const value = (objectValue as any)[portConfig.key]
      if (value) {
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

    // Store the port in the _ports Map
    if (!existsPort) {
      this._ports.set(portId, port)
    }

    connectInternalFields(port.getValue() as object)
    // if (portConfig.type === 'object') {
    //   // for the object port, initialize its nested ports recursively
    //   const nestedPorts = portConfig.schema?.properties
    //   if (nestedPorts) {
    //     for (const [_, nestedPortConfig] of Object.entries(nestedPorts)) {
    //       this.initializePort(
    //         port.getValue() as object,
    //         nestedPortConfig as IPortConfig,
    //         portId,
    //       )
    //     }
    //   }
    // }
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
    // Create a new instance of the node with the same configuration
    // const clonedNode = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this))
    // clonedNode.id = `${this._id}_clone` // Optionally, assign a new ID
    // If there are nested objects, you might need a deep clone

    // TODO: Implement deep clone
    return this
  }

  addPort(port: IPort): IPort {
    if (!port.id) {
      throw new Error('Port ID is required.')
    }

    this._ports.set(port.id!, port)

    // TODO: add event and version update

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

  /**
   * Set the node metadata. Does not emit an event and does not update the version.
   * @param metadata
   */
  setMetadata(metadata: NodeMetadata): void {
    this._metadata = metadata
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
   * Updates node UI state
   * @param state New UI state
   * @param emitEvent
   */
  setUIState(state: NodeUIMetadata['state'], emitEvent?: boolean): void {
    const oldState = this._metadata.ui?.state
    if (!this._metadata.ui) {
      this._metadata.ui = { state }
    } else {
      this._metadata.ui.state = state
    }

    if (!emitEvent) {
      return
    }

    this.incrementVersion()

    this.emit(this.createEvent(NodeEventType.UIStateChange, {
      oldState,
      newState: state,
    }))
  }

  /**
   * Updates node UI style
   * @param style New UI style
   * @param emitEvent
   */
  setUIStyle(style: NodeUIStyle, emitEvent?: boolean): void {
    const oldStyle = this._metadata.ui?.style
    if (!this._metadata.ui) {
      this._metadata.ui = { style }
    } else {
      this._metadata.ui.style = style
    }

    if (!emitEvent) {
      return
    }

    // update the version
    this.incrementVersion()

    this.emit(this.createEvent(NodeEventType.UIStyleChange, {
      oldStyle,
      newStyle: style,
    }))
  }

  /**
   * Gets current node UI metadata
   * @returns Node UI metadata or undefined if not set
   */
  getUIMetadata(): NodeUIMetadata | undefined {
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
        const plugin = portRegistry.getPlugin(config.type)
        serializedPortsConfig[key.toString()] = plugin
          ? plugin.serializeConfig(config)
          : config
      }
    }

    // Serialize ports values only.
    const serializedPortsValues: Record<string, JSONValue> = {}
    for (const [portId, port] of this._ports.entries()) {
      const serializedPort = port.serialize()
      // If the serialized port appears to include a "value" property, extract it.
      if (typeof serializedPort === 'object' && serializedPort && 'value' in serializedPort) {
        serializedPortsValues[portId] = (serializedPort as any).value
      } else {
        serializedPortsValues[portId] = serializedPort
      }
    }

    return {
      id: this._id,
      metadata: {
        ...this._metadata,
        portsConfig: serializedPortsConfig,
      },
      status: this._status,
      ports_values: serializedPortsValues,
    }
  }

  /**
   * Deserializes the given JSON data into the node.
   * This implementation uses the PortFactory to re-create each port instance,
   * then uses the appropriate port plugin to set the port value from the serialized data.
   */
  deserialize(data: JSONValue): this {
    debugger

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
          const plugin = portRegistry.getPlugin(configData.type)

          deserializedPortsConfig.set(
            key,
            plugin
              ? plugin.deserializeConfig(configData)
              : configData,
          )
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

    // Initialize the node and ports from config.
    this.initialize()

    // We now use the "ports_values" field (instead of "ports") from the serialized object.
    const portsValues = obj.ports_values || {} as Record<string, JSONValue>

    // For each key in ports_values we recreate the port.
    for (const portId in portsValues) {
      const portValue = portsValues[portId]
      if (portValue === undefined) {
        continue
      }

      const port = this.getPort(portId)
      if (!port) {
        console.warn(`Port with ID ${portId} not found in node ${this.id}.`)
        continue
      }

      const plugin = portRegistry.getPlugin(port.getConfig().type)
      if (plugin) {
        const deserializedValue = plugin.deserializeValue(portValue, port.getConfig())
        port.setValue(deserializedValue)
      } else {
        port.setValue(portValue)
      }
    }

    return this
  }
}
