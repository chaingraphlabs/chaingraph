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
  IPort,
  IPortConfig,
  NodeEvent,
  NodeExecutionResult,
  PortDisconnectedEvent,
  PortUpdateEvent,
} from '@badaitech/chaingraph-types'

import {
  BaseNode,
  Boolean,
  Input,
  Node,
  NodeEventType,
  Number as NumberDecorator,
  Output,
  PortAny,
  String,
  StringEnum,
} from '@badaitech/chaingraph-types'
import * as yaml from 'js-yaml'
import { NODE_CATEGORIES } from '../../categories'

const SUPPORTED_TYPES = ['number', 'boolean', 'string', 'object', 'array']
const DEFAULT_MAX_DEPTH = 6
const INPUT_FORMATS = ['auto', 'json', 'yaml']
type InputFormat = typeof INPUT_FORMATS[number]

@Node({
  type: 'JsonYamlDeserializerNode',
  title: 'JSON/YAML Deserializer',
  description: 'Deserializes JSON or YAML string into an object based on the provided schema',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['json', 'yaml', 'deserialize', 'parse', 'convert', 'object'],
})
class JsonYamlDeserializerNode extends BaseNode {
  @Input()
  @PortAny({
    title: 'Output Schema',
    description: 'Schema for the deserialized object. Supports complex schemas (array, object) and primitive types (number, string, bool).',
  })
  outputSchema: any

  @Input()
  @String({
    title: 'JSON or YAML',
    description: 'JSON or YAML string to be deserialized',
    ui: {
      isTextArea: true,
    },
  })
  inputString: string = ''

  @Input()
  @StringEnum(INPUT_FORMATS, {
    title: 'Input Format',
    description: 'Specify the format of the input string.',
    defaultValue: 'auto',
    options: [
      { id: 'auto', type: 'string', title: 'Auto' },
      { id: 'json', type: 'string', title: 'JSON' },
      { id: 'yaml', type: 'string', title: 'YAML' },
    ],
  })
  inputFormat: InputFormat = 'auto'

  @Input()
  @Boolean({
    title: 'Ignore Missing Fields',
    description: 'If true, missing fields in JSON/YAML objects will be set to null instead of throwing an error',
    defaultValue: false,
  })
  ignoreMissingFields: boolean = false

  @Input()
  @NumberDecorator({
    title: 'Max Depth',
    description: `Maximum depth of filtering output by the schema. Effective for objects and arrays. Maximum of ${DEFAULT_MAX_DEPTH} will be used if 0 is provided.`,
    defaultValue: 0,
  })
  maxDepth: number = 0

  @Output()
  @PortAny({
    title: 'Deserialized Value',
    description: 'The parsed object according to the schema',
    ui: {
      hideEditor: true,
    },
  })
  deserializedObject: any = null

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      let parsedData: any

      if (this.inputString.trim() === '') {
        parsedData = null
      } else {
        try {
          parsedData = this.parseInputString(this.inputString)
        } catch (error) {
          throw new Error(`Failed to parse input string: ${error}`)
        }
      }

      const outputPort = this.findPortByKey('deserializedObject') as AnyPort

      if (!outputPort) {
        throw new Error(`Cannot locate deserializedObject port`)
      }

      const schema = outputPort.getRawConfig().underlyingType

      if (!schema) {
        throw new Error(`Output port has no schema assigned. Make sure that you've provided a valid schema of one of these types: ${SUPPORTED_TYPES.join(', ')}.`)
      }

