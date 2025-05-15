/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../execution'
import type { EventReturnType, NodeEvent, NodeEventDataType } from '../node/events'
import type { Dimensions, NodeUIMetadata, Position } from '../node/node-ui'
import type { NodeExecutionResult, NodeMetadata, NodeValidationResult } from '../node/types'
import type { IPort, IPortConfig } from '../port'
import type { JSONValue } from '../utils/json'
import type { IComplexPortHandler, INodeComposite } from './interfaces'
import { applyVisibilityRules, getOrCreateNodeMetadata, getPortsMetadata } from '../decorator'
import { NodeEventType } from '../node/events'
import { NodeStatus } from '../node/node-enums'
import {
  ComplexPortHandler,
  DefaultPortManager,
  NodeEventManager,
  NodeSerializer,
  NodeUIManager,
  NodeVersionManager,
  PortBinder,
  PortManager,
} from './implementations'
import { PortConfigProcessor } from './port-config-processor'
import { findPort } from './traverse-ports'
import 'reflect-metadata'

/**
 * Abstract base class for nodes with compositional architecture
 * Implements INodeComposite by delegating to specialized components
 */
export abstract class BaseNodeCompositional implements INodeComposite {
  // Core properties
  protected readonly _id: string
  protected _metadata: NodeMetadata
  protected _status: NodeStatus = NodeStatus.Idle

  // Components
  private portManager: PortManager
  private portBinder: PortBinder
  private complexPortHandler: ComplexPortHandler
  private eventManager: NodeEventManager
  private uiManager: NodeUIManager
  private versionManager: NodeVersionManager
  private serializer: NodeSerializer
  private defaultPortManager: DefaultPortManager

  constructor(id: string, _metadata?: NodeMetadata) {
    this._id = id

    // Initialize metadata
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

    // Initialize components
    this.portManager = new PortManager()
    this.eventManager = new NodeEventManager()
    this.versionManager = new NodeVersionManager(this)

    // Initialize components with dependencies
    this.portBinder = new PortBinder(this.portManager, this, this.id)
    this.complexPortHandler = new ComplexPortHandler(
      // this.portManager,
      this,
      this.portBinder,
      this.id,
    )

    // Link components together (circular dependency resolution)
    this.portBinder.setComplexPortHandler(this.complexPortHandler)

    this.uiManager = new NodeUIManager(
      this,
      this.versionManager,
      {
        emit: this.emit.bind(this),
      },
      {
        createEvent: this.createEvent.bind(this),
      },
    )

    this.serializer = new NodeSerializer(
      this.portManager,
      (id: string) => new (this.constructor as any)(id) as INodeComposite,
      this.portBinder,
      this,
    )

    // Initialize default port manager
    this.defaultPortManager = new DefaultPortManager(
      this.portManager,
      this,
    )

    // IMPORTANT: Set the custom event handler to this instance's onEvent method
    // This allows derived class implementations to receive events
    this.eventManager.setCustomEventHandler(this.onEvent.bind(this))
  }

  /**
   * Abstract method that must be implemented by concrete nodes
   * We'll wrap this with logic for default port handling
   */
  abstract execute(context: ExecutionContext): Promise<NodeExecutionResult>

  /**
   * Runtime execute that wraps the abstract execute to handle default ports.
   * This is an internal method used by the execution engine.
   *
   * @param context The execution context
   * @returns The execution result
   */
  async executeWithDefaultPorts(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Check if node should execute based on flow ports
    if (!this.shouldExecute()) {
      this.defaultPortManager.getFlowOutPort()?.setValue(false)
      return {}
    }

    try {
      // Call the original execute method (implemented by derived classes)
      const result = await this.execute(context)

      // Update flow ports based on execution result
      await this.updatePortsAfterExecution(true)

      return result
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during execution'
      await this.updatePortsAfterExecution(false, errorMessage)

      return {}
    }
  }

  //
  // ICoreNode implementation
  //
  get id(): string {
    return this._id
  }

  get metadata(): NodeMetadata {
    return this._metadata
  }

  get status(): NodeStatus {
    return this._status
  }

  setMetadata(metadata: NodeMetadata): void {
    this._metadata = metadata
  }

  setStatus(status: NodeStatus, emitEvent?: boolean): void {
    const oldStatus = this._status
    this._status = status

    if (!emitEvent) {
      return
    }
    this.versionManager.incrementVersion()
    this.emit(this.createEvent(NodeEventType.StatusChange, {
      oldStatus,
      newStatus: status,
    }))
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
    this.portManager.setPorts(new Map())

    // Close event queue
    await this.eventManager.close()

    this.setStatus(NodeStatus.Disposed, false)
  }

