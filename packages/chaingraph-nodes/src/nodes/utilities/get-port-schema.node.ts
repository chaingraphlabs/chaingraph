/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  IPort,
  IPortConfig,
  NodeEvent,
  NodeExecutionResult,
  PortConnectedEvent,
  PortDisconnectedEvent,
} from '@badaitech/chaingraph-types'

import {
  BaseNode,
  findPortByKey,
  Input,
  Node,
  NodeEventType,
  Output,
  PortAny,
  PortObject,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'GetPortSchemaNode',
  title: 'Get Port Schema',
  description: 'Extracts and outputs the schema of a connected port',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['schema', 'metadata', 'debugging'],
})
class GetPortSchemaNode extends BaseNode {
  @Input()
  @PortAny({
    title: 'Input',
    description: 'Connect this to any port to extract its schema',
  })
  input: any

  @Output()
  @PortObject({
    title: 'Port Schema',
    description: 'The schema of the connected port',
    isSchemaMutable: false,
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          title: 'Port Type',
        },
        title: {
          type: 'string',
          title: 'Title',
        },
        description: {
          type: 'string',
          title: 'Description',
        },
        defaultValue: {
          type: 'any',
          title: 'Default Value',
        },
      },
      description: 'The schema of the connected port',
    },
    ui: {
      hideEditor: true,
    },
  })
  portSchema: Record<string, any> = {}

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Empty execute method as requested

    // context.

    const inputPort = findPortByKey(this, 'input') as IPort
    console.log(`[GetPortSchemaNode] Input port:`, inputPort.getConfig())

    return {}
  }

  async onEvent(event: NodeEvent): Promise<void> {
    await super.onEvent(event)

    if (event.type === NodeEventType.PortConnected) {
      console.log(`[GetPortSchemaNode] Port connected event:`, event.nodeId)
      await this.handlePortConnectedEvent(event as PortConnectedEvent)
    } else if (event.type === NodeEventType.PortDisconnected) {
      console.log(`[GetPortSchemaNode] Port disconnected event:`, event.nodeId)
      await this.handlePortDisconnectedEvent(event as PortDisconnectedEvent)
    }
  }

  /**
   * Recursively process port schema and extract all nested properties
   */
  private processSchemaRecursively(portConfig: IPortConfig): Record<string, any> {
    if (!portConfig) {
      return { type: 'unknown' }
    }

    // Create base schema with common properties
    const schema: Record<string, any> = {
      type: portConfig.type,
      title: portConfig.title,
      description: portConfig.description,
      defaultValue: portConfig.defaultValue,
      ui: portConfig.ui,
      // validation: portConfig.validation,
    }

    // Process type-specific schema details
    switch (portConfig.type) {
      case 'object':
        // For object types, process each property recursively
        schema.properties = {}
        if (portConfig.schema && portConfig.schema.properties) {
          const properties = portConfig.schema.properties as Record<string, IPortConfig>
          for (const key in properties) {
            schema.properties[key] = this.processSchemaRecursively(properties[key])
          }
        }
        break

      case 'array':
        // For array types, process the item configuration recursively
        if (portConfig.itemConfig) {
          schema.itemConfig = this.processSchemaRecursively(portConfig.itemConfig)
        }
        break

      case 'enum':
        // For enum types, include the options
        schema.options = portConfig.options
        break

      case 'stream':
        // For stream types, process the item configuration like arrays
        if (portConfig.itemConfig) {
          schema.itemConfig = this.processSchemaRecursively(portConfig.itemConfig)
        }
        break
    }

    return schema
  }

  /**
   * Recursively add port properties to an output port
   */
  private addNestedPropertiesToPort(
    outputPort: IPort,
    sourceConfig: IPortConfig,
    parentPath: string = '',
  ): void {
    if (!sourceConfig) {
      return
    }

    // Handle object type with nested properties
    if (sourceConfig.type === 'object' && sourceConfig.schema && sourceConfig.schema.properties) {
      const properties = sourceConfig.schema.properties as Record<string, IPortConfig>

      for (const key in properties) {
        const propConfig = properties[key]
        const propPath = parentPath ? `${parentPath}.${key}` : key

        // Check if the property already exists in the output port
        const existingProp = findPortByKey(this, propPath)
        if (existingProp) {
          console.log(`[GetPortSchemaNode] Property already exists:`, propPath)
          continue
        }

        // Add this property to the output port
        this.addObjectProperty(outputPort, propPath, propConfig)

        // Recursively process any nested properties
        this.addNestedPropertiesToPort(outputPort, propConfig, propPath)
      }
    } else if (sourceConfig.type === 'array' && sourceConfig.itemConfig) {
    // Handle array type with item configuration
      const itemPath = parentPath ? `${parentPath}.items` : 'items'

      // Add the array item configuration
      this.addObjectProperty(outputPort, itemPath, sourceConfig.itemConfig)

      // Recursively process the item configuration
      this.addNestedPropertiesToPort(outputPort, sourceConfig.itemConfig, itemPath)
    }
  }

  private async handlePortConnectedEvent(event: PortConnectedEvent): Promise<void> {
    // Check if the connection is with our input port
    if (event.sourceNode.id === this.id && event.sourcePort.key === 'input') {
      const connectedToPort = event.targetPort
      const sourceConfig = connectedToPort.getConfig()

      this.portSchema = JSON.parse(JSON.stringify(sourceConfig))

      // Method 1: Build a complete schema object
      // this.portSchema = this.processSchemaRecursively(sourceConfig)
      //
      // // Method 2: Use recursive property addition
      // const outputPort = findPortByKey(this, 'portSchema') as IPort
      // if (outputPort) {
      //   // Clear existing properties first
      //   // (This depends on implementation, may need to be modified based on the actual BaseNode implementation)
      //
      //   // Add all nested properties recursively
      //   this.addNestedPropertiesToPort(outputPort, sourceConfig)
      //
      //   // Update the port
      //   this.updatePort(outputPort)
      // }
    }
  }

  private async handlePortDisconnectedEvent(event: PortDisconnectedEvent): Promise<void> {
    // Check if the disconnection is from our input port
    if (event.targetNode.id === this.id && event.targetPort.key === 'input') {
      // Clear the schema information
      this.portSchema = {}

      // const outputPort = findPortByKey(this, 'portSchema')
      // if (outputPort) {
      //   this.updatePort(outputPort)
      // }
    }
  }
}

export default GetPortSchemaNode
