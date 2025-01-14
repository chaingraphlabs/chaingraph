import type { ExecutionContext } from '@chaingraph/types/flow/execution-context'
import type { NodeEventUnion, NodeStatusChangeEvent } from '@chaingraph/types/node/events'
import type { INode } from '@chaingraph/types/node/interface'
import type {
  NodeExecutionResult,
  NodeMetadata,
  NodeValidationResult,
} from '@chaingraph/types/node/types'
import type { PortConfig } from '@chaingraph/types/port'
import type { IPort } from '@chaingraph/types/port/types/port-interface'
import { EventEmitter } from 'node:events'
import { NodeEvents, NodeStatus } from '@chaingraph/types/node/node-enums'
import { ArrayPort, EnumPort, ObjectPort, PortFactory, StreamInputPort, StreamOutputPort } from '@chaingraph/types/port'
import { PortDirectionEnum } from '@chaingraph/types/port/types/port-direction'
import { z } from 'zod'
import { getOrCreateNodeMetadata } from './decorator/node-decorator'
import { PortConfigProcessor } from './port-config-processor'
import 'reflect-metadata'

export const NodeSchema = z.object({
  id: z.string(),

})

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

  on<T extends NodeEventUnion>(event: T['type'], handler: (event: T) => void): void {
    this.eventEmitter.on(event, handler)
  }

  off<T extends NodeEventUnion>(event: T['type'], handler: (event: T) => void): void {
    this.eventEmitter.off(event, handler)
  }

  protected emit<T extends NodeEventUnion>(event: T['type'], data: T): void {
    this.eventEmitter.emit(event, data)
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
      nodeId: this._id,
      timestamp: new Date(),
      type: NodeEvents.StatusChange,
      node: this,
      oldStatus,
      newStatus: status,
    }

    this.emit(NodeEvents.StatusChange, event)
  }

  setMetadata(metadata: NodeMetadata): void {
    this._metadata = metadata
  }

  get name(): string {
    return this._metadata.type
  }

  isApplicable(v: any): v is INode {
    if (v instanceof BaseNode) {
      return true
    }

    // try {
    //   SerializedNodeSchema.parse(v)
    // } catch (e) {
    //   return false
    // }

    return true
  }

  /**
   * Serializes the node into a JSON-compatible format
   * @returns Serialized representation of the node
   */
  // serialize(v: INode): JSONValue {
  //   const json = superjson.serialize({
  //     id: v.id,
  //     metadata: v.metadata,
  //     status: v.status,
  //     ports: v.ports,
  //   })
  //   return json as unknown as JSONValue
  // }
  //
  // deserialize(v: JSONValue): INode {
  //   const deserializedNode = superjson.deserialize<INode>(v as unknown as SuperJSONResult)
  //
  //   const node = NodeRegistry.getInstance().createNode(
  //     deserializedNode.metadata.type,
  //     deserializedNode.id,
  //     deserializedNode.metadata,
  //   )
  //
  //   // Validate the serialized data
  //   // const validated = SerializedNodeSchema.parse(data)
  //   //
  //   // // Create a new node instance
  //   // const node = new this(validated.id)
  //   //
  //   // // Set metadata and status
  //   // node._metadata = validated.metadata
  //   // node._status = validated.status
  //   //
  //   // // Create ports from configs
  //   // for (const [portId, portConfig] of Object.entries(validated.ports)) {
  //   //   const port = PortFactory.create(portConfig)
  //   //   node._ports.set(portId, port)
  //   // }
  //
  //   return node
  // }
}
