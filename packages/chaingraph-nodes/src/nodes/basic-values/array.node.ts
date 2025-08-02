/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  AnyPort,
  ArrayPort,
  ExecutionContext,
  IObjectSchema,
  IPortConfig,
  NodeEvent,
  NodeExecutionResult,
  ObjectPortValue,
  PortDisconnectedEvent,
  PortUpdateEvent,
} from '@badaitech/chaingraph-types'

import {
  Passthrough,
} from '@badaitech/chaingraph-types'
import { BaseNode, findPort, Node, NodeEventType, PortAny, PortArray } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'ArrayNode',
  title: 'Array Node',
  description: 'A node that outputs an array',
  category: NODE_CATEGORIES.BASIC_VALUES,
})
class ArrayNode extends BaseNode {
  @Passthrough()
  @PortAny({
    title: 'Array Items Schema',
    description: 'Schema used for array items. You can connect a port to this port and it will be used to generate the schema for the array items.',
  })
  itemSchema: any

  @Passthrough()
  @PortArray({
    title: 'Array',
    description: 'The output array.',
    defaultValue: [],
    itemConfig: {
      type: 'any',
      ui: {
        hideEditor: false,
      },
    },
    isMutable: true,
    ui: {
      hideEditor: false,
      addItemFormHidden: false,
      allowedTypes: ['string', 'number', 'boolean'],
    },
  })
  array: any[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // This node simply outputs the default number value.
    return {}
  }

  /**
   * Handle node events to maintain port synchronization
   */
  async onEvent(event: NodeEvent): Promise<void> {
    await super.onEvent(event)

    switch (event.type) {
      case NodeEventType.PortUpdate:
        await this.handlePortUpdate(event as PortUpdateEvent)
        break

      case NodeEventType.PortDisconnected:
        await this.handlePortDisconnected(event as PortDisconnectedEvent)
        break
    }
  }

  private async handlePortUpdate(event: PortUpdateEvent): Promise<void> {
    // check if the source port is the itemSchema port
    if (
      event.port.getConfig().key !== 'itemSchema'
      || event.port.getConfig().parentId
      || event.port.getConfig().direction !== 'passthrough') {
      return
    }

    // Get the underlying type from the itemSchema port
    const itemSchemaPort = event.port as AnyPort
    const underlyingType = itemSchemaPort.unwrapUnderlyingType()
    if (!underlyingType) {
      // TODO: Find away to disconnect port
      return
    }

    // Generate title for the array port based on targetPorts title otherwise the underlying type
    // const title = `Array of ${event.port.getConfig().title || underlyingType.type}`
    const title = `Array of ${underlyingType.title || underlyingType.type || event.port.getConfig().title || 'Unknown Type'}`

    // If finally the underlying type is any or stream we dont use the config for the array port
    if (['any', 'stream'].includes(underlyingType.type)) {
      // TODO: Find away to disconnect port
      return
    }

    // Set the array port configuration based on the underlying type
    this.setArrayPortConfig(title, this.createPortConfig(underlyingType))
  }

  /**
   * Handle port connection events - specifically for "any" ports
   */
  private async handlePortDisconnected(event: PortDisconnectedEvent): Promise<void> {
    // Only process connections from our own inputs and for "any" ports
    const sourcePort = event.sourcePort
    const sourcePortConfig = sourcePort.getConfig()

    // Only process the itemSchema port and ensure it is an input port without a parent
    if (
      sourcePortConfig.key !== 'itemSchema'
      || sourcePortConfig.direction !== 'passthrough'
      || sourcePortConfig.parentId
    ) {
      return
    }

    // Set the array port configuration to default any configuration
    const anySchema: IPortConfig = {
      type: 'any',
      ui: {
        hideEditor: false,
      },
    }
    this.setArrayPortConfig('Array', anySchema)
  }

