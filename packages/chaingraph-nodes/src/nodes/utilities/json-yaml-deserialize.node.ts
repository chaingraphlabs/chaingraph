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
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import {
  Passthrough,
} from '@badaitech/chaingraph-types'
import {
  deepCopy,
} from '@badaitech/chaingraph-types'
import {
  OnPortUpdate,
} from '@badaitech/chaingraph-types'

import {
  BaseNode,
  Node,
  PortNumber as NumberDecorator,
  Output,
  PortAny,
  PortBoolean,
  PortString,
  StringEnum,
} from '@badaitech/chaingraph-types'
import * as YAML from 'yaml'
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
  @Passthrough()
  @PortAny({
    title: 'Output Schema',
    description: 'Schema for the deserialized object. Supports complex schemas (array, object) and primitive types (number, string, bool).',
  })
  @OnPortUpdate((node, port) => {
    const outputSchemaPort = port as AnyPort
    const deserializedObjectPort = node.findPort(p => p.key === 'deserializedObject') as AnyPort
    if (!outputSchemaPort || !deserializedObjectPort) {
      return
    }

    const underlyingType = outputSchemaPort.unwrapUnderlyingType()

    if (!underlyingType || underlyingType.type === 'any') {
      // if underlying type is not set or is 'any', we need to reset the deserializedObject port
      deserializedObjectPort.setUnderlyingType(undefined)
      deserializedObjectPort.setValue(null)
      node.refreshAnyPortUnderlyingPorts(deserializedObjectPort as IPort, true)
    } else {
      // if underlying type is set, we need to update the deserializedObject port
      deserializedObjectPort.setUnderlyingType(deepCopy({
        ...underlyingType,
        ui: {
          keyDeletable: false,
          hideEditor: true,
          collapsed: true,
          hidePropertyEditor: true,
        },
        direction: deserializedObjectPort.getConfig().direction,
      }))
      node.refreshAnyPortUnderlyingPorts(deserializedObjectPort as IPort, true)
    }
  })
  outputSchema: any

  @Passthrough()
  @PortString({
    title: 'JSON or YAML',
    description: 'JSON or YAML string to be deserialized',
    ui: {
      isTextArea: true,
    },
  })
  inputString: string = ''

  @Passthrough()
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

  @Passthrough()
  @PortBoolean({
    title: 'Ignore Missing Fields',
    description: 'If true, missing fields in JSON/YAML objects will be set to null instead of throwing an error',
    defaultValue: false,
  })
  ignoreMissingFields: boolean = false

  @Passthrough()
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

      const schema = outputPort.unwrapUnderlyingType()

      if (!schema || !schema.type || !SUPPORTED_TYPES.includes(schema.type)) {
        throw new Error(`Output port has no schema assigned. Make sure that you've provided a valid schema of one of these types: ${SUPPORTED_TYPES.join(', ')}.`)
      }

      try {
        const processedValue = this.filterOutputBySchema(
          parsedData,
          schema,
          (!this.maxDepth || this.maxDepth === 0) ? DEFAULT_MAX_DEPTH : this.maxDepth,
        )
        outputPort.setValue(processedValue)
        this.refreshAnyPortUnderlyingPorts(outputPort as IPort, true)
        await this.updatePort(outputPort as IPort)
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
            return YAML.parse(input)
          } catch (yamlError) {
            throw new Error(`Format error: Input must be valid JSON or YAML`)
          }
        }
      }
    } else if (this.inputFormat === 'yaml') {
      return YAML.parse(input)
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
  ): object | Array<any> | string | number | null {
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
}

export default JsonYamlDeserializerNode
