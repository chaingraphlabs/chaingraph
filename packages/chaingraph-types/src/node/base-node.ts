import type { ExecutionContext } from '@chaingraph/types/flow/execution-context'
import type { PortConfig } from '@chaingraph/types/port/types/port-composite-types'
import type { IPort } from '@chaingraph/types/port/types/port-interface'
import type { NodeEvents, NodeStatusChangeEvent } from './events'
import type { NodeExecutionResult } from './execution'

import type { INode } from './interface'
import type { NodeMetadata, NodeStatus, NodeValidationResult } from './types'
import { EventEmitter } from 'node:events'
import { PortDirectionEnum } from '@chaingraph/types/port/types/port-direction'
import { PortFactory } from '../port/registry/port-factory'
import { getOrCreateNodeMetadata } from './decorator/node-decorator'
import { PortConfigProcessor } from './port-config-processor'
import 'reflect-metadata'

export abstract class BaseNode implements INode {
  protected readonly _id: string
  protected readonly _metadata: NodeMetadata
  protected _status: NodeStatus = 'idle'
  protected readonly _ports: Map<string, IPort<any>> = new Map()

  protected eventEmitter = new EventEmitter()

  constructor(id: string, _metadata?: NodeMetadata) {
    this._id = id

    // Get node metadata
    if (_metadata) {
      if (!_metadata.type) {
        throw new Error('Node type is required in metadata.')
      }

      this._metadata = _metadata
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

  async initialize(): Promise<void> {
    // Process PortConfigs using PortConfigProcessor
    (new PortConfigProcessor()).processNodePorts(this)

    this.setStatus('initialized')
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
    this.setStatus('idle')
  }

  async dispose(): Promise<void> {
    this.setStatus('disposed')
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

  on<T extends keyof NodeEvents>(event: T, handler: (event: NodeEvents[T]) => void): void {
    this.eventEmitter.on(event, handler)
  }

  off<T extends keyof NodeEvents>(event: T, handler: (event: NodeEvents[T]) => void): void {
    this.eventEmitter.off(event, handler)
  }

  protected emit<T extends keyof NodeEvents>(event: T, data: NodeEvents[T]): void {
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

  addPort(config: PortConfig): IPort<any> {
    if (!config.id) {
      throw new Error('Port ID is required.')
    }
    if (this.hasPort(config.id)) {
      throw new Error(`Port with ID ${config.id} already exists.`)
    }
    const port = PortFactory.create(config)
    this._ports.set(config.id, port)
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
      type: 'status-change',
      node: this,
      oldStatus,
      newStatus: status,
    }

    this.emit('status-change', event)
  }
}
