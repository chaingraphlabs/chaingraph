/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ArrayPortConfig, IPort, IPortConfig, ObjectPortConfig } from '../../port'
import type { IComplexPortHandler, IPortBinder, IPortManager } from '../interfaces'
import { PortFactory } from '../../port'
import { PortConfigProcessor } from '../port-config-processor'

/**
 * Implementation of IComplexPortHandler interface
 * Handles operations on complex port types (objects and arrays)
 */
export class ComplexPortHandler implements IComplexPortHandler {
  constructor(
    private portManager: IPortManager,
    private portBinder: IPortBinder,
    private nodeId: string,
  ) { }

  /**
   * Add a new property to an object port
   * @param objectPort The parent object port
   * @param key The property key
   * @param portConfig The port configuration for the new property
   */
  addObjectProperty(objectPort: IPort, key: string, portConfig: IPortConfig): void {
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
        nodeId: this.nodeId,
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
      nodeId: this.nodeId,
    }

    const childPort = PortFactory.createFromConfig(childConfig)
    this.portManager.setPort(childPort)

    // Get the current object value and update it
    const objectValue = objectPort.getValue()
    if (typeof objectValue === 'object' && objectValue !== null) {
      // If default value is provided, set it on the object
      if (processedConfig.defaultValue !== undefined) {
        objectValue[key] = processedConfig.defaultValue
      }

      // Bind the new port to the object property
      this.portBinder.bindPortToNodeProperty(objectValue, childPort)
    }

    // Update the parent port
    this.portManager.updatePort(objectPort)
  }

  /**
   * Remove a property from an object port
   * @param objectPort The parent object port
   * @param key The property key to remove
   */
  removeObjectProperty(objectPort: IPort, key: string): void {
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
    this.portManager.removePort(childPortId)

    // Remove any nested ports that were children of this property
    const ports = this.portManager.ports
    const childPorts = Array.from(ports.entries())
      .filter(([id]) => id.startsWith(`${childPortId}.`) || id.startsWith(`${childPortId}[`))

    for (const [id] of childPorts) {
      this.portManager.removePort(id)
    }

    // Get the current object value and update it
    const objectValue = objectPort.getValue()
    if (typeof objectValue === 'object' && objectValue !== null) {
      // Remove the property from the object
      delete objectValue[key]
    }

    // Update the parent port
    this.portManager.updatePort(objectPort)
  }

  /**
   * Add an item to an array port
   * @param arrayPort The array port
   * @param value The value to append
   * @returns The index of the new item
   */
  appendArrayItem(arrayPort: IPort, value: any): number {
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
        nodeId: this.nodeId,
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
      nodeId: this.nodeId,
    }

    const itemPort = PortFactory.createFromConfig(completeItemConfig)
    itemPort.setValue(value)
    this.portManager.setPort(itemPort)

    // Update the array value
    const newValue = [...currentValue, value]
    arrayPort.setValue(newValue)

    // Update the array port
    this.portManager.updatePort(arrayPort)

    return newLength
  }

  /**
   * Remove an item from an array port
   * @param arrayPort The array port
   * @param index The index to remove
   */
  removeArrayItem(arrayPort: IPort, index: number): void {
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
    this.portManager.removePort(itemPortId)

    // Update array value
    arrayPort.setValue(newValue)

    // Reindex all ports for items after the removed index
    for (let i = index + 1; i < currentValue.length; i++) {
      const oldPortId = `${arrayPort.id}[${i}]`
      const newPortId = `${arrayPort.id}[${i - 1}]`

      const itemPort = this.portManager.getPort(oldPortId)
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
        this.portManager.removePort(oldPortId)
        this.portManager.setPort(newPort)
      }
    }

    // Update the array port
    this.portManager.updatePort(arrayPort)
  }

  /**
   * Helper to process port configurations through PortConfigProcessor
   */
  processPortConfig(config: IPortConfig, context: {
    nodeId: string
    parentPortConfig: IPortConfig | null
    propertyKey: string
    propertyValue: any
  }): IPortConfig {
    const processor = new PortConfigProcessor()
    return processor.processPortConfig(config, context)
  }

  /**
   * Helper to recreate array item ports when an array is modified
   * @param arrayPort The array port
   * @param newArray The new array value
   */
  recreateArrayItemPorts(arrayPort: IPort, newArray: any[]): void {
    // First remove all existing child ports for this array
    const childPorts = this.portManager.getChildPorts(arrayPort)
    for (const childPort of childPorts) {
      // Also remove any nested ports
      const ports = this.portManager.ports
      const nestedPorts = Array.from(ports.entries())
        .filter(([id]) => id.startsWith(`${childPort.id}.`) || id.startsWith(`${childPort.id}[`))

      for (const [id] of nestedPorts) {
        this.portManager.removePort(id)
      }

      this.portManager.removePort(childPort.id)
    }

    // Then create new ports for all items in the array
    for (let i = 0; i < newArray.length; i++) {
      this.appendArrayItemToMap(
        arrayPort,
        newArray[i],
        i,
      )
    }
  }

  /**
   * Helper method to create an array item port and add it to the port map
   */
  private appendArrayItemToMap(
    arrayPort: IPort,
    value: any,
    index: number,
  ): void {
    const config = arrayPort.getConfig() as ArrayPortConfig

    // Process item config
    let itemConfig = { ...config.itemConfig }
    itemConfig = this.processPortConfig(
      itemConfig,
      {
        nodeId: this.nodeId,
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
      nodeId: this.nodeId,
    }

    const itemPort = PortFactory.createFromConfig(completeItemConfig)
    itemPort.setValue(value)
    this.portManager.setPort(itemPort)
  }
}
