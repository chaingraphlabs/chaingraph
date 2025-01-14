import type { ExecutionContext } from '@chaingraph/types/flow/execution-context'
import type {
  NodeDimensionsChangeEvent,
  NodeEvent,
  NodePositionChangeEvent,
  NodeStateChangeEvent,
  NodeStatusChangeEvent,
  NodeStyleChangeEvent,
} from '@chaingraph/types/node/events'
import type { INode } from '@chaingraph/types/node/interface'
import type { NodeUIMetadata } from '@chaingraph/types/node/node-ui'
import type {
  NodeExecutionResult,
  NodeMetadata,
  NodeValidationResult,
} from '@chaingraph/types/node/types'
import type { PortConfig } from '@chaingraph/types/port'
import type { IPort } from '@chaingraph/types/port/types/port-interface'
import { EventEmitter } from 'node:events'
import { NodeEventType } from '@chaingraph/types/node/events'
import { NodeStatus } from '@chaingraph/types/node/node-enums'
import { ArrayPort, EnumPort, ObjectPort, PortFactory, StreamInputPort, StreamOutputPort } from '@chaingraph/types/port'
import { PortDirectionEnum } from '@chaingraph/types/port/types/port-direction'
import { getOrCreateNodeMetadata } from './decorator/node-decorator'
import { PortConfigProcessor } from './port-config-processor'
import 'reflect-metadata'

export abstract class BaseNode implements INode {
  protected readonly _id: string
  protected _metadata: NodeMetadata
  protected _status: NodeStatus = NodeStatus.Idle
  protected _ports: Map<string, IPort<any>> = new Map()

  protected eventEmitter = new EventEmitter()

  constructor(id: string, _metadata?: NodeMetadata) {
    this._id = id

    // Get node metadata
    if (_metadata) {
      if (!_metadata.type) {
        throw new Error('Node type is required in metadata.')
      }

      // const ports = new Map<string, IPort<any>>()
      // const portsConfig = new Map<string, PortConfig>()
      // for (const [key, portConfig] of _metadata?.portsConfig?.entries() || []) {
      //   const portConfigParsed = parsePortConfig(portConfig)
      //   portsConfig.set(key, portConfigParsed)
      //
      //   const port = PortFactory.create(portConfig)
      //   ports.set(key, port)
      // }
      // _metadata.portsConfig = portsConfig

      this._metadata = _metadata
      // this._ports = ports
    } else {
      const metadata = getOrCreateNodeMetadata(this)
      if (!metadata) {
        throw new Error('Node metadata missing. Ensure @Node decorator is used or metadata is provided.')
      }

      if (!metadata.type) {
        throw new Error('Node type is required in metadata.')
      }

      this._metadata = metadata
    }
  }

  abstract execute(context: ExecutionContext): Promise<NodeExecutionResult>

  initialize(): void {
    // Process PortConfigs using PortConfigProcessor
    (new PortConfigProcessor()).processNodePorts(this)
    this.initializePorts()
    this.setStatus(NodeStatus.Initialized)
  }

  protected initializePorts(): void {
    const ports = this._metadata.portsConfig
    if (!ports) {
      return
    }

    for (const [portId, portConfig] of ports) {
      this.initializePort(portConfig)
    }
  }

  protected initializePort(portConfig: PortConfig, parentPortId?: string): void {
    // Create the port instance
    const port = PortFactory.create(portConfig)

    // Generate a unique port ID if it doesn't exist
    const portId = portConfig.id || `${parentPortId || ''}.${portConfig.key}`

    // check if the node has a field with the same key as the port
    if (portConfig.key && Object.prototype.hasOwnProperty.call(this, portConfig.key)) {
      const value = (this as any)[portConfig.key]
      if (value) {
        port.setValue(value)
      }

      // set up a getter and setter for the field
      Object.defineProperty(this, portConfig.key, {
        get: () => {
          return port.value
        },
        set: (newValue: any) => {
          port.setValue(newValue)
        },
        configurable: true,
        enumerable: true,
        // value: true,
        // writable: true,
      })
    }
    // Store the port in the _ports Map
    this._ports.set(portId, port)

    // Handle nested ports based on port kind
    if (ArrayPort.isArrayPortConfig(portConfig)) {
      // Initialize element configuration
      // this.initializePort(portConfig.elementConfig, portId)
    } else if (ObjectPort.isObjectPortConfig(portConfig)) {
      const properties = portConfig.schema.properties
      // for (const [propName, propConfig] of Object.entries(properties)) {
      //   this.initializePort(propConfig, portId)
      // }
    } else if (EnumPort.isEnumPortConfig(portConfig)) {
      // Initialize each option
      // for (const optionConfig of portConfig.options) {
      //   this.initializePort(optionConfig, portId)
      // }
    } else if (StreamInputPort.isStreamInputPortConfig(portConfig) || StreamOutputPort.isStreamOutputPortConfig(portConfig)) {
      // Initialize valueType
      // if (portConfig.valueType) {
      //   this.initializePort(portConfig.valueType, portId)
      // }
    }
    // For other port kinds, nothing more to do
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
    this.setStatus(NodeStatus.Idle)
  }