  /**
   * set item configuration for the array port
   */
  private setArrayPortConfig(title: string, itemConfig: IPortConfig): void {
    // get the array port and update its schema
    const arrayPort = findPort(this, (port) => {
      return port.getConfig().key === 'array'
        && !port.getConfig().parentId
        && port.getConfig().direction === 'passthrough'
    })

    if (!arrayPort) {
      return
    }

    const arrayPortConfig = arrayPort.getConfig()
    if (arrayPortConfig.type !== 'array') {
      return
    }

    const arrayPortValue = (arrayPort as ArrayPort).getValue()

    // if type changed remove all array elements in descending order
    if (arrayPortConfig.itemConfig.type !== itemConfig.type && arrayPortValue) {
      this.removeArrayItems(arrayPort, arrayPortValue.map((_, index) => index))
    }

    // Change item configuration for the array port
    arrayPort.setConfig({
      ...arrayPortConfig,
      title,
      itemConfig: {
        ...itemConfig,
        direction: arrayPortConfig.direction,
      },
      ui: {
        ...arrayPortConfig.ui,
      },
    })

    this.updateArrayItemConfig(arrayPort)
  }

  /**
   * Create port configuration based on the provided port configuration and merge it with the default port configuration
   */
  private createPortConfig(portConfig: IPortConfig, isChildConfig: boolean = false): IPortConfig {
    let specificSchema: IPortConfig = {
      type: 'any',
      defaultValue: undefined,
      direction: 'passthrough',
    }

    // Create the appropriate schema object based on port type
    switch (portConfig.type) {
      case 'string': {
        specificSchema = {
          ...portConfig,
          defaultValue: portConfig.defaultValue || '',
        }
        break
      }
      case 'number': {
        specificSchema = {
          ...portConfig,
          defaultValue: portConfig.defaultValue ?? 0,
        }
        break
      }
      case 'boolean': {
        specificSchema = {
          ...portConfig,
          defaultValue: portConfig.defaultValue ?? false,
        }
        break
      }
      case 'array': {
        specificSchema = {
          ...portConfig,
          itemConfig: this.createPortConfig(portConfig.itemConfig, true),
          defaultValue: portConfig.defaultValue || [],
          isMutable: true,
        }
        break
      }
      case 'object': {
        const objectSchema = this.createObjectSchema(portConfig.schema)
        const defaultValue = this.createObjectDefaultValues(objectSchema)
        specificSchema = {
          ...portConfig,
          schema: objectSchema,
          defaultValue: {
            ...defaultValue,
            ...portConfig.defaultValue,
          },
          isSchemaMutable: false,
          ui: {
            keyDeletable: false,
          },
        }
        break
      }
      case 'enum': {
        specificSchema = {
          ...portConfig,
          defaultValue: portConfig.defaultValue || '',
        }
        break
      }
      case 'stream': {
        specificSchema = {
          ...portConfig,
          itemConfig: this.createPortConfig(portConfig.itemConfig, true),
        }
        break
      }
      case 'any': {
        specificSchema = {
          ...portConfig,
          defaultValue: portConfig.defaultValue,
        }
        break
      }
    }

    specificSchema = {
      ...specificSchema,
      id: undefined,
      title: isChildConfig ? specificSchema.title : undefined,
      description: isChildConfig ? specificSchema.description : undefined,
      ui: {
        ...specificSchema.ui,
        hideEditor: false,
      },
    }

    return specificSchema
  }

  /**
   * Create object schema for object ports
   */
  private createObjectSchema(schema?: IObjectSchema): IObjectSchema {
    if (!schema || !schema.properties) {
      return { properties: {} }
    }

    const properties: Record<string, IPortConfig> = {}
    for (const key in schema.properties) {
      properties[key] = this.createPortConfig(schema.properties[key], true)
    }

    return {
      properties,
    }
  }

  /**
   * Create default values for object ports based on the schema
   */
  private createObjectDefaultValues(schema?: IObjectSchema): ObjectPortValue<any> {
    if (!schema || !schema.properties) {
      return {}
    }

    const defaultValue: ObjectPortValue<any> = {}
    for (const key in schema.properties) {
      defaultValue[key] = schema.properties[key].defaultValue
    }

    return defaultValue
  }
}

export default ArrayNode
