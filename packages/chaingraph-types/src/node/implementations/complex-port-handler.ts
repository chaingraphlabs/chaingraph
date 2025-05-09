/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ArrayPortConfig, IPort, IPortConfig, ObjectPortConfig } from '../../port'
import type { INode } from '../interface'
import type { IComplexPortHandler, IPortBinder, IPortManager } from '../interfaces'
import { ObjectPort } from '../../port'
import { PortFactory } from '../../port'
import { PortConfigProcessor } from '../port-config-processor'
import { findPort } from '../traverse-ports'

/**
 * TODO: Rethink the approach to how to bind ports and node fields
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
  addObjectProperty(objectPort: IPort, key: string, portConfig: IPortConfig): IPort {
    const config = objectPort.getConfig() as ObjectPortConfig
    if (config.type !== 'object') {
      throw new Error('Cannot add property to non-object port')
    }

    // Update the skeleton schema
    if (!config.schema) {
      config.schema = { properties: {} }
    }
    if (!config.schema.properties) {
      config.schema.properties = {}
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

    let childPort: IPort | undefined
    const childPortId = `${objectPort.id}.${key}`

    // check if the property already exists
    // Update the schema with the processed config
    const objectPortTyped = objectPort as ObjectPort
    objectPortTyped.addField(
      key,
      processedConfig,
    )
    objectPort.setConfig(config)

    // Find the existing child port
    childPort = this.portManager.getPort(childPortId)
    if (!childPort) {
      // Create the child port
      childPort = PortFactory.createFromConfig({
        ...processedConfig,
        id: childPortId,
        parentId: objectPort.id,
        key,
        nodeId: this.nodeId,
      })
      this.portManager.setPort(childPort)
    }

    // Get the current object value and update it
    const objectValue = objectPort.getValue()
    if (typeof objectValue === 'object' && objectValue !== null) {
      // check if the value is already set
      if (objectValue[key] === undefined) {
        // Set the default value on the object
        objectValue[key] = processedConfig.defaultValue
      }

      // Bind the new port to the object property
      this.portBinder.bindPortToNodeProperty(objectValue, childPort)

      // handle recursive creation of nested ports
      const propertyValue = objectValue[key]
      if (propertyValue !== null && typeof propertyValue === 'object') {
        // Check if this is a complex type that needs recursive port creation
        if (processedConfig.type === 'object' && processedConfig.schema?.properties) {
          // Recursively create ports for each property in the object
          this.createNestedObjectPorts(childPort, propertyValue, processedConfig as ObjectPortConfig)
        } else if (processedConfig.type === 'array' && (processedConfig as ArrayPortConfig).itemConfig) {
          // Recursively create ports for array items
          // if (Array.isArray(propertyValue) && propertyValue.length > 0) {
          this.recreateArrayItemPorts(childPort, propertyValue || [])
          // }
        }
      }
    }

    // if the created child object is the object then create all children
    if (processedConfig.type === 'object' && processedConfig.schema?.properties) {
      this.createNestedObjectPorts(childPort, portConfig.defaultValue, processedConfig as ObjectPortConfig)
    }

    // Bind the parent object port schema property to the child port config
    /// //////////////////////////// EXPERIMENTAL CODE ////////////////////////////

    Object.defineProperty(config.schema.properties, key, {
      get() {
        return childPort.getConfig() as IPortConfig
      },
      set(newConfig) {
        // Update the child port config
        childPort.setConfig(newConfig)
        this.portManager?.updatePort(childPort)
      },
      configurable: true,
      enumerable: true,
    })

    /// //////////////////////////// EXPERIMENTAL CODE END ////////////////////////////

    // Update ports port
    this.portManager.updatePort(childPort)
    this.portManager.updatePort(objectPort)

    if ((objectPort.getConfig().parentId?.length || 0) > 0) {
      // Update the parent port to reflect the new child
      const parentPort = this.portManager.getPort(objectPort.getConfig().parentId!)

      if (parentPort?.getConfig().type === 'object' && parentPort instanceof ObjectPort) {
        this.addObjectProperty(
          parentPort,
          objectPort.getConfig().key!,
          objectPort.getConfig(),
        )
      }
    }

    return childPort
  }

  /**
   * Helper method to create ports for all properties of a nested object
   * @param parentPort The parent port representing the object
   * @param objectValue The actual object value
   * @param config The port configuration for the object
   */
  private createNestedObjectPorts(parentPort: IPort, objectValue: any, config: ObjectPortConfig): void {
    if (!config.schema?.properties)
      return

    // Create a port for each property in the schema
    for (const [propKey, propConfig] of Object.entries(config.schema.properties)) {
      // Skip if property doesn't exist in the object value
      // if (!(propKey in objectValue))
      //   continue

      // Process the property config
      const processedConfig = this.processPortConfig(
        { ...propConfig },
        {
          nodeId: this.nodeId,
          parentPortConfig: config,
          propertyKey: propKey,
          propertyValue: objectValue ? objectValue[propKey] ?? undefined : undefined,
        },
      )

      // Create the nested port
      const nestedPortId = `${parentPort.id}.${propKey}`
      const nestedConfig = {
        ...processedConfig,
        id: nestedPortId,
        parentId: parentPort.id,
        key: propKey,
        nodeId: this.nodeId,
      }

      const nestedPort = PortFactory.createFromConfig(nestedConfig)
      nestedPort.setValue(objectValue ? objectValue[propKey] ?? undefined : undefined)
      this.portManager.setPort(nestedPort)

      // Bind port to object property
      if (objectValue && typeof objectValue === 'object') {
        // Bind the port to the object property
        this.portBinder.bindPortToNodeProperty(objectValue, nestedPort)
      }

      // Recursively handle nested complex types
      const propValue = objectValue ? objectValue[propKey] ?? undefined : undefined
      if (processedConfig.type === 'object' && processedConfig.schema?.properties) {
        // Recursively create ports for nested object
        this.createNestedObjectPorts(nestedPort, propValue, processedConfig as ObjectPortConfig)
      } else if (processedConfig.type === 'array' && Array.isArray(propValue)) {
        // Recursively create ports for array items
        this.recreateArrayItemPorts(nestedPort, propValue)
      }
    }
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
    const childPort = findPort(this.portManager as INode, (port) => {
      return port.getConfig().key === key && port.getConfig().parentId === objectPort.id
    })
    const childPortId = childPort?.id
    if (childPortId) {
      this.portManager.removePort(childPortId)
    }

    const objectPortTyped = objectPort as ObjectPort
    objectPortTyped.removeField(key)

    // Remove any nested ports that were children of this property
    // const ports = this.portManager.ports
    // const childPorts = Array.from(ports.entries())
    //   .filter(([id]) => id.startsWith(`${childPortId}.`) || id.startsWith(`${childPortId}[`))
    // for (const [id] of childPorts) {
    //   this.portManager.removePort(id)
    // }

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

    // If the item is a complex type (object or array), create child ports
    this.createComplexItemChildPorts(itemPort, value)

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

    this.recreateArrayItemPorts(arrayPort, newValue)

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

      // TODO: we need to change the logic. Why do we really need to rely on the id format?
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

    this.portManager.updatePort(arrayPort)
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

    const arrayValue = arrayPort.getValue() || []
    this.portBinder.bindPortToNodeProperty(arrayValue, itemPort)

    // If the item is a complex type (object or array), create child ports
    this.createComplexItemChildPorts(itemPort, value)
  }

  /**
   * Creates child ports for complex item types (objects and arrays)
   * @param itemPort The parent item port
   * @param value The item value
   */
  private createComplexItemChildPorts(itemPort: IPort, value: any): void {
    const itemConfig = itemPort.getConfig()

    // Handle object type items
    if (itemConfig.type === 'object' && itemConfig.schema?.properties && typeof value === 'object' && value !== null) {
      const objectConfig = itemConfig as ObjectPortConfig

      // Create ports for each property in the schema
      for (const [key, propConfig] of Object.entries(objectConfig.schema.properties)) {
        const childPortId = `${itemPort.id}.${key}`
        const childPropertyValue = value[key]

        // Process the property config
        const processedConfig = this.processPortConfig(
          { ...propConfig },
          {
            nodeId: this.nodeId,
            parentPortConfig: objectConfig,
            propertyKey: key,
            propertyValue: childPropertyValue,
          },
        )

        // Create the child port with appropriate configuration
        const childConfig = {
          ...processedConfig,
          id: childPortId,
          parentId: itemPort.id,
          key,
          nodeId: this.nodeId,
        }

        const childPort = PortFactory.createFromConfig(childConfig)
        childPort.setValue(childPropertyValue)
        this.portManager.setPort(childPort)

        // Bind the port to the property
        this.portBinder.bindPortToNodeProperty(value, childPort)

        // Recursively process nested complex types
        this.createComplexItemChildPorts(childPort, childPropertyValue)
      }
    } else if (itemConfig.type === 'array' && Array.isArray(value)) {
      // Handle array type items
      const arrayConfig = itemConfig as ArrayPortConfig

      // Create ports for each array element
      for (let i = 0; i < value.length; i++) {
        const childPortId = `${itemPort.id}[${i}]`
        const elementValue = value[i]

        // Process the element config
        const processedConfig = this.processPortConfig(
          { ...arrayConfig.itemConfig },
          {
            nodeId: this.nodeId,
            parentPortConfig: arrayConfig,
            propertyKey: i.toString(),
            propertyValue: elementValue,
          },
        )

        // Create the element port
        const elementConfig = {
          ...processedConfig,
          id: childPortId,
          parentId: itemPort.id,
          key: i.toString(),
          nodeId: this.nodeId,
        }

        const elementPort = PortFactory.createFromConfig(elementConfig)
        elementPort.setValue(elementValue)
        this.portManager.setPort(elementPort)

        // Bind the port to the array element
        this.portBinder.bindPortToNodeProperty(value, elementPort)

        // Recursively process nested complex types
        this.createComplexItemChildPorts(elementPort, elementValue)
      }
    }
  }
}