  async dispose(): Promise<void> {
    this.setStatus(NodeStatus.Disposed)
    this.eventEmitter.removeAllListeners()
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
        .filter(port => port.config.direction === PortDirectionEnum.Input),
    )
  }

  getOutputs(): IPort<any>[] {
    return Array.from(
      this._ports.values()
        .filter(port => port.config.direction === PortDirectionEnum.Output),
    )
  }

  on<T extends NodeEvent>(event: T['type'], handler: (event: T) => void): void {
    this.eventEmitter.on(event, handler)
  }

  off<T extends NodeEvent>(event: T['type'], handler: (event: T) => void): void {
    this.eventEmitter.off(event, handler)
  }

  onAll(handler: (event: NodeEvent) => void): void {
    this.eventEmitter.on(NodeEventType.All, handler)
  }

  offAll(handler: (event: NodeEvent) => void): void {
    this.eventEmitter.off(NodeEventType.All, handler)
  }

  protected emit<T extends NodeEvent>(event: T['type'], data: T): void {
    this.eventEmitter.emit(event, data)

    if (event !== NodeEventType.All) {
      this.eventEmitter.emit(NodeEventType.All, data)
    }
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
    return port
  }

  removePort(portId: string): void {
    if (this._ports.delete(portId)) {
      // Port removed successfully
    } else {
      throw new Error(`Port with ID ${portId} does not exist in inputs or outputs.`)
    }
  }

  setStatus(status: NodeStatus): void {
    const oldStatus = this._status
    this._status = status
    const event: NodeStatusChangeEvent = {
      nodeId: this.id,
      timestamp: new Date(),
      type: NodeEventType.StatusChange,
      oldStatus,
      newStatus: status,
    }

    this.emit(NodeEventType.StatusChange, event)
  }

  setMetadata(metadata: NodeMetadata): void {
    this._metadata = metadata
  }

  /**
   * Updates node UI position
   * @param position New position coordinates
   */
  setPosition(position: NodeUIMetadata['position']): void {
    const oldPosition = this._metadata.ui?.position
    if (!this._metadata.ui) {
      this._metadata.ui = { position }
    } else {
      this._metadata.ui.position = position
    }

    const event: NodePositionChangeEvent = {
      type: NodeEventType.PositionChange,
      nodeId: this._id,
      timestamp: new Date(),
      oldPosition,
      newPosition: position,
    }

    this.emit(NodeEventType.PositionChange, event)
  }

  setDimensions(dimensions: NodeUIMetadata['dimensions']): void {
    const oldDimensions = this._metadata.ui?.dimensions
    if (!this._metadata.ui) {
      this._metadata.ui = { position: { x: 0, y: 0 }, dimensions }
    } else {
      this._metadata.ui.dimensions = dimensions
    }

    const event: NodeDimensionsChangeEvent = {
      type: NodeEventType.DimensionsChange,
      nodeId: this._id,
      timestamp: new Date(),
      oldDimensions,
      newDimensions: dimensions,
    }

    this.emit(NodeEventType.DimensionsChange, event)
  }

  /**
   * Updates node UI state
   * @param state New UI state
   */
  setUIState(state: NodeUIMetadata['state']): void {
    const oldState = this._metadata.ui?.state
    if (!this._metadata.ui) {
      this._metadata.ui = { position: { x: 0, y: 0 }, state }
    } else {
      this._metadata.ui.state = state
    }

    const event: NodeStateChangeEvent = {
      type: NodeEventType.StateChange,
      nodeId: this._id,
      timestamp: new Date(),
      oldState,
      newState: state,
    }

    this.emit(NodeEventType.StateChange, event)
  }

  /**
   * Updates node UI style
   * @param style New UI style
   */
  setUIStyle(style: NodeUIMetadata['style']): void {
    const oldStyle = this._metadata.ui?.style
    if (!this._metadata.ui) {
      this._metadata.ui = { position: { x: 0, y: 0 }, style }
    } else {
      this._metadata.ui.style = style
    }

    const event: NodeStyleChangeEvent = {
      type: NodeEventType.StyleChange,
      nodeId: this._id,
      timestamp: new Date(),
      oldStyle,
      newStyle: style,
    }

    this.emit(NodeEventType.StyleChange, event)
  }

  /**
   * Gets current node UI metadata
   * @returns Node UI metadata or undefined if not set
   */
  getUIMetadata(): NodeUIMetadata | undefined {
    return this._metadata.ui
  }
}
