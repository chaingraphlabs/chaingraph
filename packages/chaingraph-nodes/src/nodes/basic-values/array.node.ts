/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  AnyPort,
  ExecutionContext,
  IPortConfig,
  NodeEvent,
  NodeExecutionResult,
  PortConnectedEvent,
  PortDisconnectedEvent,
  PortType,
} from '@badaitech/chaingraph-types'
import { BaseNode, findPort, Input, Node, NodeEventType, Output, PortAny, PortArray } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'ArrayNode',
  title: 'Array Node',
  description: 'A node that outputs an array',
  category: NODE_CATEGORIES.BASIC_VALUES,
})
class ArrayNode extends BaseNode {
  @Input()
  @PortAny({
    title: 'Array Items Schema',
    description: 'Schema used for array items. You can connect a port to this port and it will be used to generate the schema for the array items.',
  })
  outputSchema: any

  @Output()
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
      case NodeEventType.PortConnected:
        await this.handlePortConnected(event as PortConnectedEvent)
        break
      case NodeEventType.PortDisconnected:
        await this.handlePortDisconnected(event as PortDisconnectedEvent)
        break
    }
  }

  /**
   * Handle port connection events - specifically for "any" ports
   */
  private async handlePortConnected(event: PortConnectedEvent): Promise<void> {
    // Only process connections from our own inputs and for "any" ports
    if (event.sourceNode.id !== this.id) {
      return
    }

    const sourcePort = event.sourcePort
    const sourcePortConfig = sourcePort.getConfig()

    // Only process the outputSchema port and ensure it is an input port without a parent
    if (
      sourcePortConfig.key !== 'outputSchema'
      || sourcePortConfig.direction !== 'input'
      || sourcePortConfig.parentId
    ) {
      return
    }

    // Ensure the source port is of type "any"
    if (!sourcePortConfig || sourcePortConfig.type !== 'any') {
      return
    }

    // Get the underlying type from the outputSchema port
    const outputSchemaPort = sourcePort as AnyPort
    let underlyingType = outputSchemaPort.getRawConfig().underlyingType
    if (!underlyingType) {
      // TODO: Find away to disconnect port
      return
    }

    // Iterate through the underlying type to find the actual type
    if (underlyingType.type === 'any') {
      while (underlyingType.type === 'any') {
        if (underlyingType.type === 'any' && underlyingType.underlyingType) {
          underlyingType = underlyingType.underlyingType
        }
      }
    }

    // Generate title for the array port based on targetPorts title otherwise the underlying type
    const title = `Array of ${event.targetPort.getConfig().title || underlyingType.type}`

    // If the underlying type is an array, we use the the itemConfig instead of arry config
    if (underlyingType.type === 'array') {
      underlyingType = underlyingType.itemConfig
    }

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
    if (event.sourceNode.id !== this.id) {
      return
    }

    const sourcePort = event.sourcePort
    const sourcePortConfig = sourcePort.getConfig()

    // Only process the outputSchema port and ensure it is an input port without a parent
    if (
      sourcePortConfig.key !== 'outputSchema'
      || sourcePortConfig.direction !== 'input'
      || sourcePortConfig.parentId
    ) {
      return
    }

    // Set the array port configuration to default any configuration
    this.setArrayPortConfig('Array', this.getDefaultPortConfig('any'))
  }

  /**
   * set item configuration for the array port
   */
  private setArrayPortConfig(title: string, itemConfig: IPortConfig): void {
    // get the array port and update its schema
    const arrayPort = findPort(this, (port) => {
      return port.getConfig().key === 'array'
        && !port.getConfig().parentId
        && port.getConfig().direction === 'output'
    })

    if (!arrayPort) {
      return
    }

    const arrayPortConfig = arrayPort.getConfig()
    if (arrayPortConfig.type !== 'array') {
      return
    }

    // if type changed remove all array elements in descending order
    if (arrayPortConfig.itemConfig.type !== itemConfig.type) {
      for (let index = arrayPort.getValue().length - 1; index >= 0; index--) {
        this.removeArrayItem(arrayPort, index)
      }
    }

    // Change item configuration for the array port
    arrayPort.setConfig({
      ...arrayPortConfig,
      title,
      itemConfig,
      ui: {
        ...arrayPortConfig.ui,
      },
    })
    this.updateArrayItemConfig(arrayPort)
  }

  /**
   * Get the default port configuration based on port type
   */
  private getDefaultPortConfig(portType: PortType): any {
    switch (portType) {
      case 'string':
        return {
          type: 'string',
          defaultValue: '',
          ui: {
            hideEditor: false,
          },
        }
      case 'number':
        return {
          type: 'number',
          defaultValue: 0,
          ui: {
            hideEditor: false,
          },
        }
      case 'enum':
        return {
          type: 'enum',
          options: [],
          defaultValue: '',
          ui: {
            hideEditor: false,
          },
        }
      case 'boolean':
        return {
          type: 'boolean',
          defaultValue: false,
          ui: {
            hideEditor: false,
          },
        }
      case 'stream':
        return {
          type: 'stream',
          itemConfig: {},
          ui: {
            hideEditor: false,
          },
        }
      case 'object':
        return {
          type: 'object',
          schema: {
            properties: {},
            type: 'object' as const,
            description: 'Object Schema',
          },
          defaultValue: {},
          isSchemaMutable: false,
          ui: {
            hideEditor: false,
            keyDeletable: false,
          },
        }
      case 'array':
        return {
          type: 'array',
          itemConfig: {
            type: 'string',
          },
          defaultValue: [],
          isMutable: true,
          ui: {
            hideEditor: false,
          },
        }
      case 'any':
        return {
          type: 'any',
          defaultValue: '',
          ui: {
            hideEditor: false,
          },
        }
      // case 'secret':
      //   return {
      //     type: 'secret',
      //     secretType: 'string',
      //     defaultValue: undefined,
      //     ui: {
      //       hideEditor: true,
      //     },
      // }
      default:
        return {
          type: 'string',
          defaultValue: '',
          ui: {
            hideEditor: false,
          },
        }
    }
  }

  /**
   * Create port configuration based on the provided port configuration and merge it with the default port configuration
   */
  private createPortConfig(portConfig: IPortConfig, isChildConfig: boolean = false): IPortConfig {
    const basicConfig = this.getDefaultPortConfig(portConfig.type)

    // Fill in the base properties
    let specificSchema: IPortConfig
    // Create the appropriate schema object based on port type
    switch (portConfig.type) {
      case 'string': {
        specificSchema = {
          ...basicConfig,
          defaultValue: portConfig.defaultValue || '',
          minLength: portConfig.minLength,
          maxLength: portConfig.maxLength,
          pattern: portConfig.pattern,
          ui: {
            ...basicConfig.ui,
            isTextArea: portConfig.ui?.isTextArea,
            isPassword: portConfig.ui?.isPassword,
            textareaDimensions: portConfig.ui?.textareaDimensions,
          },
        }
        break
      }
      case 'number': {
        specificSchema = {
          ...basicConfig,
          defaultValue: portConfig.defaultValue ?? 0,
          min: portConfig.min,
          max: portConfig.max,
          step: portConfig.step,
          integer: portConfig.integer,
          ui: {
            ...basicConfig.ui,
            isSlider: portConfig.ui?.isSlider,
            leftSliderLabel: portConfig.ui?.leftSliderLabel,
            rightSliderLabel: portConfig.ui?.rightSliderLabel,
          },
        }
        break
      }
      case 'boolean': {
        specificSchema = {
          ...basicConfig,
          defaultValue: portConfig.defaultValue ?? false,
        }
        break
      }
      case 'array': {
        specificSchema = {
          ...basicConfig,
          itemConfig: this.createPortConfig(portConfig.itemConfig, true),
          defaultValue: portConfig.defaultValue || [],
          minLength: portConfig.minLength,
          maxLength: portConfig.maxLength,
        }
        break
      }
      case 'object': {
        specificSchema = {
          ...basicConfig,
          schema: this.createObjectSchema(portConfig.schema),
          defaultValue: portConfig.defaultValue || {},
        }
        break
      }
      case 'enum': {
        specificSchema = {
          ...basicConfig,
          options: portConfig.options?.map(opt => ({
            id: opt.id || '',
            title: opt.title || opt.id || '',
            type: opt.type || 'string',
            defaultValue: opt.defaultValue,
          })) || [],
          defaultValue: portConfig.defaultValue || '',
        }
        break
      }
      case 'stream': {
        specificSchema = {
          ...basicConfig,
          itemConfig: this.createPortConfig(portConfig.itemConfig, true),
        }
        break
      }
      case 'any': {
        specificSchema = {
          ...basicConfig,
          defaultValue: portConfig.defaultValue,
        }
        break
      }
    }

    if (isChildConfig) {
      specificSchema = {
        ...specificSchema,
        title: portConfig.title,
        description: portConfig.description,
        order: portConfig.order,
      }
    }

    return specificSchema
  }

  /**
   * Create object schema for object ports
   */
  private createObjectSchema(schema?: any): Record<string, any> {
    if (!schema || !schema.properties) {
      return { properties: {} }
    }

    const properties: Record<string, any> = {}

    for (const key in schema.properties) {
      const propConfig = schema.properties[key]
      properties[key] = this.createPortConfig(propConfig, true)
    }

    return {
      id: schema.id || undefined,
      type: schema.type || 'object',
      description: schema.description || undefined,
      category: schema.category || undefined,
      properties,
    }
  }
}

export default ArrayNode
