/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ArrayPortConfig,
  IPort,
  IPortConfig,
  ObjectPortConfig,
} from '../../port'
import type { IComplexPortHandler, INodeComposite, IPortBinder, IPortManager } from '../interfaces'
import {
  AnyPort,
} from '../../port'
import {
  generatePortIDArrayElement,
} from '../../port'
import { PortFactory } from '../../port'
import { PortConfigProcessor } from '../port-config-processor'

/**
 * TODO: Rethink the approach to how to bind ports and node fields
 * Implementation of IPortBinder interface
 * Handles binding ports to object properties and creating port hierarchies
 */
export class PortBinder implements IPortBinder {
  // Reference to port manager for accessing ports
  private complexPortHandler?: IComplexPortHandler
  private nodeInstance: INodeComposite
  private nodeId: string

  constructor(
    private portManager: IPortManager,
    nodeInstance: INodeComposite,
    nodeId: string,
  ) {
    this.nodeInstance = nodeInstance
    this.nodeId = nodeId
  }

  // Set the complex port handler (to avoid circular dependencies)
  setComplexPortHandler(handler: IComplexPortHandler): void {
    this.complexPortHandler = handler
  }

  /**
   * Bind a port to an object property using getters/setters
   * @param targetObject The object to bind the port to
   * @param port The port to bind
   */
  bindPortToNodeProperty(targetObject: any, port: IPort): void {
    const config = port.getConfig()
    let key: string | number | undefined = config.key

    if (!key) {
      return
    }

    // Need a reference to 'this' for the setter function
    // eslint-disable-next-line ts/no-this-alias
    const self = this
    const portManager = this.portManager

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
            const childPorts = portManager.getChildPorts(port)

            // The critical fix: First update all child port values to match the new object
            // before rebinding them. This prevents overwriting new values with old ones.
            for (const childPort of childPorts) {
              const childKey = childPort.getConfig().key
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

      // For each child port, bind it to the new object value
      const objectValue = port.getValue()
      if (objectValue && typeof objectValue === 'object') {
        const childPorts = portManager.getChildPorts(port)
        for (const childPort of childPorts) {
          if (childPort.getConfig().key) {
            // Bind each child port to the corresponding property
            self.bindPortToNodeProperty(objectValue, childPort)
          }
        }
      }
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
          if (Array.isArray(newValue) && self.complexPortHandler) {
            self.complexPortHandler.recreateArrayItemPorts(port, newValue)
          }
        },
        configurable: true,
        enumerable: true,
      })

      // For each item in the array, bind it to the new array value
      const arrayValue = port.getValue()
      if (arrayValue && Array.isArray(arrayValue)) {
        const childPorts = portManager.getChildPorts(port)
        for (const childPort of childPorts) {
          const childConfig = childPort.getConfig()
          const childKey = childConfig.key

          if (childKey) {
            // Bind each child port to the corresponding property
            self.bindPortToNodeProperty(arrayValue, childPort)
          }
        }
      }
    } else if (config.type === 'any' && config.underlyingType?.type === 'object') {
      // For any ports with underlying type of object, we need to rebind all properties when value changes
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
            const childPorts = portManager.getChildPorts(port)

            // The critical fix: First update all child port values to match the new object
            // before rebinding them. This prevents overwriting new values with old ones.
            for (const childPort of childPorts) {
              const childKey = childPort.getConfig().key
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

      // For each child port, bind it to the new object value
      const objectValue = port.getValue()
      if (objectValue && typeof objectValue === 'object') {
        const childPorts = portManager.getChildPorts(port)
        for (const childPort of childPorts) {
          if (childPort.getConfig().key) {
            // Bind each child port to the corresponding property
            self.bindPortToNodeProperty(objectValue, childPort)
          }
        }
      }
    } else {
      // For simple types, use standard getter/setter

      if (Array.isArray(targetObject)) {
        // try to parse key as index for the array
        const index = Number.parseInt(key, 10)
        if (Number.isNaN(index)) {
          throw new TypeError(`Key "${key}" is not a valid array index`)
        }
        key = index
      }

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

        // Bind this root port to the node property - CRITICAL FIX
        this.bindPortToNodeProperty(this.nodeInstance, port)

        // If this is a complex port (object, array, any), add it to the list to process
        const config = port.getConfig()
        if (config.type === 'object' || config.type === 'array' || config.type === 'any') {
          objectPortsToProcess.push(port)
        }
      }
    }

    // Process complex ports recursively
    this.processComplexPorts(portMap, objectPortsToProcess)

    // Update the port manager with all created ports
    this.portManager.setPorts(portMap)
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
      } else if (config.type === 'any') {
        this.processAnyPort(port, portMap, portsToProcess)
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
      // Process the port config with the processor to handle nested ports
      const processedConfig = this.processPortConfig(
        { ...propertyConfig },
        {
          nodeId: this.nodeId,
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
        nodeId: this.nodeId,
      }

      const childPort = PortFactory.createFromConfig(childConfig)
      portMap.set(childPortId, childPort)

      // Bind to parent object - CRITICAL FIX
      if (typeof objectValue === 'object' && objectValue !== null) {
        this.bindPortToNodeProperty(objectValue, childPort)
      }

      // If this child is a complex port, add it to the processing queue
      if (childConfig.type === 'object' || childConfig.type === 'array' || childConfig.type === 'any') {
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
      this.appendArrayItemToMap(
        arrayPort,
        arrayValue[i],
        i,
        portMap,
        portsToProcess,
      )
    }
  }

  /**
   * Process an any port with underlying type object to create child ports for all properties
   * @param anyPort The object port to process
   * @param portMap The map to add created ports to
   * @param portsToProcess List to add any new complex ports to
   */
  private processAnyPort(anyPort: IPort, portMap: Map<string, IPort>, portsToProcess: IPort[]): void {
    const isAnyPort = anyPort instanceof AnyPort
    if (!isAnyPort) {
      return
    }

    const config = anyPort.getConfig()
    const underlyingType = anyPort.unwrapUnderlyingType()

    if (!underlyingType || underlyingType.type !== 'object') {
      // TODO: Change behavior to handle other underlying types if needed, e.g. arrays
      return
    }

    const objectUnderlyingType = underlyingType as ObjectPortConfig

    const properties = objectUnderlyingType.schema?.properties
    if (!properties || Object.keys(properties).length === 0) {
      // If there are no properties, we don't need to create child ports
      return
    }

    const anyValue = anyPort.getValue() || {}

    // Process each property in the schema
    for (const [key, propertyConfig] of Object.entries(properties)) {
      // Process the port config with the processor to handle nested ports
      const processedConfig = this.processPortConfig(
        { ...propertyConfig },
        {
          nodeId: this.nodeId,
          parentPortConfig: config,
          propertyKey: key,
          propertyValue: anyValue[key],
        },
      )

      // Create the child port
      const childPortId = `${anyPort.id}.${key}`
      const childConfig = {
        ...processedConfig,
        id: childPortId,
        parentId: anyPort.id,
        key,
        nodeId: this.nodeId,
      }

      const childPort = PortFactory.createFromConfig(childConfig)
      portMap.set(childPortId, childPort)

      // Bind to parent object - CRITICAL FIX
      if (typeof anyValue === 'object' && anyValue !== null) {
        this.bindPortToNodeProperty(anyValue, childPort)
      }

      // If this child is a complex port, add it to the processing queue
      if (childConfig.type === 'object' || childConfig.type === 'array' || childConfig.type === 'any') {
        portsToProcess.push(childPort)
      }
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

    // Process item config with the processor to handle nested ports
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
    const itemPortId = generatePortIDArrayElement(arrayPort.id, index)
    const completeItemConfig = {
      ...itemConfig,
      id: itemPortId,
      parentId: arrayPort.id,
      key: index.toString(),
      nodeId: this.nodeId,
    }

    const itemPort = PortFactory.createFromConfig(completeItemConfig)
    itemPort.setValue(value)
    portMap.set(itemPortId, itemPort)

    // Bind item port to the array element
    const arrayValue = arrayPort.getValue()
    if (Array.isArray(arrayValue) && index < arrayValue.length) {
      this.bindPortToNodeProperty(arrayValue, itemPort)
    }

    // If this item is a complex port, add it to processing queue
    if (completeItemConfig.type === 'object' || completeItemConfig.type === 'array' || completeItemConfig.type === 'any') {
      portsToProcess.push(itemPort)
    }
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
   * Rebind all port bindings
   * Call this after modifying port structure
   */
  bindPortBindings(): void {
    // Find all root ports (those without a parentId)
    const rootPorts = Array.from(this.portManager.ports.values())
      .filter(port => !port || !('getConfig' in port) || !port.getConfig().parentId)

    // Bind each root port to the node
    for (const port of rootPorts) {
      this.bindPortToNodeProperty(this.nodeInstance, port)
    }
  }
}
