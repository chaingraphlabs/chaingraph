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
  INode,
  IObjectSchema,
  IPort,
  IPortConfig,
  NodeExecutionResult,

  ObjectPortValue,
} from '@badaitech/chaingraph-types'
import {
  checkSchemaCompatibility,
} from '@badaitech/chaingraph-types'

import { OnPortUpdate,
} from '@badaitech/chaingraph-types'

import {
  Passthrough,
} from '@badaitech/chaingraph-types'
import { BaseNode, findPort, Node, PortAny, PortArray } from '@badaitech/chaingraph-types'

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
    title: 'Item Schema',
    description: 'Schema used for array items. You can connect a port to this port and it will be used to generate the schema for the array items.',
  })
  @OnPortUpdate(async (node: INode, port: IPort) => {
    const arrayNode = node as ArrayNode
    const itemSchemaPort = port as AnyPort

    const underlyingType = itemSchemaPort.unwrapUnderlyingType()
    if (!underlyingType || underlyingType.type === 'any') {
      // reset the array element port configuration to default any configuration
      arrayNode.setArrayPortConfig('Array', {
        type: 'any',
        defaultValue: undefined,
        ui: {
          hideEditor: false,
        },
      })
      return
    }

    // Set the array port configuration based on the underlying type
    arrayNode.setArrayPortConfig('Array', arrayNode.createPortConfig(underlyingType))
  })
  itemSchema: any

  @Passthrough()
  @PortArray({
    title: 'Array',
    description: 'The output array',
    defaultValue: [],
    itemConfig: {
      type: 'any',
      ui: {
        hideEditor: false,
      },
    },
    isMutable: true,
    isSchemaMutable: true,
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
    if (!checkSchemaCompatibility(arrayPortConfig.itemConfig, itemConfig) && arrayPortValue) {
      console.log(`[ArrayNode] Removing all items from array port due to incompatible itemConfig change`)
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
