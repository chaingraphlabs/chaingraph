import type { ExecutionContext } from '@chaingraph/types/flow/execution-context'
import type {
  EventReturnType,
  NodeEvent,
  NodeEventDataType,
} from '@chaingraph/types/node/events'
import type { INode } from '@chaingraph/types/node/interface'
import type { Dimensions, NodeUIMetadata, NodeUIStyle, Position } from '@chaingraph/types/node/node-ui'
import type {
  NodeExecutionResult,
  NodeMetadata,
  NodeValidationResult,
} from '@chaingraph/types/node/types'
import type { PortConfig } from '@chaingraph/types/port'
import type { IPort } from '@chaingraph/types/port/types/port-interface'
import { NodeEventType } from '@chaingraph/types/node/events'
import { NodeStatus } from '@chaingraph/types/node/node-enums'
import { ObjectPort, PortFactory } from '@chaingraph/types/port'
import { PortDirection } from '@chaingraph/types/port/types/port-direction-union'
import { EventQueue } from '@chaingraph/types/utils/event-queue'
import { getOrCreateNodeMetadata } from './decorator/node-decorator'
import { PortConfigProcessor } from './port-config-processor'
import 'reflect-metadata'

export abstract class BaseNode implements INode {
  protected readonly _id: string
  protected _metadata: NodeMetadata
  protected _status: NodeStatus = NodeStatus.Idle
  protected _ports: Map<string, IPort<any>> = new Map()

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

    for (const [portId, portConfig] of ports) {
      this.initializePort(this, portConfig)
    }
  }

  protected initializePort(objectValue: object, portConfig: PortConfig, parentPortId?: string): void {
    // Create the port instance
    const port = PortFactory.create(portConfig)

    // Generate a unique port ID if it doesn't exist
    const portId = portConfig.id || `${parentPortId || ''}.${portConfig.key}`

    // check if the node has a field with the same key as the port
    if (portConfig.key && Object.prototype.hasOwnProperty.call(objectValue, portConfig.key)) {
      const value = (objectValue as any)[portConfig.key]
      if (value) {
        port.setValue(value)
      }

      // set up a getter and setter for the field
      Object.defineProperty(objectValue, portConfig.key, {
        get: () => {
          return port.getValue()
        },
        set: (newValue: any) => {
          port.setValue(newValue)
        },
        configurable: true,
        enumerable: true,
      })
    }

    // Store the port in the _ports Map
    this._ports.set(portId, port)

    if (ObjectPort.isObjectPortConfig(portConfig)) {
      // for the object port, initialize its nested ports recursively
      const nestedPorts = portConfig.schema?.properties
      if (nestedPorts) {
        for (const [nestedPortId, nestedPortConfig] of Object.entries(nestedPorts)) {
          this.initializePort(
            port.value,
            nestedPortConfig,
            portId,
          )
        }
      }
    }
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
  get ports(): Map<string, IPort<any>> {
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

  getPort(portId: string): IPort<any> | undefined {
    return this._ports.get(portId)
  }

  hasPort(portId: string): boolean {
    return this._ports.has(portId)
  }

  getInputs(): IPort<any>[] {
    return Array.from(
      this._ports
        .values()
        .filter(port => port.config.direction === PortDirection.Input),
    )
  }

  getOutputs(): IPort<any>[] {
    return Array.from(
      this._ports.values()
        .filter(port => port.config.direction === PortDirection.Output),
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
  protected emit<T extends NodeEvent>(event: T): Promise<Awaited<void>[]> {
    if (this.eventsDisabled) {
      return Promise.resolve([])
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

  addPort(port: IPort<any>): IPort<any> {
    if (!port.config.id) {
      throw new Error('Port ID is required.')
    }

    this._ports.set(port.config.id, port)

    // TODO: add event and version update

    return port
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
}
