/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ArrayPort,
  ArrayPortConfig,
  IPort,
  IPortConfig,
  ObjectPortConfig,
} from '../../port'
import type { IComplexPortHandler, IPortBinder, IPortManager } from '../interfaces'

import {
  AnyPort,
} from '../../port'
import {
  generatePortID,
} from '../../port'
import {
  generatePortIDArrayElement,
} from '../../port'
import { ObjectPort } from '../../port'
import { PortFactory } from '../../port'
import { deepCopy } from '../../utils'
import { PortConfigProcessor } from '../port-config-processor'

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
   * @param useParentUI indicates whether we want to use the parents UI
   */
  addObjectProperty(objectPort: IPort, key: string, portConfig: IPortConfig, useParentUI?: boolean): IPort {
    return this.addObjectProperties(objectPort, [{ ...portConfig, key }], useParentUI)[0]
  }

  /**
   * Add multiple properties to an object port
   * @param objectPort The parent object port
   * @param properties The properties to add
   * @param useParentUI indicates whether we want to use the parents UI
   * @returns The updated object port with the new properties
   */
  addObjectProperties(objectPort: IPort, properties: IPortConfig[], useParentUI?: boolean): IPort[] {
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

    const childPorts: IPort[] = []

    for (const portConfig of properties) {
      const key = portConfig.key || portConfig.id || portConfig.name || generatePortID('objectProperty')
      const newPortConfig = useParentUI
        ? this.generateChildConfigWithParentUI(deepCopy(config), deepCopy(portConfig))
        : portConfig

      // Process the port config
      const processedConfig = this.processPortConfig(
        { ...newPortConfig },
        {
          nodeId: this.nodeId,
          parentPortConfig: config,
          propertyKey: key,
          propertyValue: newPortConfig.defaultValue,
        },
      )

      let childPort: IPort | undefined
      const childPortId = `${objectPort.id}.${key}`

      // check if the property already exists
      // Update the schema with the processed config
      const objectPortTyped = objectPort as ObjectPort
      objectPortTyped.addField(
        key,
        newPortConfig,
        // processedConfig,
      )

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
      const objectValue = objectPort.getValue() || {}
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
            this.createNestedObjectPorts(
              childPort,
              propertyValue,
              processedConfig as ObjectPortConfig,
              useParentUI,
            )
          } else if (processedConfig.type === 'array' && (processedConfig as ArrayPortConfig).itemConfig) {
            // Recursively create ports for array items
            this.recreateArrayItemPorts(
              childPort,
              propertyValue || [],
            )
          }
        }
      }

      // if the created child object is the object then create all children
      if (processedConfig.type === 'object' && processedConfig.schema?.properties) {
        this.createNestedObjectPorts(
          childPort,
          newPortConfig.defaultValue,
          processedConfig as ObjectPortConfig,
          useParentUI,
        )
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

      // Add the child port to the list of created ports
      childPorts.push(childPort)
    }

    objectPort.setConfig(config)

    // if the object port has a parent, we need to update the parent port schema
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

    // Update the object port with the new schema
    this.portManager.updatePorts(childPorts)
    this.portManager.updatePort(objectPort)

    return childPorts
  }

  /**
   * Recursively copy object schema from source to target port
   * Handles nested objects and arrays with proper type checking
   * @param sourceNode Source node that contains the source port
   * @param sourceObjectPort Source object port
   * @param targetObjectPort Target object port
   * @param useParentUI Whether to use parent UI settings
   */
  copyObjectSchemaTo(
    sourceNode: IPortManager,
    sourceObjectPort: ObjectPort | AnyPort,
    targetObjectPort: ObjectPort,
    useParentUI?: boolean,
  ): void {
    const sourceConfig
      = sourceObjectPort instanceof AnyPort
        ? sourceObjectPort.unwrapUnderlyingType() || sourceObjectPort.getConfig()
        : sourceObjectPort.getConfig()

    // if (sourceConfig.type !== 'object') {
    //   throw new Error('Cannot copy schema from non-object port')
    // }

    const targetConfig = targetObjectPort.getConfig() as ObjectPortConfig
    if (targetConfig.type !== 'object') {
      throw new Error('Cannot copy schema to non-object port')
    }

    const sourceProperties = sourceConfig.type === 'object'
      ? sourceConfig.schema?.properties || {}
      : {}
    const targetProperties = targetConfig.schema?.properties || {}

    // Collect properties to delete (exist in target but not in source)
    const propsToDelete: string[] = []
    for (const targetPropKey of Object.keys(targetProperties)) {
      if (!(targetPropKey in sourceProperties)) {
        propsToDelete.push(targetPropKey)
      }
    }

    // Delete properties that don't exist in source
    if (propsToDelete.length > 0) {
      this.removeObjectProperties(targetObjectPort as IPort, propsToDelete)
    }

    // Process each property in source schema
    const propertiesToAdd: IPortConfig[] = []
    const portsToRemove: string[] = []
    const portsToUpdate: IPort[] = []
    const portsToRecurse: Array<{ sourcePort: IPort, targetPort: IPort }> = []

    for (const [propKey, sourcePropConfig] of Object.entries(sourceProperties)) {
      const sourcePort = sourceNode.findPort((port) => {
        return port.getConfig().key === propKey && port.getConfig().parentId === sourceObjectPort.id
      })

      if (!sourcePort) {
        console.warn(`Source port for property ${propKey} not found in source object port ${sourceObjectPort.id}`)
        continue
      }

      let sourcePortConfig = sourcePort.getConfig() as IPortConfig

      if (sourcePort instanceof AnyPort) {
        const unwrapUnderlyingType = sourcePort.unwrapUnderlyingType()
        if (unwrapUnderlyingType) {
          sourcePortConfig = unwrapUnderlyingType
        } else {
          console.warn(`Source port ${sourcePort.id} is an AnyPort but has no underlying type to unwrap`)
        }
      }

      const existingTargetPropConfig = targetProperties[propKey]

      if (!existingTargetPropConfig) {
        // Property doesn't exist in target, we need to add it
        // Use the source configuration for the new property
        const newPropConfig: IPortConfig = {
          ...deepCopy(sourcePortConfig),
          id: generatePortID(`${targetObjectPort.id}.${propKey}`),
          key: propKey,
          direction: targetConfig.direction,
          defaultValue: sourcePortConfig.defaultValue,
          connections: [],
        }
        propertiesToAdd.push(newPropConfig)
      } else {
        const targetPort = this.portManager.findPort((port) => {
          return port.getConfig().key === propKey && port.getConfig().parentId === targetObjectPort.id
        })

        if (!targetPort) {
          console.debug(`Property ${propKey} does not exist in target port ${targetObjectPort.id}, needs to be added`)

          // Property doesn't exist in target, we need to add it
          const newPropConfig: IPortConfig = {
            ...deepCopy(sourcePortConfig),
            id: generatePortID(`${targetObjectPort.id}.${propKey}`),
            key: propKey,
            direction: targetConfig.direction,
            defaultValue: sourcePortConfig.defaultValue,
            connections: [],
          }
          propertiesToAdd.push(newPropConfig)

          continue
        }

        // Property exists in target, check if types match
        if (existingTargetPropConfig.type !== sourcePortConfig.type) { // TODO: we could add more complex type checks here
          // Type mismatch, we need to recreate the port
          portsToRemove.push(targetPort.getConfig().key!)

          const newPropConfig: IPortConfig = {
            ...deepCopy(sourcePortConfig),
            id: generatePortID(`${targetObjectPort.id}.${propKey}`),
            key: propKey,
            direction: targetConfig.direction,
            defaultValue: sourcePortConfig.defaultValue,
            connections: [],
          }
          propertiesToAdd.push(newPropConfig)
        } else {
          // Handle recursive cases for complex types
          if (sourcePortConfig.type === 'object' && existingTargetPropConfig.type === 'object') {
            portsToRecurse.push({
              sourcePort: sourcePort as IPort,
              targetPort,
            })
          } else if (sourcePortConfig.type === 'array' && existingTargetPropConfig.type === 'array') {
            // TODO: Handle array item configuration updates?

          }

          // There's no need to recreate or recurse for simple types
        }
      }
    }

    if (propertiesToAdd.length === 0 && portsToRecurse.length === 0 && portsToUpdate.length === 0 && portsToRemove.length === 0) {
      return
    }

    if (portsToRemove.length > 0) {
      this.removeObjectProperties(targetObjectPort as IPort, portsToRemove)
    }

    // Add new properties
    if (propertiesToAdd.length > 0) {
      this.addObjectProperties(targetObjectPort as IPort, propertiesToAdd, useParentUI)
    }

    if (portsToUpdate.length > 0) {
      this.portManager.updatePorts(portsToUpdate)
    }

    // Recursively process nested object ports

    for (const { sourcePort, targetPort } of portsToRecurse) {
      this.copyObjectSchemaTo(
        sourceNode,
        sourcePort as ObjectPort,
        targetPort as ObjectPort,
        useParentUI,
      )
    }

    // Update target port configuration
    targetObjectPort.setValue({})
    targetObjectPort.setConfig(deepCopy(targetConfig))
    targetObjectPort.setValue(deepCopy(targetConfig.defaultValue) || {})

    this.portManager.updatePort(targetObjectPort as IPort)
  }

  /**
   * Helper method to create ports for all properties of a nested object
   * @param parentPort The parent port representing the object
   * @param objectValue The actual object value
   * @param config The port configuration for the object
   * @param useParentUI indicates whether we want to use the parents UI
   */
  private createNestedObjectPorts(
    parentPort: IPort,
    objectValue: any,
    config: ObjectPortConfig,
    useParentUI?: boolean,
  ): void {
    if (!config.schema?.properties)
      return

    // Create a port for each property in the schema
    for (const [propKey, propConfig] of Object.entries(config.schema.properties)) {
      // Skip if property doesn't exist in the object value
      // if (!(propKey in objectValue))
      //   continue

      const newPropConfig = useParentUI ? this.generateChildConfigWithParentUI(config, propConfig) : propConfig

      // Process the property config
      const processedConfig = this.processPortConfig(
        { ...newPropConfig },
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
        this.createNestedObjectPorts(nestedPort, propValue, processedConfig as ObjectPortConfig, useParentUI)
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
    this.removeObjectProperties(objectPort, [key])
  }

  /**
   * Remove multiple properties from an object port
   * @param objectPort
   * @param keys
   */
  removeObjectProperties(objectPort: IPort, keys: string[]): void {
    const portsToRemove: string[] = []

    for (const key of keys) {
      const config = objectPort.getConfig() as ObjectPortConfig
      if (config.type !== 'object') {
        throw new Error('Cannot remove property from non-object port')
      }

      // Update the schema
      if (config.schema?.properties) {
        delete config.schema.properties[key]
      }

      // Remove the actual child port
      const childPort = this.portManager.findPort(
        (port) => {
          return port.getConfig().key === key && port.getConfig().parentId === objectPort.id
        },
      )
      if (childPort) {
        portsToRemove.push(childPort.id)
      }

      const objectPortTyped = objectPort as ObjectPort
      objectPortTyped.removeField(key)

      // Get the current object value and update it
      const objectValue = objectPort.getValue()
      if (typeof objectValue === 'object' && objectValue !== null) {
        // Remove the property from the object
        delete objectValue[key]
      }
    }

    // Remove the ports from the port manager
    this.portManager.removePorts(portsToRemove)

    // Update the parent port
    this.portManager.updatePort(objectPort)
  }

  /**
   * Updates the items with the new array ports item configuration
   * @param arrayPort The array port
   */
  updateArrayItemConfig(arrayPort: IPort): void {
    if (arrayPort.getConfig().type !== 'array') {
      throw new Error('Cannot remove item from non-array port')
    }

    // Get current array value
    const currentValue = arrayPort.getValue() || []

    if (currentValue.length > 0) {
      // This recreates all item ports and use the new item configuration from the array port
      this.recreateArrayItemPorts(arrayPort, currentValue)
    }

    // Update the array port
    this.portManager.updatePort(arrayPort)
  }

  /**
   * Add an item to an array port
   * @param arrayPort The array port
   * @param value The value to append
   * @returns The index of the new item
   */
  appendArrayItem(arrayPort: IPort, value: any): number {
    console.log(`Appending item to array port ${arrayPort.id} with value: ${JSON.stringify(value)}`)

    const config = arrayPort.getConfig()
    if (config.type !== 'array') {
      throw new Error('Cannot append item to non-array port')
    }

    // Get current array value or create empty array
    const currentValue = arrayPort.getValue() || []
    const newLength = currentValue.length

    // Process item config
    const itemConfig = this.processPortConfig(
      { ...deepCopy(config.itemConfig) },
      {
        nodeId: this.nodeId,
        parentPortConfig: config,
        propertyKey: newLength.toString(),
        propertyValue: value,
      },
    )

    // Create the item port
    const itemPortId = generatePortIDArrayElement(arrayPort.id, newLength)
    const completeItemConfig: IPortConfig = {
      ...itemConfig,
      id: itemPortId,
      parentId: arrayPort.id,
      key: newLength.toString(),
      nodeId: this.nodeId,
    }

    let actualValue = deepCopy(value) ?? deepCopy(completeItemConfig.defaultValue) ?? undefined
    const itemPort = PortFactory.createFromConfig(completeItemConfig)
    this.portManager.setPort(itemPort)

    // If the item is a complex type (object or array), create child ports
    actualValue = this.createComplexItemChildPorts(itemPort, actualValue)
    itemPort.setValue(actualValue)

    // Update the array value
    const newValue = [...currentValue, actualValue]
    arrayPort.setValue(newValue)

    // Update the array port
    this.portManager.updatePort(itemPort)
    this.portManager.updatePort(arrayPort)

    return newLength
  }

  /**
   * Remove an item from an array port
   * @param arrayPort The array port
   * @param index The index to remove
   */
  removeArrayItem(arrayPort: IPort, index: number): void {
    const config = arrayPort.getConfig()
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
    const itemPortId = generatePortIDArrayElement(arrayPort.id, index)
    this.portManager.removePort(itemPortId)

    // Update array value
    arrayPort.setValue(newValue)

    this.recreateArrayItemPorts(arrayPort, newValue)

    // Update the array port
    this.portManager.updatePort(arrayPort)
  }

  removeArrayItems(arrayPort: IPort, indices: number[]): void {
    const config = arrayPort.getConfig()
    if (config.type !== 'array') {
      throw new Error('Cannot remove items from non-array port')
    }

    // Get current array value
    const currentValue = (arrayPort as ArrayPort).getValue() || []

    // Validate all indices
    const sortedIndices = [...new Set(indices)].sort((a, b) => b - a) // Sort descending and remove duplicates
    for (const index of sortedIndices) {
      if (index < 0 || index >= currentValue.length) {
        throw new Error(`Invalid array index: ${index}`)
      }
    }

    // Create new array without the specified items
    const newValue = currentValue.filter((_, index) => !indices.includes(index))
    this.portManager.removePorts(
      indices.map(index => generatePortIDArrayElement(arrayPort.id, index)),
    )

    // Update array value
    arrayPort.setValue(newValue)

    // Recreate array item ports with new indices
    this.recreateArrayItemPorts(arrayPort, newValue)
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
    // Remove existing nested ports
    const childPorts = this.portManager.getChildPorts(arrayPort)
    this.portManager.removePorts(
      childPorts.map(port => port.id),
    )

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
    const itemConfig = this.processPortConfig(
      { ...deepCopy(config.itemConfig) },
      {
        nodeId: this.nodeId,
        parentPortConfig: config,
        propertyKey: index.toString(),
        propertyValue: value,
      },
    )

    // Create the item port
    const itemPortId = `${arrayPort.id}[${index}]`
    const completeItemConfig: IPortConfig = {
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
  private createComplexItemChildPorts(itemPort: IPort, value: any): any {
    const itemConfig
      = itemPort instanceof AnyPort
        ? itemPort.unwrapUnderlyingType() || itemPort.getConfig()
        : itemPort.getConfig()

    // Handle object type items
    if (itemConfig.type === 'object' && itemConfig.schema?.properties) {
      const objectConfig = itemConfig as ObjectPortConfig

      if (!value) {
        value = {}
      }

      // Create ports for each property in the schema
      for (const [key, propConfig] of Object.entries(objectConfig.schema.properties)) {
        const childPortId = `${itemPort.id}.${key}`
        if (!value[key]) {
          value[key] = deepCopy(propConfig.defaultValue) ?? undefined
        }

        const childPropertyValue = value[key]

        // Process the property config
        const processedConfig = this.processPortConfig(
          { ...deepCopy(propConfig) },
          {
            nodeId: this.nodeId,
            parentPortConfig: objectConfig,
            propertyKey: key,
            propertyValue: childPropertyValue,
          },
        )

        // Create the child port with appropriate configuration
        const childConfig: IPortConfig = {
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

      if (!value) {
        value = []
      }

      // Create ports for each array element
      for (let i = 0; i < (value.length || 0); i++) {
        const childPortId = generatePortIDArrayElement(itemPort.id, i)
        const elementValue = value[i]

        // Process the element config
        const processedConfig = this.processPortConfig(
          { ...deepCopy(arrayConfig.itemConfig) },
          {
            nodeId: this.nodeId,
            parentPortConfig: arrayConfig,
            propertyKey: i.toString(),
            propertyValue: elementValue,
          },
        )

        // Create the element port
        const elementConfig: IPortConfig = {
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

    return value
  }

  /**
   * Creates or deletes child ports depending on whether the child type is an object.
   * This allows child ports to be rendered for objects connected to Any ports
   * @param anyPort The Any port
   * @param useParentUI indicates whether we want to use the parents UI
   */
  refreshAnyPortUnderlyingPorts(anyPort: IPort, useParentUI?: boolean): void {
    // Check if the child ports already exists - if it does, remove these first
    const childPorts = this.portManager.getChildPorts(anyPort)
    if (childPorts.length) {
      this.portManager.removePorts(childPorts.map(port => port.id))
    }

    this.createComplexItemChildPorts(anyPort, anyPort.getValue())
    this.portManager.updatePort(anyPort)
  }

  refreshAnyPortUnderlyingPorts_tmp(anyPort: IPort, useParentUI?: boolean): void {
    const config = anyPort.getConfig()

    // Check if this is an Any port
    if (config.type !== 'any') {
      return
    }

    // Check if this is an Any port with an underlying type
    if (!config.underlyingType) {
      // reset value to undefined
      anyPort.setValue(undefined)
      return
    }

    // Check if the child ports already exists - if it does, remove these first
    const childPorts = this.portManager.getChildPorts(anyPort)
    if (childPorts.length) {
      this.portManager.removePorts(childPorts.map(port => port.id))
    }

    // check if the underlying type is not an object
    if (config.underlyingType.type !== 'object') {
      // reset value to underlying types default value if exists
      anyPort.setValue(deepCopy(config.underlyingType.defaultValue))
      return
    }

    const underlyingType = config.underlyingType as ObjectPortConfig

    // Update the skeleton schema
    if (!underlyingType.schema) {
      underlyingType.schema = { properties: {} }
    }
    if (!underlyingType.schema.properties) {
      underlyingType.schema.properties = {}
    }

    for (const [propKey, propConfig] of Object.entries(underlyingType.schema.properties)) {
      // Process the port config
      const newPropConfig = useParentUI
        ? this.generateChildConfigWithParentUI(underlyingType, deepCopy(propConfig))
        : deepCopy(propConfig)

      const processedConfig = this.processPortConfig(
        { ...newPropConfig },
        {
          nodeId: this.nodeId,
          parentPortConfig: config,
          propertyKey: propKey,
          propertyValue: newPropConfig.defaultValue,
        },
      )

      let childPort: IPort | undefined
      const childPortId = `${anyPort.id}.${propKey}`

      // Find the existing child port (should not be exist but for safety)
      childPort = this.portManager.getPort(childPortId)
      if (!childPort) {
        // Create the child port
        childPort = PortFactory.createFromConfig({
          ...processedConfig,
          id: childPortId,
          parentId: anyPort.id,
          key: propKey,
          nodeId: this.nodeId,
        })
        this.portManager.setPort(childPort)
      }

      // Get the current object value and update it
      let objectValue = anyPort.getValue()
      // if value is not an object or is null, initialize the anyports value with an empty object
      if (typeof objectValue !== 'object' || Array.isArray(objectValue) || objectValue === null) {
        anyPort.setValue({})
        objectValue = {}
      }

      // check if the value is already set
      if (objectValue[propKey] === undefined) {
        // Set the default value on the object
        objectValue[propKey] = deepCopy(processedConfig.defaultValue)
      }

      // Bind the new port to the object property
      this.portBinder.bindPortToNodeProperty(objectValue, childPort)

      // handle recursive creation of nested ports
      const propertyValue = objectValue[propKey]
      if (propertyValue !== null && typeof propertyValue === 'object') {
        // Check if this is a complex type that needs recursive port creation
        if (processedConfig.type === 'object' && processedConfig.schema?.properties) {
          // Recursively create ports for each property in the object
          this.createNestedObjectPorts(childPort, propertyValue, processedConfig as ObjectPortConfig, useParentUI)
        } else if (processedConfig.type === 'array' && (processedConfig as ArrayPortConfig).itemConfig) {
          // Recursively create ports for array items
          this.recreateArrayItemPorts(childPort, propertyValue || [])
        }
      } else if (processedConfig.type === 'object' && processedConfig.schema?.properties) {
        // if the created child object is the object then create all children
        this.createNestedObjectPorts(childPort, newPropConfig.defaultValue, processedConfig as ObjectPortConfig, useParentUI)
      }

      // Bind the parent object port schema property to the child port config
      /// //////////////////////////// EXPERIMENTAL CODE ////////////////////////////

      Object.defineProperty(underlyingType.schema.properties, propKey, {
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
    }
    this.portManager.updatePort(anyPort)

    if ((anyPort.getConfig().parentId?.length || 0) > 0) {
      // Update the parent port to reflect the new child
      const parentPort = this.portManager.getPort(anyPort.getConfig().parentId!)

      if (parentPort?.getConfig().type === 'object' && parentPort instanceof ObjectPort) {
        this.addObjectProperty(
          parentPort,
          anyPort.getConfig().key!,
          anyPort.getConfig(),
        )
      }
    }
  }

  /**
   * Generates child port configuration and set some Ui configuration from the parent
   * @param parentConfig The parent port configuration
   * @param childConfig The child port configuration
   * @returns new child port configuration
   */
  private generateChildConfigWithParentUI(parentConfig: ObjectPortConfig, childConfig: IPortConfig): IPortConfig {
    if (childConfig.type === 'object') {
      const newChildConfig: ObjectPortConfig = {
        ...childConfig,
        isSchemaMutable: parentConfig.isSchemaMutable,
        direction: parentConfig.direction,
        ui: {
          ...childConfig.ui,
          hidden: parentConfig.ui?.hidden,
          disabled: parentConfig.ui?.disabled,
          hideEditor: parentConfig.ui?.hideEditor,
          hidePort: parentConfig.ui?.hidePort,
          collapsed: parentConfig.ui?.collapsed,
          keyDeletable: parentConfig.ui?.keyDeletable,
          hidePropertyEditor: parentConfig.ui?.hidePropertyEditor,
        },
      }
      return newChildConfig
    } else {
      return {
        ...childConfig,
        direction: parentConfig.direction,
        ui: {
          ...childConfig.ui,
          hidden: parentConfig.ui?.hidden,
          disabled: parentConfig.ui?.disabled,
          hideEditor: parentConfig.ui?.hideEditor,
          hidePort: parentConfig.ui?.hidePort,
        },
      }
    }
  }
}
