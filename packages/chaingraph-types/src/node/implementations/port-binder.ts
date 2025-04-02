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
 * Implementation of IPortBinder interface
 * Handles binding ports to object properties and creating port hierarchies
 */
export class PortBinder implements IPortBinder {
  // Reference to port manager for accessing ports
  private complexPortHandler?: IComplexPortHandler
  private nodeInstance: any
  private nodeId: string

  constructor(
    private portManager: IPortManager,
    nodeInstance: any,
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
    const key = config.key

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
          if (Array.isArray(newValue) && self.complexPortHandler) {
            self.complexPortHandler.recreateArrayItemPorts(port, newValue)
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

        // If this is a complex port (object or array), add it to the list to process
        const config = port.getConfig()
        if (config.type === 'object' || config.type === 'array') {
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
    portMap.set(itemPortId, itemPort)

    // Bind item port to the array element
    const arrayValue = arrayPort.getValue()
    if (Array.isArray(arrayValue) && index < arrayValue.length) {
      this.bindPortToNodeProperty(arrayValue, itemPort)
    }

    // If this item is a complex port, add it to processing queue
    if (completeItemConfig.type === 'object' || completeItemConfig.type === 'array') {
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
   * Rebuild all port bindings
   * Call this after modifying port structure
   */
  rebuildPortBindings(): void {
    // First, find all root ports
    // const rootPorts = Array.from(this.portManager.ports.values())
    //   .filter(port => !port.getConfig().parentId)
    //
    // // Bind each root port to the node
    // for (const rootPort of rootPorts) {
    //   this.bindPortToNodeProperty(this.nodeInstance, rootPort)
    // }

    // Then rebind all complex port children
    this.rebindAfterDeserialization()
  }

  /**
   * Rebuild all property bindings after deserialization
   */
  rebindAfterDeserialization(): void {
    // Find all root ports (those without a parentId)
    const rootPorts = Array.from(this.portManager.ports.values())
      .filter(port => !port.getConfig().parentId)

    // Bind each root port to the node
    for (const port of rootPorts) {
      this.bindPortToNodeProperty(this.nodeInstance, port)
    }

    // Bind object and array properties
    for (const port of this.portManager.ports.values()) {
      const config = port.getConfig()
      const parentId = config.parentId

      if (!parentId)
        continue

      // Find parent port
      const parentPort = this.portManager.getPort(parentId)
      if (!parentPort)
        continue

      const parentValue = parentPort.getValue()
      if (!parentValue)
        continue

      if (parentPort.getConfig().type === 'array') {
        // bind "port" value to "parentPort" value by index
        const indexString = port.getConfig().key
        if (indexString?.length) {
          const index = Number.parseInt(indexString)
          Object.defineProperty(parentValue, index, {
            get() {
              return port.getValue()
            },
            set(newValue) {
              // Set the port value
              port.setValue(newValue)
            },
            configurable: true,
            enumerable: true,
          })
        }
      }

      // TODO: Check if follow logic is actually works
      // For object child ports
      if (parentId.includes('.') || !parentId.includes('[')) {
        // For object properties, bind to the parent object's property
        if (typeof parentValue === 'object' && parentValue !== null && !Array.isArray(parentValue)) {
          const key = config.key
          if (key) {
            this.bindPortToNodeProperty(parentValue, port)
          }
        }
      } else if (parentId.includes('[')) {
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
}