  //
  // IPortManager implementation (delegation to portManager)
  //
  get ports(): Map<string, IPort> {
    return this.portManager.ports
  }

  getPort(portId: string): IPort | undefined {
    return this.portManager.getPort(portId)
  }

  hasPort(portId: string): boolean {
    return this.portManager.hasPort(portId)
  }

  getInputs(): IPort[] {
    return this.portManager.getInputs()
  }

  getOutputs(): IPort[] {
    return this.portManager.getOutputs()
  }

  setPort(port: IPort): IPort {
    return this.portManager.setPort(port)
  }

  setPorts(ports: Map<string, IPort>): void {
    this.portManager.setPorts(ports)
    this.rebuildPortBindings()
  }

  removePort(portId: string): void {
    this.portManager.removePort(portId)
    this.versionManager.incrementVersion()
  }

  findPortByPath(path: string[]): IPort | undefined {
    return this.portManager.findPortByPath(path)
  }

  getChildPorts(parentPort: IPort): IPort[] {
    return this.portManager.getChildPorts(parentPort)
  }

  /**
   * Update a port and emit a port update event
   * This is a critical method that triggers port-related events
   * @param port The port to update
   */
  async updatePort(port: IPort): Promise<void> {
    this.portManager.updatePort(port)
    this.rebuildPortBindings()

    this.versionManager.incrementVersion()

    // Create and emit the port update event
    const event = this.createEvent(NodeEventType.PortUpdate, {
      portId: port.id,
      port,
    })

    // Emit the event, which will also call onEvent
    await this.emit(event)

    // Return once everything is done
    return Promise.resolve()
  }

  //
  // INodeEvents implementation (delegation to eventManager)
  //
  on<T extends NodeEvent>(
    eventType: T['type'],
    handler: (event: T) => void,
  ): () => void {
    return this.eventManager.on(eventType, handler)
  }

  onAll(handler: (event: NodeEvent) => void): () => void {
    return this.eventManager.onAll(handler)
  }

  /**
   * Event handler for the node
   * This is the key method that derived classes can override to handle events
   *
   * @param event The event to handle
   */
  async onEvent(event: NodeEvent): Promise<void> {
    // Apply visibility rules for all events
    return this.applyPortVisibilityRules()
  }

  /**
   * Apply visibility rules to ports and update them if needed
   * This is extracted into a separate method so it can be used in multiple places
   */
  private async applyPortVisibilityRules(): Promise<void> {
    // Apply visibility rules
    const mutatedPorts = applyVisibilityRules(this)
    const promises: Promise<void>[] = []
    if (mutatedPorts && mutatedPorts.length > 0) {
      for (const port of mutatedPorts) {
        promises.push(this.updatePort(port))
      }
    }

    // Wait for all updates to complete
    await Promise.all(promises)
    return Promise.resolve()
  }

  /**
   * Find a port by its key
   * @param key The key of the port to find
   * @returns The port if found, undefined otherwise
   */
  findPortByKey(key: string): IPort | undefined {
    return findPort(this, port => port.getConfig().key === key)
  }

  async emit<T extends NodeEvent>(event: T): Promise<void> {
    return this.eventManager.emit(event)
  }

  //
  // IPortBinder implementation (delegation to portBinder)
  //
  setComplexPortHandler(handler: IComplexPortHandler): void {
    this.portBinder.setComplexPortHandler(handler)
  }

  bindPortToNodeProperty(targetObject: any, port: IPort): void {
    this.portBinder.bindPortToNodeProperty(targetObject, port)
  }

  rebuildPortBindings(): void {
    this.portBinder.rebuildPortBindings()
  }

  initializePortsFromConfigs(portsConfigs: Map<string, IPortConfig>): void {
    this.portBinder.initializePortsFromConfigs(portsConfigs)
  }

  rebindAfterDeserialization(): void {
    this.portBinder.rebindAfterDeserialization()
  }

  //
  // IComplexPortHandler implementation (delegation to complexPortHandler)
  //
  addObjectProperty(objectPort: IPort, key: string, portConfig: IPortConfig): IPort {
    return this.complexPortHandler.addObjectProperty(objectPort, key, portConfig)
  }

  removeObjectProperty(objectPort: IPort, key: string): void {
    this.complexPortHandler.removeObjectProperty(objectPort, key)
  }

