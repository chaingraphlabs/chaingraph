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
import type { ArrayPortConfig, IPort, IPortConfig, ObjectPortConfig } from '../port'
import type { JSONValue } from '../utils/json'
import { applyVisibilityRules, getOrCreateNodeMetadata, getPortsMetadata } from '../decorator'
import { NodeEventType } from '../node/events'
import { NodeStatus } from '../node/node-enums'
import { PortConfigProcessor } from '../node/port-config-processor'
import { PortDirection, PortFactory } from '../port'
import { EventQueue } from '../utils'
import { SerializedNodeSchema } from './types.zod'
import 'reflect-metadata'

export abstract class BaseNode implements INode {
  protected readonly _id: string
  protected _metadata: NodeMetadata
  protected _status: NodeStatus = NodeStatus.Idle
  protected _ports: Map<string, IPort> = new Map()

  protected eventQueue = new EventQueue<NodeEvent>()

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
  }

  abstract execute(context: ExecutionContext): Promise<NodeExecutionResult>

  onEvent(_: NodeEvent): Promise<void> {
    // Apply visibility rules
    const mutatedPorts = applyVisibilityRules(this)
    if (mutatedPorts) {
      for (const port of mutatedPorts) {
        this.updatePort(port)
      }
    }

    return Promise.resolve()
  }

  /**
   * Initialize the node with port configurations
   * @param portsConfig Optional map of port configurations. If not provided, will use metadata.
   */
  initialize(portsConfig: Map<string, IPortConfig> | undefined = undefined): void {
    if (portsConfig === undefined) {
      portsConfig = getPortsMetadata(this.constructor)
      if (!portsConfig) {
        throw new Error('Ports metadata is missing. Ensure @Port decorator is used or portsConfig is provided.')
      }
    }

    // Process PortConfigs using PortConfigProcessor
    portsConfig = (new PortConfigProcessor()).processNodePorts(
      this,
      portsConfig,
    )

    // Initialize ports from configs
    this.initializePortsFromConfigs(portsConfig || new Map())

    // Apply visibility rules
    applyVisibilityRules(this)

    // Update node status
    this.setStatus(NodeStatus.Initialized, false)
  }

  /**
   * Initialize all ports from configs and establish property bindings
   * @param portsConfigs Map of port configurations
   */
  initializePortsFromConfigs(portsConfigs: Map<string, IPortConfig>): void {
    // Create all root-level ports first (those without a parentId)
    const portMap = new Map<string, IPort>()
    const objectPortsToProcess: IPort[] = []

    for (const [key, portConfig] of portsConfigs.entries()) {
      if (!portConfig.parentId) {
        const port = PortFactory.createFromConfig(portConfig)
        portMap.set(port.id, port)

        // Bind this root port to the node property
        this.bindPortToNodeProperty(this, port)

        // If this is a complex port (object or array), add it to the list to process
        const config = port.getConfig()
        if (config.type === 'object' || config.type === 'array') {
          objectPortsToProcess.push(port)
        }
      }
    }

    // Process complex ports recursively
    this.processComplexPorts(portMap, objectPortsToProcess)

    // Set the ports map after all ports are created
    this._ports = portMap
  }

  /**
   * Recursively process object and array ports to create their child ports
   * @param portMap The map to add created ports to
   * @param portsToProcess List of complex ports to process
   */
  private processComplexPorts(portMap: Map<string, IPort>, portsToProcess: IPort[]): void {
    while (portsToProcess.length > 0) {
      const port = portsToProcess.shift()!
      const config = port.getConfig()

      if (config.type === 'object') {
        this.processObjectPort(port, portMap, portsToProcess)
      } else if (config.type === 'array') {
        this.processArrayPort(port, portMap, portsToProcess)
      }
    }
  }

  /**
   * Process an object port to create child ports for all properties
   * @param objectPort The object port to process
   * @param portMap The map to add created ports to
   * @param portsToProcess List to add any new complex ports to
   */
  private processObjectPort(objectPort: IPort, portMap: Map<string, IPort>, portsToProcess: IPort[]): void {
    const config = objectPort.getConfig() as ObjectPortConfig
    if (!config.schema || !config.schema.properties) {
      return
    }

    const objectValue = objectPort.getValue() || {}

    // Process each property in the schema
    for (const [key, propertyConfig] of Object.entries(config.schema.properties)) {
      // Process the port config
      const processedConfig = this.processPortConfig(
        { ...propertyConfig },
        {
          nodeId: this.id,
          parentPortConfig: config,
          propertyKey: key,
          propertyValue: objectValue[key],
        },
      )

      // Create the child port
      const childPortId = `${objectPort.id}.${key}`
      const childConfig = {
        ...processedConfig,
        id: childPortId,
        parentId: objectPort.id,
        key,
        nodeId: this.id,
      }

      const childPort = PortFactory.createFromConfig(childConfig)
      portMap.set(childPortId, childPort)

      // Bind to parent object
      if (typeof objectValue === 'object' && objectValue !== null) {
        this.bindPortToNodeProperty(objectValue, childPort)
      }

      // If this child is a complex port, add it to the processing queue
      if (childConfig.type === 'object' || childConfig.type === 'array') {
        portsToProcess.push(childPort)
      }
    }
  }

  /**
   * Process an array port to create child ports for all items
   * @param arrayPort The array port to process
   * @param portMap The map to add created ports to
   * @param portsToProcess List to add any new complex ports to
   */
  private processArrayPort(arrayPort: IPort, portMap: Map<string, IPort>, portsToProcess: IPort[]): void {
    const config = arrayPort.getConfig() as ArrayPortConfig
    const arrayValue = arrayPort.getValue() || []

    // We only process initial items if there are values in the array
    if (!Array.isArray(arrayValue) || arrayValue.length === 0) {
      return
    }

    // Create a port for each item in the array
    for (let i = 0; i < arrayValue.length; i++) {
      this.appendArrayItemToMap(arrayPort, arrayValue[i], i, portMap, portsToProcess)
    }
  }

  /**
   * Helper method to create an array item port and add it to the port map
   */
  private appendArrayItemToMap(
    arrayPort: IPort,
    value: any,
    index: number,
    portMap: Map<string, IPort>,
    portsToProcess: IPort[],
  ): void {
    const config = arrayPort.getConfig() as ArrayPortConfig

    // Process item config
    let itemConfig = { ...config.itemConfig }
    itemConfig = this.processPortConfig(
      itemConfig,
      {
        nodeId: this.id,
        parentPortConfig: config,
        propertyKey: index.toString(),
        propertyValue: value,
      },
    )

    // Create the item port
    const itemPortId = `${arrayPort.id}[${index}]`
    const completeItemConfig = {
      ...itemConfig,
      id: itemPortId,
      parentId: arrayPort.id,
      key: index.toString(),
      nodeId: this.id,
    }

    const itemPort = PortFactory.createFromConfig(completeItemConfig)
    itemPort.setValue(value)
    portMap.set(itemPortId, itemPort)

    // If this item port is a complex port, add it to the processing queue
    if (completeItemConfig.type === 'object' || completeItemConfig.type === 'array') {
      portsToProcess.push(itemPort)
    }
  }

  /**
   * Simplified binding of a port to a node property
   * Uses Object.defineProperty to create getters/setters that sync port and property values
   *
   * @param targetObject The object to bind the port to (usually the node itself or an object property)
   * @param port The port to bind
   */
  protected bindPortToNodeProperty(targetObject: any, port: IPort): void {
    const config = port.getConfig()
    const key = config.key

    if (!key) {
      return
    }

    // Need a reference to 'this' for the setter function
    const self = this

    if (config.type === 'object') {
      // For object ports, we need to rebind all properties when value changes
      Object.defineProperty(targetObject, key, {
        get() {
          return port.getValue()
        },
        set(newValue) {
          // Set the port value
          port.setValue(newValue)

          // Re-bind all properties for the new object
          const objectValue = port.getValue()
          if (objectValue && typeof objectValue === 'object') {
            const childPorts = self.getChildPorts(port)

            // The critical fix: First update all child port values to match the new object
            // before rebinding them. This prevents overwriting new values with old ones.
            for (const childPort of childPorts) {
              const childConfig = childPort.getConfig()
              const childKey = childConfig.key

              if (childKey) {
                // First update the child port's value to match the corresponding property
                // in the new object value
                if (objectValue[childKey] !== undefined) {
                  childPort.setValue(objectValue[childKey])
                }

                // Rebind each child port to the corresponding property
                self.bindPortToNodeProperty(objectValue, childPort)
              }
            }
          }
        },
        configurable: true,
        enumerable: true,
      })
    } else if (config.type === 'array') {
      // For array ports, need to recreate array port items when value changes
      Object.defineProperty(targetObject, key, {
        get() {
          return port.getValue()
        },
        set(newValue) {
          // Set the port value
          port.setValue(newValue)

          // Recreate all array item ports
          if (Array.isArray(newValue)) {
            self.recreateArrayItemPorts(port, newValue)
          }
        },
        configurable: true,
        enumerable: true,
      })
    } else {
      // For simple types, use standard getter/setter
      Object.defineProperty(targetObject, key, {
        get() {
          return port.getValue()
        },
        set(newValue) {
          port.setValue(newValue)
        },
        configurable: true,
        enumerable: true,
      })
    }
  }

  /**
   * Helper to recreate array item ports when an array is modified
   */
  private recreateArrayItemPorts(arrayPort: IPort, newArray: any[]): void {
    // First remove all existing child ports for this array
    const childPorts = this.getChildPorts(arrayPort)
    for (const childPort of childPorts) {
      // Also remove any nested ports
      const nestedPorts = Array.from(this._ports.entries())
        .filter(([id]) => id.startsWith(`${childPort.id}.`) || id.startsWith(`${childPort.id}[`))

      for (const [id] of nestedPorts) {
        this._ports.delete(id)
      }

      this._ports.delete(childPort.id)
    }

    // Then create new ports for all items in the array
    for (let i = 0; i < newArray.length; i++) {
      this.appendArrayItemToMap(
        arrayPort,
        newArray[i],
        i,
        this._ports,
        [], // Empty array since we're not tracking complex ports here
      )
    }
  }

  /**
   * Helper to process port configurations through PortConfigProcessor
   */
  protected processPortConfig(config: IPortConfig, context: {
    nodeId: string
    parentPortConfig: IPortConfig | null
    propertyKey: string
    propertyValue: any
  }): IPortConfig {
    const processor = new PortConfigProcessor()
    return processor.processPortConfig(config, context)
  }

  /**
   * Add a new property to an object port
   * @param objectPort The parent object port
   * @param key The property key
   * @param portConfig The port configuration for the new property
   */
  public addObjectProperty(objectPort: IPort, key: string, portConfig: IPortConfig): void {
    const config = objectPort.getConfig() as ObjectPortConfig
    if (config.type !== 'object') {
      throw new Error('Cannot add property to non-object port')
    }

    // Update the skeleton schema
    if (!config.schema) {
      config.schema = { properties: {} }
    }

    // Process the port config
    const processedConfig = this.processPortConfig(
      { ...portConfig },
      {
        nodeId: this.id,
        parentPortConfig: config,
        propertyKey: key,
        propertyValue: portConfig.defaultValue,
      },
    )

    // Update the schema with the processed config
    config.schema.properties[key] = processedConfig

    // Create the actual child port
    const childPortId = `${objectPort.id}.${key}`
    const childConfig = {
      ...processedConfig,
      id: childPortId,
      parentId: objectPort.id,
      key,
      nodeId: this.id,
    }

    const childPort = PortFactory.createFromConfig(childConfig)
    this._ports.set(childPortId, childPort)

    // Get the current object value and update it
    const objectValue = objectPort.getValue()
    if (typeof objectValue === 'object' && objectValue !== null) {
      // If default value is provided, set it on the object
      if (processedConfig.defaultValue !== undefined) {
        objectValue[key] = processedConfig.defaultValue
      }

      // Bind the new port to the object property
      this.bindPortToNodeProperty(objectValue, childPort)
    }

    // Update the parent port
    this.updatePort(objectPort)
  }

  /**
   * Remove a property from an object port
   * @param objectPort The parent object port
   * @param key The property key to remove
   */
  public removeObjectProperty(objectPort: IPort, key: string): void {
    const config = objectPort.getConfig() as ObjectPortConfig
    if (config.type !== 'object') {
      throw new Error('Cannot remove property from non-object port')
    }

    // Update the schema
    if (config.schema?.properties) {
      delete config.schema.properties[key]
    }

    // Remove the actual child port
    const childPortId = `${objectPort.id}.${key}`
    this._ports.delete(childPortId)

    // Remove any nested ports that were children of this property
    const childPorts = Array.from(this._ports.entries())
      .filter(([id]) => id.startsWith(`${childPortId}.`) || id.startsWith(`${childPortId}[`))

    for (const [id] of childPorts) {
      this._ports.delete(id)
    }

    // Get the current object value and update it
    const objectValue = objectPort.getValue()
    if (typeof objectValue === 'object' && objectValue !== null) {
      // Remove the property from the object
      delete objectValue[key]
    }

    // Update the parent port
    this.updatePort(objectPort)
  }

  /**
   * Add an item to an array port
   * @param arrayPort The array port
   * @param value The value to append
   * @returns The index of the new item
   */
  public appendArrayItem(arrayPort: IPort, value: any): number {
    const config = arrayPort.getConfig() as ArrayPortConfig
    if (config.type !== 'array') {
      throw new Error('Cannot append item to non-array port')
    }

    // Get current array value or create empty array
    const currentValue = arrayPort.getValue() || []
    const newLength = currentValue.length

    // Process item config
    let itemConfig = { ...config.itemConfig }
    itemConfig = this.processPortConfig(
      itemConfig,
      {
        nodeId: this.id,
        parentPortConfig: config,
        propertyKey: newLength.toString(),
        propertyValue: value,
      },
    )

    // Create the item port
    const itemPortId = `${arrayPort.id}[${newLength}]`
    const completeItemConfig = {
      ...itemConfig,
      id: itemPortId,
      parentId: arrayPort.id,
      key: newLength.toString(),
      nodeId: this.id,
    }

    const itemPort = PortFactory.createFromConfig(completeItemConfig)
    itemPort.setValue(value)
    this._ports.set(itemPortId, itemPort)

    // Update the array value
    const newValue = [...currentValue, value]
    arrayPort.setValue(newValue)

    // Update the array port
    this.updatePort(arrayPort)

    return newLength
  }

  /**
   * Remove an item from an array port
   * @param arrayPort The array port
   * @param index The index to remove
   */
  public removeArrayItem(arrayPort: IPort, index: number): void {
    const config = arrayPort.getConfig() as ArrayPortConfig
    if (config.type !== 'array') {
      throw new Error('Cannot remove item from non-array port')
    }

    // Get current array value
    const currentValue = arrayPort.getValue() || []

    if (index < 0 || index >= currentValue.length) {
      throw new Error(`Invalid array index: ${index}`)
    }

    // Create new array without the item
    const newValue = [
      ...currentValue.slice(0, index),
      ...currentValue.slice(index + 1),
    ]

    // Remove the port for this index
    const itemPortId = `${arrayPort.id}[${index}]`
    this._ports.delete(itemPortId)

    // Update array value
    arrayPort.setValue(newValue)

    // Reindex all ports for items after the removed index
    for (let i = index + 1; i < currentValue.length; i++) {
      const oldPortId = `${arrayPort.id}[${i}]`
      const newPortId = `${arrayPort.id}[${i - 1}]`

      const itemPort = this._ports.get(oldPortId)
      if (itemPort) {
        // Update port config
        const portConfig = itemPort.getConfig()
        const updatedConfig = {
          ...portConfig,
          id: newPortId,
          key: (i - 1).toString(),
        }

        // Create new port with updated config and same value
        const newPort = PortFactory.createFromConfig(updatedConfig)
        newPort.setValue(itemPort.getValue())

        // Remove old and add new
        this._ports.delete(oldPortId)
        this._ports.set(newPortId, newPort)
      }
    }

    // Update the array port
    this.updatePort(arrayPort)
  }

  /**
   * Rebuild all property bindings after deserialization
   */
  protected rebindAfterDeserialization(): void {
    // Find all root ports (those without a parentId)
    const rootPorts = Array.from(this._ports.values())
      .filter(port => !port.getConfig().parentId)

    // Bind each root port to the node
    for (const port of rootPorts) {
      this.bindPortToNodeProperty(this, port)
    }

    // Bind object and array properties
    for (const port of this._ports.values()) {
      const config = port.getConfig()
      const parentId = config.parentId

      if (!parentId)
        continue

      // Find parent port
      const parentPort = this._ports.get(parentId)
      if (!parentPort)
        continue

      const parentValue = parentPort.getValue()
      if (!parentValue)
        continue

      // For object child ports
      if (parentId.includes('.') || !parentId.includes('[')) {
        // For object properties, bind to the parent object's property
        if (typeof parentValue === 'object' && parentValue !== null && !Array.isArray(parentValue)) {
          const key = config.key
          if (key) {
            this.bindPortToNodeProperty(parentValue, port)
          }
        }
      }
      // For array item ports
      else if (parentId.includes('[')) {
        // For array items, bind to the array at the specified index
        if (Array.isArray(parentValue)) {
          const match = port.id.match(/\[(\d+)\]$/)
          if (match) {
            const index = Number.parseInt(match[1], 10)
            if (index < parentValue.length) {
              // If the item is an object, bind ports to its properties
              if (typeof parentValue[index] === 'object' && parentValue[index] !== null) {
                this.bindPortToNodeProperty(parentValue, port)
              }
            }
          }
        }
      }
    }
  }

  /**
   * Rebuild all port bindings for the node
   * Call this after modifying port structure or when ports are manually added/removed
   */
  public rebuildPortBindings(): void {
    // First, find all root ports
    const rootPorts = Array.from(this._ports.values())
      .filter(port => !port.getConfig().parentId)

    // Bind each root port to the node
    for (const root of rootPorts) {
      this.bindPortToNodeProperty(this, root)
    }

    // Then rebind all child ports to their respective parent objects/arrays
    this.rebindAfterDeserialization()
  }

  /**
   * Update port with new configuration/value
   * @param port The port to update
   */
  updatePort(port: IPort): void {
    if (!this._ports.has(port.id)) {
      throw new Error(`Port with ID ${port.id} does not exist in inputs or outputs.`)
    }

    this.incrementVersion()
    this._ports.set(port.id, port)

    // Special handling for complex ports
    const config = port.getConfig()

    // For object ports, we need to ensure child ports are created for any new properties
    if (config.type === 'object') {
      const childPorts = this.getChildPorts(port)
      const objectValue = port.getValue() || {}
      // Rebind the object properties to ensure getter/setter works properly
      for (const childPort of childPorts) {
        if (typeof objectValue === 'object' && objectValue !== null) {
          const key = childPort.getConfig().key
          if (key) {
            objectValue[key] = childPort.getValue()
          }
        }
      }
    }
    // For array ports, we need to handle updates to array values
    else if (config.type === 'array') {
      const arrayValue = port.getValue() || []
      if (Array.isArray(arrayValue)) {
        this.recreateArrayItemPorts(port, arrayValue)
      }
    }

    this.emit(this.createEvent(NodeEventType.PortUpdate, {
      portId: port.id,
      port,
    }))
  }

  /**
   * Find a port by path from the node root
   * @param path Path segments (property names or array indices)
   * @returns The port if found, undefined otherwise
   */
  public findPortByPath(path: string[]): IPort | undefined {
    if (path.length === 0) {
      return undefined
    }

    // Find the root port first
    const rootKey = path[0]
    let currentPort: IPort | undefined

    // Find root port by key
    for (const port of this._ports.values()) {
      if (!port.getConfig().parentId && port.getConfig().key === rootKey) {
        currentPort = port
        break
      }
    }

    if (!currentPort) {
      return undefined
    }

    // Follow the path to find the target port
    for (let i = 1; i < path.length; i++) {
      const segment = path[i]
      const isArrayIndex = segment.match(/^\d+$/)

      // Build the expected port ID based on the current port
      const nextPortId = isArrayIndex
        ? `${currentPort.id}[${segment}]`
        : `${currentPort.id}.${segment}`

      currentPort = this._ports.get(nextPortId)
      if (!currentPort) {
        return undefined
      }
    }

    return currentPort
  }

  /**
   * Get child ports for a given parent port
   * @param parentPort The parent port
   * @returns An array of child ports
   */
  public getChildPorts(parentPort: IPort): IPort[] {
    const parentId = parentPort.id

    return Array.from(this._ports.values())
      .filter(port => port.getConfig().parentId === parentId)
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
  protected async emit<T extends NodeEvent>(event: T): Promise<void> {
    await this.eventQueue.publish(event)
    await this.onEvent(event)
    return Promise.resolve()
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
    this.rebuildPortBindings()
  }

  removePort(portId: string): void {
    if (this._ports.delete(portId)) {
      // Port removed successfully
      this.incrementVersion()
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
   */
  serialize(): JSONValue {
    const serializedPorts: Record<string, JSONValue> = {}
    for (const [portId, port] of this._ports.entries()) {
      serializedPorts[portId] = port.serialize()
    }

    return {
      id: this._id,
      metadata: this._metadata,
      status: this._status,
      ports: serializedPorts,
    }
  }

  /**
   * Deserializes the given JSON data into the node.
   */
  deserialize(data: JSONValue): this {
    // Validate incoming data using the Zod schema.
    const obj = SerializedNodeSchema.parse(data)

    // Update node status (id is typically immutable).
    this._status = obj.status

    // Deserialize metadata and portsConfig.
    this._metadata = obj.metadata || {}

    // Clear current ports map.
    this._ports.clear()

    const ports = obj.ports as Record<string, any>

    // For each key in ports we recreate the port.
    const nodePorts = new Map<string, IPort>()
    for (const portId in ports) {
      const serializedPort = ports[portId]
      if (serializedPort === undefined || serializedPort === null || !('config' in serializedPort)) {
        continue
      }

      const newPort = PortFactory.create(serializedPort.config)
      newPort.deserialize(serializedPort)
      nodePorts.set(portId, newPort as IPort)
    }

    this._ports = nodePorts

    // Then rebuild all bindings
    this.rebindAfterDeserialization()

    return this
  }
}