      try {
        const processedValue = this.filterOutputBySchema(
          parsedData,
          schema,
          (!this.maxDepth || this.maxDepth === 0) ? DEFAULT_MAX_DEPTH : this.maxDepth,
        )
        outputPort.setValue(processedValue)
      } catch (error) {
        throw new Error(`Error applying value to provided schema: ${error}`)
      }
      return {}
    } catch (error) {
      throw new Error(`Failed to execute: ${error}`)
    }
  }

  /**
   * Parse input string as JSON or YAML based on the selected format
   */
  private parseInputString(input: string): any {
    if (this.inputFormat === 'auto' || 'json') {
      try {
        return JSON.parse(input)
      } catch (jsonError) {
        if (this.inputFormat === 'auto') {
          try {
            return yaml.load(input)
          } catch (yamlError) {
            throw new Error(`Format error: Input must be valid JSON or YAML`)
          }
        }
      }
    } else if (this.inputFormat === 'yaml') {
      return yaml.load(input)
    }

    throw new Error(`Unsupported input format: ${this.inputFormat}`)
  }

  /**
   * Process data strictly according to schema at a specific depth
   * This ensures we only include the parts of the object defined in the schema
   */
  private filterOutputBySchema(
    value: any,
    schema: IPortConfig,
    depthLeft: number,
  ): object | Array<any> | number | string | number | null {
    if (value === null || value === undefined) {
      return null
    }

    const schemaType = schema.type

    if (schemaType === 'any') {
      return value
    }

    if (!SUPPORTED_TYPES.includes(schemaType)) {
      throw new Error(`Schema property ${schema.name} has unsupported type: ${schemaType}. Supported types are: ${SUPPORTED_TYPES.join(', ')}.`)
    }

    // Handle primitive types
    if (['string', 'number', 'boolean'].includes(schemaType)) {
      const valueType = typeof value
      if (valueType === schemaType) {
        return value
      } else {
        throw new Error(`Types mismatch: expected ${schemaType} but got ${valueType}`)
      }
    }

    // Handle arrays
    if (schemaType === 'array') {
      if (!Array.isArray(value)) {
        throw new TypeError(`Types mismatch: Expected array but got ${typeof value}`)
      }

      if (!schema.itemConfig || depthLeft <= 0) {
        return value
      }

      const result: any[] = []
      const itemSchema = schema.itemConfig

      for (const item of value) {
        try {
          const processedItem = this.filterOutputBySchema(
            item,
            itemSchema,
            depthLeft - 1,
          )
          result.push(processedItem)
        } catch (error) {
          throw new Error(`Error adding array item to the output: ${error}`)
        }
      }
      return result
    }

    // Handle objects
    if (schemaType === 'object') {
      if (typeof value !== 'object' || Array.isArray(value)) {
        throw new TypeError(`Expected object but got ${Array.isArray(value) ? 'array' : typeof value}`)
      }

      if (depthLeft <= 0 || !schema.schema || !schema.schema.properties) {
        return value
      }

      const result: any = {}

      for (const [key, propSchema] of Object.entries(schema.schema.properties)) {
        const typedPropSchema = propSchema as IPortConfig

        if (key in value) {
          try {
            result[key] = this.filterOutputBySchema(
              value[key],
              typedPropSchema,
              depthLeft - 1,
            )
          } catch (error) {
            if (this.ignoreMissingFields) {
              result[key] = null
            } else {
              throw error
            }
          }
        } else if (this.ignoreMissingFields) {
          result[key] = null
        } else {
          throw new Error(`Required field '${key}' is missing in the input data`)
        }
      }
      return result
    }
    return null
  }

  /**
   * Handle node events to maintain port synchronization
   */
  async onEvent(event: NodeEvent): Promise<void> {
    await super.onEvent(event)

    if (event.type === NodeEventType.PortUpdate) {
      await this.handleUpdate(event as PortUpdateEvent)
    }

    // !!! To depecate after disconnections fix
    if (event.type === NodeEventType.PortDisconnected) {
      await this.handleDisconnection(event as PortDisconnectedEvent)
    }
  }

  /**
   * !!! To depecate after disconnections fix
   */
  private async handleDisconnection(event: PortDisconnectedEvent): Promise<void> {
    const inputPortConfig = event.sourcePort.getConfig()
    if (
      !inputPortConfig
      || inputPortConfig.key !== 'outputSchema'
      || inputPortConfig.direction !== 'input'
      || inputPortConfig.parentId
    ) {
      return
    }

    const inputAnyPort = event.sourcePort as AnyPort
    const outputPort = this.findPortByKey('deserializedObject')
    const outputAnyPort = outputPort as AnyPort

    if (!inputAnyPort || !outputPort || !outputAnyPort) {
      return
    }

    try {
      await inputAnyPort.setUnderlyingType(undefined)
      await this.updatePort(inputAnyPort as IPort)

      await outputAnyPort.setUnderlyingType(undefined)
      await this.updatePort(outputAnyPort as IPort)
    } catch (error) {
      throw new Error(`Error synchronizing schema: ${error}`)
    }
  }

  /**
   * Handle input port update events to sync schema to the output port
   */
  private async handleUpdate(event: PortUpdateEvent): Promise<void> {
    const inputPortConfig = event.port.getConfig()
    if (
      !inputPortConfig
      || inputPortConfig.key !== 'outputSchema'
      || inputPortConfig.direction !== 'input'
      || inputPortConfig.parentId
    ) {
      return
    }

    const inputPort = event.port as AnyPort
    const inputPortRawConfig = inputPort.getRawConfig()

    const outputPort = this.findPortByKey('deserializedObject')
    const outputAnyPort = outputPort as AnyPort

    if (!outputPort || !outputAnyPort) {
      return
    }

    if (!inputPortRawConfig.underlyingType || !SUPPORTED_TYPES.includes(inputPortRawConfig.underlyingType.type)) {
      return
    }

    try {
      outputAnyPort.setUnderlyingType(inputPortRawConfig.underlyingType)
      await this.updatePort(outputAnyPort as IPort)
    } catch (error) {
      throw new Error(`Error synchronizing schema: ${error}`)
    }
  }
}

export default JsonYamlDeserializerNode
