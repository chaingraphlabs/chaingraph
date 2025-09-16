/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../execution'
import type { EventReturnType, NodeEvent, NodeEventDataType, PortUpdateEvent } from '../node/events'
import type { Dimensions, NodeUIMetadata, Position } from '../node/node-ui'
import type { NodeExecutionResult, NodeMetadata, NodeValidationResult } from '../node/types'
import type { AnyPort, IPort, IPortConfig, ObjectPort, ObjectPortConfig } from '../port'
import type { JSONValue } from '../utils/json'
import type { EventContext } from './implementations'
import type { CloneWithNewIdResult, IComplexPortHandler, INodeComposite, IPortManager } from './interfaces'
import { applyPortUpdateHandlers, applyVisibilityRules, getOrCreateNodeMetadata, getPortsMetadata } from '../decorator'
import { NodeEventType } from '../node/events'
import { NodeStatus } from '../node/node-enums'
import {
  ComplexPortHandler,
  DeepCloneHandler,
  NodeEventManager,
  NodeSerializer,
  NodeUIManager,
  NodeVersionManager,
  PortBinder,
  PortManager,
  PortUpdateCollector,
} from './implementations'
import { SystemPortManager } from './implementations/system-port-manager'
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
  private readonly portManager: PortManager
  private portBinder: PortBinder
  private complexPortHandler: ComplexPortHandler
  private eventManager: NodeEventManager
  private uiManager: NodeUIManager
  private readonly versionManager: NodeVersionManager
  private serializer: NodeSerializer
  private systemPortManager: SystemPortManager
  private readonly portUpdateCollector: PortUpdateCollector

  constructor(id: string, _metadata?: NodeMetadata) {
    this._id = id

    // Initialize metadata
    // Always start with decorator metadata as base
    const decoratorMetadata = getOrCreateNodeMetadata(this)
    if (!decoratorMetadata) {
      throw new Error('Node metadata missing. Ensure @Node decorator is used.')
    }

    if (_metadata) {
      if (!_metadata.type) {
        throw new Error('Node type is required in metadata.')
      }

      // Merge provided metadata with decorator metadata
      // Decorator metadata provides defaults, provided metadata overrides specific fields
      this._metadata = {
        ...decoratorMetadata, // Start with decorator metadata (includes flowPorts)
        ..._metadata, // Override with provided metadata
        // Preserve flowPorts from decorator if not in provided metadata
        ...(_metadata.flowPorts || decoratorMetadata.flowPorts ? { flowPorts: _metadata.flowPorts || decoratorMetadata.flowPorts } : {}),
      }
    } else {
      if (!decoratorMetadata.type) {
        throw new Error('Node type is required in metadata.')
      }

      this._metadata = { ...decoratorMetadata }
    }

    // Initialize version if not set
    if (!this._metadata.version) {
      this._metadata.version = 1
    }

    // Initialize components
    this.portManager = new PortManager()
    this.eventManager = new NodeEventManager()
    this.versionManager = new NodeVersionManager(this)
    this.portUpdateCollector = new PortUpdateCollector()

    // Initialize components with dependencies
    this.portBinder = new PortBinder(this.portManager, this, this.id)
    this.complexPortHandler = new ComplexPortHandler(
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
      this.complexPortHandler,
    )

    // Initialize system port manager
    this.systemPortManager = new SystemPortManager(
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
   * Runtime execute that wraps the abstract execute to handle system ports.
   * This is an internal method used by the execution engine.
   *
   * @param context The execution context
   * @returns The execution result
   */
  async executeWithSystemPorts(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Check if node should execute based on flow ports
    if (!this.shouldExecute(context)) {
      this.systemPortManager.getFlowOutPort()?.setValue(false)
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
    // Get decorator metadata to preserve important fields like flowPorts
    const decoratorMetadata = getOrCreateNodeMetadata(this)

    // Merge provided metadata with decorator metadata
    this._metadata = {
      ...metadata,
      // Preserve flowPorts from decorator if not in provided metadata
      ...(metadata.flowPorts || decoratorMetadata?.flowPorts ? { flowPorts: metadata.flowPorts || decoratorMetadata?.flowPorts } : {}),
    }
  }

  setStatus(status: NodeStatus, emitEvent?: boolean): void {
    const oldStatus = this._status
    this._status = status

    if (!emitEvent) {
      return
    }
    this.versionManager.incrementVersion()
    void this.emit(this.createEvent(NodeEventType.StatusChange, {
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
    this.bindPortBindings()
  }

  removePort(portId: string): void {
    this.portManager.removePort(portId)
    this.versionManager.incrementVersion()
  }

  removePorts(portIds: string[]): void {
    this.portManager.removePorts(portIds)
    this.versionManager.incrementVersion()
  }

  findPortByPath(path: string[]): IPort | undefined {
    return this.portManager.findPortByPath(path)
  }

  getChildPorts(parentPort: IPort): IPort[] {
    return this.portManager.getChildPorts(parentPort)
  }

  getNestedPorts(parentPort: IPort): IPort[] {
    return this.portManager.getNestedPorts(parentPort)
  }

  /**
   * Update a port and emit a port update event
   * This is a critical method that triggers port-related events
   * @param port The port to update
   * @param eventContext Optional event context for additional metadata
   */
  async updatePort(port: IPort, eventContext?: EventContext): Promise<void> {
    return this.updatePorts([port], eventContext)
  }

  /**
   * Update multiple ports at once
   * This is useful for batch updates
   * @param ports Array of ports to update
   * @param eventContext Optional event context for additional metadata
   */
  async updatePorts(ports: IPort[], eventContext?: EventContext): Promise<void> {
    // Always update the port manager and bind port bindings
    this.portManager.updatePorts(ports)
    this.bindPortBindings()

    // If collecting, add to collector and return early
    if (this.portUpdateCollector.isCollecting()) {
      ports.forEach(port => this.portUpdateCollector.collect(port, eventContext))
      return
    }

    // Otherwise, emit immediately (current behavior)
    this.versionManager.incrementVersion()

    const promises = ports.map((port) => {
      // Create and emit the port update event
      const event = this.createEvent(NodeEventType.PortUpdate, {
        portId: port.id,
        port: port.clone(),
        eventContext,
      })

      // Emit the event, which will also call onEvent
      return this.emit(event)
    })

    return Promise.all(promises).then(() => {})
  }

  copyObjectSchemaTo(
    sourceNode: IPortManager,
    sourceObjectPort: ObjectPort | AnyPort,
    targetObjectPort: ObjectPort | AnyPort,
    useParentUI?: boolean,
  ): void {
    this.complexPortHandler.copyObjectSchemaTo(
      sourceNode,
      sourceObjectPort,
      targetObjectPort,
      useParentUI,
    )
  }

  createNestedObjectPorts(
    parentPort: IPort,
    objectValue: any,
    config: ObjectPortConfig,
    useParentUI?: boolean,
  ): void {
    this.complexPortHandler.createNestedObjectPorts(
      parentPort,
      objectValue,
      config,
      useParentUI,
    )
  }

  findPort(predicate: (port: IPort) => boolean): IPort | undefined {
    return this.portManager.findPort(predicate)
  }

  findPorts(predicate: (port: IPort) => boolean): IPort[] {
    return this.portManager.findPorts(predicate)
  }

  //
  // INodeEvents implementation (delegation to eventManager)
  //
  on<T extends NodeEvent>(
    eventType: T['type'],
    handler: (event: T) => void | Promise<void>,
  ): () => void {
    return this.eventManager.on(eventType, handler)
  }

  onAll(handler: (event: NodeEvent) => void | Promise<void>): () => void {
    return this.eventManager.onAll(handler)
  }

  /**
   * Event handler for the node
   * This is the key method that derived classes can override to handle events
   *
   * @param _event The event to handle
   */
  async onEvent(_event: NodeEvent): Promise<void> {
    // Handle port update events first with specific handlers
    if (_event.type === NodeEventType.PortUpdate) {
      await applyPortUpdateHandlers(this, _event as PortUpdateEvent)
    }

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
        promises.push(this.updatePort(port, {
          sourceOfUpdate: 'BaseNodeCompositional:applyPortVisibilityRules',
        }))
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

  /**
   * Start collecting port updates without emitting events immediately
   * Used for batch operations where multiple ports are updated
   */
  startBatchUpdate(): void {
    this.portUpdateCollector.startCollecting()
  }

  /**
   * Commit all collected port updates and emit events
   * @param eventContext Optional context to be added to all emitted events
   */
  async commitBatchUpdate(eventContext?: EventContext): Promise<void> {
    this.portUpdateCollector.stopCollecting()

    const updates = this.portUpdateCollector.getPendingUpdates()
    if (updates.length === 0) {
      return
    }

    // Single version increment for the entire batch
    this.versionManager.incrementVersion()

    // Emit all collected events
    const promises = updates.map(({ port, eventContext: ctx }) => {
      const event = this.createEvent(NodeEventType.PortUpdate, {
        portId: port.id,
        port,
        eventContext: ctx || eventContext,
      })
      return this.emit(event)
    })

    await Promise.all(promises)
    this.portUpdateCollector.clear()
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

  bindPortBindings(): void {
    this.portBinder.bindPortBindings()
  }

  initializePortsFromConfigs(portsConfigs: Map<string, IPortConfig>): void {
    this.portBinder.initializePortsFromConfigs(portsConfigs)
  }

  //
  // IComplexPortHandler implementation (delegation to complexPortHandler)
  //
  addObjectProperty(objectPort: IPort, key: string, portConfig: IPortConfig, useParentUI?: boolean): IPort {
    return this.complexPortHandler.addObjectProperty(objectPort, key, portConfig, useParentUI)
  }

  addObjectProperties(objectPort: IPort, properties: IPortConfig[], useParentUI?: boolean): IPort[] {
    return this.complexPortHandler.addObjectProperties(objectPort, properties, useParentUI)
  }

  removeObjectProperties(objectPort: IPort, keys: string[]): void {
    this.complexPortHandler.removeObjectProperties(objectPort, keys)
  }

  removeObjectProperty(objectPort: IPort, key: string): void {
    this.complexPortHandler.removeObjectProperty(objectPort, key)
  }

  updateArrayItemConfig(arrayPort: IPort): void {
    this.complexPortHandler.updateArrayItemConfig(arrayPort)
  }

  appendArrayItem(arrayPort: IPort, value: any): number {
    return this.complexPortHandler.appendArrayItem(arrayPort, value)
  }

  removeArrayItem(arrayPort: IPort, index: number): void {
    this.complexPortHandler.removeArrayItem(arrayPort, index)
  }

  removeArrayItems(arrayPort: IPort, indices: number[]): void {
    this.complexPortHandler.removeArrayItems(arrayPort, indices)
  }

  refreshAnyPortUnderlyingPorts(anyPort: IPort, useParentUI?: boolean): void {
    this.complexPortHandler.refreshAnyPortUnderlyingPorts(anyPort, useParentUI)
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

  /**
   * Create a deep clone of the node with new unique identifiers
   * This method recursively clones all ports with new IDs while preserving
   * the port hierarchy, values, and metadata
   *
   * @returns A result object containing the cloned node and ID mappings
   */
  cloneWithNewId(): CloneWithNewIdResult<INodeComposite> {
    return DeepCloneHandler.cloneNodeWithNewIds(this)
  }

  //
  // ISystemPortManager implementation (delegation to systemPortManager)
  //
  getDefaultPorts(): IPort[] {
    return this.systemPortManager.getDefaultPorts()
  }

  getSystemPortConfigs(): IPortConfig[] {
    return this.systemPortManager.getSystemPortConfigs()
  }

  isDefaultPort(portId: string): boolean {
    return this.systemPortManager.isDefaultPort(portId)
  }

  getFlowInPort(): IPort | undefined {
    return this.systemPortManager.getFlowInPort()
  }

  getFlowOutPort(): IPort | undefined {
    return this.systemPortManager.getFlowOutPort()
  }

  getErrorPort(): IPort | undefined {
    return this.systemPortManager.getErrorPort()
  }

  getErrorMessagePort(): IPort | undefined {
    return this.systemPortManager.getErrorMessagePort()
  }

  shouldExecute(context: ExecutionContext): boolean {
    return this.systemPortManager.shouldExecute(context)
  }

  async updatePortsAfterExecution(success: boolean, errorMessage?: string): Promise<void> {
    return this.systemPortManager.updatePortsAfterExecution(success, errorMessage)
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
    const defaultPorts = this.getSystemPortConfigs()
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

    this.bindPortBindings()

    // Apply visibility rules during initialization
    this.applyPortVisibilityRules().then(() => {})

    // Update node status
    this.setStatus(NodeStatus.Initialized, false)
  }

  //
  // Helper method for creating events
  //
  createEvent<T extends NodeEventType>(
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
