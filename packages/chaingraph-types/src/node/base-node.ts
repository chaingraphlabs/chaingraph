import type { IPort, PortConfig } from '../port'
import type { NodeEvents } from './events'
import type { ExecutionContext, NodeExecutionResult } from './execution'
import type { INode } from './interface'

import type { NodeMetadata, NodeStatus, NodeValidationResult } from './types'
import { EventEmitter } from 'node:events'
import { PortFactory } from '../port/port-factory'
import { getOrCreateNodeMetadata } from './decorator/node-decorator'
import { PortConfigProcessor } from './port-config-processor'
import 'reflect-metadata'

export abstract class BaseNode implements INode {
  protected readonly _id: string
  protected readonly _metadata: NodeMetadata
  protected _status: NodeStatus = 'idle'
  protected readonly _inputs: Map<string, IPort<any>> = new Map()
  protected readonly _outputs: Map<string, IPort<any>> = new Map()

  protected eventEmitter = new EventEmitter()

  constructor(id: string, _metadata?: NodeMetadata) {
    this._id = id

    // Get node metadata
    if (_metadata) {
      this._metadata = _metadata
    } else {
      const metadata = getOrCreateNodeMetadata(this)
      if (!metadata) {
        throw new Error('Node metadata missing. Ensure @Node decorator is used or metadata is provided.')
      }

      if (!metadata.type) {
        throw new Error('Node type is required in no de metadata.')
      }

      this._metadata = metadata
    }
  }

  async initialize(): Promise<void> {
    // Process PortConfigs using PortConfigProcessor
    const processor = new PortConfigProcessor()
    processor.processNodePorts(this)

    // Now that PortConfigs are fully prepared, create port instances
    // const portsConfig = this.metadata.portsConfig
    // if (portsConfig) {
    //   for (const [propertyKey, portConfig] of portsConfig.entries()) {
    //     this.createPortInstance(propertyKey, portConfig)
    //   }
    // }

    this._status = 'initialized'
    this.emit('status-change', {
      nodeId: this._id,
      timestamp: new Date(),
      type: 'status-change',
      oldStatus: 'idle',
      newStatus: 'initialized',
    })
  }

  private createPortInstance(propertyKey: string, portConfig: PortConfig): void {
    const port = PortFactory.create(portConfig)

    // Assign to inputs or outputs based on direction
    if (portConfig.direction === 'input') {
      this._inputs.set(propertyKey, port)
    } else if (portConfig.direction === 'output') {
      this._outputs.set(propertyKey, port)
    } else {
      throw new Error('Port direction must be either "input" or "output".')
    }

    // Optionally, you can assign the port instance back to the node's property
    // (this as any)[propertyKey] = port.getValue();
  }

  abstract execute(context: ExecutionContext): Promise<NodeExecutionResult>

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
  get inputs(): Map<string, IPort<any>> {
    return this._inputs
  }

  /**
   * Get the node outputs
   */
  get outputs(): Map<string, IPort<any>> {
    return this._outputs
  }

  async validate(): Promise<NodeValidationResult> {
    // Validation logic
    return { isValid: true, messages: [] }
  }

  async reset(): Promise<void> {
    // Reset ports
    for (const port of this._inputs.values()) {
      port.reset()
    }
    for (const port of this._outputs.values()) {
      port.reset()
    }
    this._status = 'idle'
    this.emit('status-change', {
      nodeId: this._id,
      timestamp: new Date(),
      type: 'status-change',
      oldStatus: this._status,
      newStatus: 'idle',
    })
  }

  async dispose(): Promise<void> {
    // Clean up resources
    this._status = 'disposed'
    this.emit('status-change', {
      nodeId: this._id,
      timestamp: new Date(),
      type: 'status-change',
      oldStatus: this._status,
      newStatus: 'disposed',
    })
    this.eventEmitter.removeAllListeners()
  }

  getPort(portId: string): IPort<any> | undefined {
    return this._inputs.get(portId) || this._outputs.get(portId)
  }

  hasPort(portId: string): boolean {
    return this._inputs.has(portId) || this._outputs.has(portId)
  }

  on<T extends keyof NodeEvents>(event: T, handler: (event: NodeEvents[T]) => void): void {
    this.eventEmitter.on(event, handler)
  }

  protected emit<T extends keyof NodeEvents>(event: T, data: NodeEvents[T]): void {
    this.eventEmitter.emit(event, data)
  }

  clone(): INode {
    // Create a new instance of the node with the same configuration
    const clonedNode = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this))
    clonedNode.id = `${this._id}_clone` // Optionally, assign a new ID
    // If there are nested objects, you might need a deep clone
    return clonedNode
  }

  addPort(config: PortConfig): IPort<any> {
    if (!config.id) {
      throw new Error('Port ID is required.')
    }
    if (this.hasPort(config.id)) {
      throw new Error(`Port with ID ${config.id} already exists.`)
    }
    const port = PortFactory.create(config)
    if (config.direction === 'input') {
      this._inputs.set(config.id, port)
    } else if (config.direction === 'output') {
      this._outputs.set(config.id, port)
    } else {
      throw new Error('Port direction must be either "input" or "output".')
    }
    return port
  }

  removePort(portId: string): void {
    if (this._inputs.delete(portId) || this._outputs.delete(portId)) {
      // Port removed successfully
    } else {
      throw new Error(`Port with ID ${portId} does not exist in inputs or outputs.`)
    }
  }
}
