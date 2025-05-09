/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  IPortConfig,
  NodeEvent,
  NodeExecutionResult,
  ObjectPort,
  PortConnectedEvent,
  PortDisconnectedEvent,
} from '@badaitech/chaingraph-types'
import {
  findPort,
} from '@badaitech/chaingraph-types'

import {
  BaseNode,
  Input,
  Node,
  NodeEventType,
  Output,
  PortAny,
  PortObject,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import {
  AnyPortSchema,
  ArrayPortSchema,
  BasePortSchema,
  BooleanPortSchema,
  EnumPortSchema,
  NumberPortSchema,
  ObjectPortSchema,
  PortSchemaUnion,
  StreamPortSchema,
  StringPortSchema,
} from './get-port-schema.type'

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
    title: 'Input Port',
    description: 'Connect this to any port to extract its schema',
  })
  input: any

  @Output()
  @PortObject({
    title: 'Port Schema',
    description: 'Schema details of the connected port',
    schema: PortSchemaUnion,
  })
  portSchema: PortSchemaUnion = new PortSchemaUnion()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // The schema is populated in the event handlers, no additional logic needed here
    return {}
  }

  async onEvent(event: NodeEvent): Promise<void> {
    await super.onEvent(event)

    if (event.type === NodeEventType.PortConnected) {
      await this.handlePortConnectedEvent(event as PortConnectedEvent)
    } else if (event.type === NodeEventType.PortDisconnected) {
      await this.handlePortDisconnectedEvent(event as PortDisconnectedEvent)
    }
  }

  /**
   * Maps a port configuration to the appropriate schema object
   */
  private buildSchemaFromPortConfig(portConfig: IPortConfig): PortSchemaUnion {
    const schema = new PortSchemaUnion()
    schema.type = portConfig.type || 'unknown'

    // Fill in the base properties
    let specificSchema: BasePortSchema

    // Create the appropriate schema object based on port type
    switch (portConfig.type) {
      case 'string': {
        const stringSchema = new StringPortSchema()
        stringSchema.defaultValue = portConfig.defaultValue || ''
        stringSchema.minLength = portConfig.minLength
        stringSchema.maxLength = portConfig.maxLength
        stringSchema.pattern = portConfig.pattern
        stringSchema.ui = portConfig.ui || {}
        specificSchema = stringSchema
        break
      }
      case 'number': {
        const numberSchema = new NumberPortSchema()
        numberSchema.defaultValue = portConfig.defaultValue ?? 0
        numberSchema.min = portConfig.min
        numberSchema.max = portConfig.max
        numberSchema.step = portConfig.step
        numberSchema.integer = portConfig.integer
        numberSchema.ui = portConfig.ui || {}
        specificSchema = numberSchema
        break
      }
      case 'boolean': {
        const boolSchema = new BooleanPortSchema()
        boolSchema.defaultValue = portConfig.defaultValue ?? false
        boolSchema.ui = portConfig.ui || {}
        specificSchema = boolSchema
        break
      }
      case 'array': {
        const arraySchema = new ArrayPortSchema()
        arraySchema.itemConfig = this.extractItemConfig(portConfig.itemConfig)
        arraySchema.defaultValue = portConfig.defaultValue || []
        arraySchema.minLength = portConfig.minLength
        arraySchema.maxLength = portConfig.maxLength
        arraySchema.isMutable = portConfig.isMutable
        arraySchema.ui = portConfig.ui || {}
        specificSchema = arraySchema
        break
      }
      case 'object': {
        const objectSchema = new ObjectPortSchema()
        objectSchema.schema = this.extractObjectSchema(portConfig.schema)
        objectSchema.defaultValue = portConfig.defaultValue || {}
        objectSchema.isSchemaMutable = portConfig.isSchemaMutable
        objectSchema.ui = portConfig.ui || {}
        specificSchema = objectSchema
        break
      }
      case 'enum': {
        const enumSchema = new EnumPortSchema()
        enumSchema.options = portConfig.options?.map(opt => ({
          id: opt.id || '',
          title: opt.title || opt.id || '',
          type: opt.type || 'string',
          defaultValue: opt.defaultValue,
        })) || []
        enumSchema.defaultValue = portConfig.defaultValue || ''
        enumSchema.ui = portConfig.ui || {}
        specificSchema = enumSchema
        break
      }
      case 'stream': {
        const streamSchema = new StreamPortSchema()
        streamSchema.itemConfig = this.extractItemConfig(portConfig.itemConfig)
        streamSchema.ui = portConfig.ui || {}
        specificSchema = streamSchema
        break
      }
      case 'any': {
        const anySchema = new AnyPortSchema()
        anySchema.underlyingType = portConfig.underlyingType
          ? this.extractItemConfig(portConfig.underlyingType)
          : {}
        anySchema.defaultValue = portConfig.defaultValue
        anySchema.ui = portConfig.ui || {}
        specificSchema = anySchema
        break
      }
      default: {
        specificSchema = new BasePortSchema()
        break
      }
    }

    // Set base properties
    specificSchema.id = portConfig.id || ''
    specificSchema.key = portConfig.key || ''
    specificSchema.title = portConfig.title || ''
    specificSchema.description = portConfig.description || ''
    specificSchema.direction = portConfig.direction || ''
    specificSchema.required = portConfig.required || false
    specificSchema.type = portConfig.type || 'any'

    // Assign the specific schema to the union schema
    schema.config = this.serializeSchema(specificSchema)

    const schemaConfigPort = findPort(this, (port) => {
      return port.key === 'portSchema' && !port.getConfig().parentId
    }) as ObjectPort

    // console.log(`[GetPortSchemaNode] Schema for port ${portConfig.key}:`, schemaConfigPort)

    // schemaConfigPort.addField(
    //   'field_name',
    //   fieldConfig,
    // )

    return schema
  }

  /**
   * Extract item configuration for array and stream ports
   */
  private extractItemConfig(itemConfig?: IPortConfig): Record<string, any> {
    if (!itemConfig) {
      return {}
    }

    return {
      type: itemConfig.type || 'unknown',
      title: itemConfig.title,
      description: itemConfig.description,
      defaultValue: itemConfig.defaultValue,
      // Include other type-specific properties based on item type
      ...(itemConfig.type === 'string'
        ? {
            minLength: itemConfig.minLength,
            maxLength: itemConfig.maxLength,
            pattern: itemConfig.pattern,
          }
        : {}),
      ...(itemConfig.type === 'number'
        ? {
            min: itemConfig.min,
            max: itemConfig.max,
            step: itemConfig.step,
            integer: itemConfig.integer,
          }
        : {}),
      ...(itemConfig.type === 'array'
        ? {
            itemConfig: this.extractItemConfig(itemConfig.itemConfig),
            minLength: itemConfig.minLength,
            maxLength: itemConfig.maxLength,
          }
        : {}),
      ...(itemConfig.type === 'object'
        ? {
            schema: this.extractObjectSchema(itemConfig.schema),
            isSchemaMutable: itemConfig.isSchemaMutable,
          }
        : {}),
      ...(itemConfig.type === 'enum'
        ? {
            options: itemConfig.options,
          }
        : {}),
      ui: itemConfig.ui || {},
    }
  }

  /**
   * Extract object schema for object ports
   */
  private extractObjectSchema(schema?: any): Record<string, any> {
    if (!schema || !schema.properties) {
      return { properties: {} }
    }

    const properties: Record<string, any> = {}

    for (const key in schema.properties) {
      const propConfig = schema.properties[key]
      properties[key] = this.extractItemConfig(propConfig)
    }

    return {
      id: schema.id || undefined,
      type: schema.type || 'object',
      description: schema.description || undefined,
      category: schema.category || undefined,
      properties,
    }
  }

  /**
   * Serialize a schema object to a plain object for output
   */
  private serializeSchema(schema: any): Record<string, any> {
    // Deep clone to avoid modifying the original
    return JSON.parse(JSON.stringify(schema))
  }

  private async handlePortConnectedEvent(event: PortConnectedEvent): Promise<void> {
    // Check if the connection is with our input port
    if (event.sourceNode.id === this.id && event.sourcePort.key === 'input') {
      const targetPort = event.targetPort
      const targetConfig = targetPort.getConfig()

      // Build the schema based on the port type
      this.portSchema = this.buildSchemaFromPortConfig(targetConfig)

      console.log(`[GetPortSchemaNode] Connected to port of type ${targetConfig.type}`)
      console.log(`[GetPortSchemaNode] Schema extracted:`, this.portSchema)
    }
  }

  private async handlePortDisconnectedEvent(event: PortDisconnectedEvent): Promise<void> {
    // Check if the disconnection is from our input port
    if (event.sourceNode.id === this.id && event.sourcePort.key === 'input') {
      // Reset the schema when disconnected
      this.portSchema = new PortSchemaUnion()
      console.log(`[GetPortSchemaNode] Disconnected, schema reset`)
    }
  }
}

export default GetPortSchemaNode