  appendArrayItem(arrayPort: IPort, value: any): number {
    return this.complexPortHandler.appendArrayItem(arrayPort, value)
  }

  removeArrayItem(arrayPort: IPort, index: number): void {
    this.complexPortHandler.removeArrayItem(arrayPort, index)
  }

  processPortConfig(config: IPortConfig, context: {
    nodeId: string
    parentPortConfig: IPortConfig | null
    propertyKey: string
    propertyValue: any
  }): IPortConfig {
    return this.complexPortHandler.processPortConfig(config, context)
  }

  recreateArrayItemPorts(arrayPort: IPort, newArray: any[]): void {
    this.complexPortHandler.recreateArrayItemPorts(arrayPort, newArray)
  }

  //
  // INodeUI implementation (delegation to uiManager)
  //
  getUI(): NodeUIMetadata | undefined {
    return this.uiManager.getUI()
  }

  setUI(ui: NodeUIMetadata, emitEvent?: boolean): void {
    this.uiManager.setUI(ui, emitEvent)
  }

  setPosition(position: Position, emitEvent?: boolean): void {
    this.uiManager.setPosition(position, emitEvent)
  }

  setDimensions(dimensions: Dimensions, emitEvent?: boolean): void {
    this.uiManager.setDimensions(dimensions, emitEvent)
  }

  setNodeParent(position: Position, parentNodeId?: string, emitEvent?: boolean): void {
    this.uiManager.setNodeParent(position, parentNodeId, emitEvent)
  }

  //
  // INodeVersioning implementation (delegation to versionManager)
  //
  incrementVersion(): number {
    return this.versionManager.incrementVersion()
  }

  getVersion(): number {
    return this.versionManager.getVersion()
  }

  /**
   * Set the node version
   * @param version The new version
   */
  setVersion(version: number): void {
    this.versionManager.setVersion(version)
  }

  //
  // ISerializable implementation (delegation to serializer)
  //
  serialize(): JSONValue {
    return this.serializer.serialize()
  }

  deserialize(data: JSONValue): INodeComposite {
    this.serializer.deserialize(data)
    return this
  }

  clone(): INodeComposite {
    return this.serializer.clone()
  }

  //
  // IDefaultPortManager implementation (delegation to defaultPortManager)
  //
  getDefaultPorts(): IPort[] {
    return this.defaultPortManager.getDefaultPorts()
  }

  getDefaultPortConfigs(): IPortConfig[] {
    return this.defaultPortManager.getDefaultPortConfigs()
  }

  isDefaultPort(portId: string): boolean {
    return this.defaultPortManager.isDefaultPort(portId)
  }

  getFlowInPort(): IPort | undefined {
    return this.defaultPortManager.getFlowInPort()
  }

  getFlowOutPort(): IPort | undefined {
    return this.defaultPortManager.getFlowOutPort()
  }

  getErrorPort(): IPort | undefined {
    return this.defaultPortManager.getErrorPort()
  }

  getErrorMessagePort(): IPort | undefined {
    return this.defaultPortManager.getErrorMessagePort()
  }

  shouldExecute(): boolean {
    return this.defaultPortManager.shouldExecute()
  }

  async updatePortsAfterExecution(success: boolean, errorMessage?: string): Promise<void> {
    return this.defaultPortManager.updatePortsAfterExecution(success, errorMessage)
  }

  //
  // Initialize method with default ports support
  //
  initialize(portsConfig?: Map<string, IPortConfig>): void {
    if (portsConfig === undefined) {
      portsConfig = getPortsMetadata(this.constructor)
      if (!portsConfig) {
        throw new Error('Ports metadata is missing. Ensure @Port decorator is used or portsConfig is provided.')
      }

      // Clone portsConfig to avoid modifying the original
      portsConfig = new Map(portsConfig)
    }

    // Add default ports to the configuration
    const defaultPorts = this.getDefaultPortConfigs()
    for (const portConfig of defaultPorts) {
      if (portConfig.key && !portsConfig.has(portConfig.key)) {
        portsConfig.set(portConfig.key, portConfig)
      }
    }

    // Process PortConfigs
    const processor = new PortConfigProcessor()
    portsConfig = processor.processNodePorts(
      this,
      portsConfig,
    )

    // Initialize ports from configs
    this.initializePortsFromConfigs(portsConfig || new Map())

    this.rebindAfterDeserialization()

    // Apply visibility rules during initialization
    this.applyPortVisibilityRules()

    // Update node status
    this.setStatus(NodeStatus.Initialized, false)
  }

  //
  // Helper method for creating events
  //
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
