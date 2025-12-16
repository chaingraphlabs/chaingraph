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
  INode,
  IPort,
  IPortConfig,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'

import {
  BaseNode,
  deepCopy,
  Node,
  OnPortUpdate,
  Output,
  Passthrough,
  PortAny,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'

import * as YAML from 'yaml'
import { NODE_CATEGORIES } from '../../categories'

interface InferOptions {
  allRequired: boolean
  inferArrayItemType: boolean
  maxDepth: number
}

/**
 * Recursively derive IPortConfig from a JavaScript value
 * NOTE: No defaultValue - fields are required, values set separately
 */
function inferPortConfig(
  value: any,
  key: string,
  options: InferOptions,
  depth: number = 0,
): IPortConfig {
  // Max depth check
  if (depth >= options.maxDepth) {
    return { type: 'any', key, title: key, required: true }
  }

  // Handle null/undefined - use 'any' type
  if (value === null || value === undefined) {
    return { type: 'any', key, title: key, required: true }
  }

  // Type detection
  const jsType = typeof value

  // Primitives - required, no defaultValue
  if (jsType === 'string') {
    return { type: 'string', key, title: key, required: true }
  }
  if (jsType === 'number') {
    return { type: 'number', key, title: key, required: true }
  }
  if (jsType === 'boolean') {
    return { type: 'boolean', key, title: key, required: true }
  }

  // Array
  if (Array.isArray(value)) {
    let itemConfig: IPortConfig = { type: 'any', required: true }

    if (options.inferArrayItemType && value.length > 0) {
      // Infer from first element
      itemConfig = inferPortConfig(value[0], 'item', options, depth + 1)
    }

    return {
      type: 'array',
      key,
      title: key,
      itemConfig,
      required: true,
    } as IPortConfig
  }

  // Object
  if (jsType === 'object') {
    const properties: Record<string, IPortConfig> = {}

    for (const [propKey, propValue] of Object.entries(value)) {
      properties[propKey] = inferPortConfig(propValue, propKey, options, depth + 1)
      // All fields required by default
      properties[propKey].required = true
    }

    return {
      type: 'object',
      key,
      title: key,
      schema: { properties },
      required: true,
      isSchemaMutable: false,
    } as IPortConfig
  }

  // Fallback
  return { type: 'any', key, title: key, required: true }
}

@Node({
  type: 'SchemaInferNode',
  title: 'Schema Infer',
  description: 'Infer schema from JSON/YAML data. Parses input and derives a type-safe schema from values.',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['json', 'yaml', 'schema', 'infer', 'derive', 'type', 'object', 'array', 'parse'],
})
class SchemaInferNode extends BaseNode {
  @Passthrough()
  @PortString({
    title: 'Input',
    description: 'JSON or YAML string to parse and infer schema from',
    ui: {
      isTextArea: true,
    },
  })
  @OnPortUpdate(async (node: INode) => {
    const schemaInferNode = node as SchemaInferNode
    schemaInferNode.updateDerivedSchema()
  })
  input: string = ''

  @Passthrough()
  @PortObject({
    title: 'Options',
    description: 'Schema inference options',
    schema: {
      properties: {
        allRequired: {
          type: 'boolean',
          key: 'allRequired',
          title: 'All Required',
          description: 'Mark all derived fields as required',
          defaultValue: true,
        },
        inferArrayItemType: {
          type: 'boolean',
          key: 'inferArrayItemType',
          title: 'Infer Array Item Type',
          description: 'Infer array item type from first element',
          defaultValue: true,
        },
        maxDepth: {
          type: 'number',
          key: 'maxDepth',
          title: 'Max Depth',
          description: 'Maximum recursion depth for nested objects',
          defaultValue: 10,
          min: 1,
          max: 50,
        },
      },
    },
    defaultValue: {
      allRequired: true,
      inferArrayItemType: true,
      maxDepth: 10,
    },
    isSchemaMutable: false,
    ui: {
      collapsed: false,
    },
  })
  @OnPortUpdate(async (node: INode) => {
    const schemaInferNode = node as SchemaInferNode
    schemaInferNode.updateDerivedSchema()
  })
  options: InferOptions = {
    allRequired: true,
    inferArrayItemType: true,
    maxDepth: 10,
  }

  @Output()
  @PortAny({
    title: 'Output',
    description: 'Derived schema with parsed value',
    ui: {
      hideEditor: true,
    },
  })
  output: any = null

  /**
   * Parse input string as JSON or YAML (auto-detect)
   */
  private parseInput(input: string): any {
    // Try JSON first (faster)
    try {
      return JSON.parse(input)
    } catch {
      // Fall back to YAML
      return YAML.parse(input)
    }
  }

  /**
   * Clear output schema when input is empty or invalid
   */
  private clearOutputSchema() {
    const outputPort = this.findPort(
      p => p.getConfig().key === 'output'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as AnyPort | undefined

    if (!outputPort) {
      return
    }

    outputPort.setUnderlyingType(undefined)
    outputPort.setValue(null)
    this.refreshAnyPortUnderlyingPorts(outputPort as IPort, true)
  }

  /**
   * Update derived schema based on input value
   */
  updateDerivedSchema() {
    const inputValue = this.input?.trim()
    if (!inputValue) {
      this.clearOutputSchema()
      return
    }

    // Parse JSON/YAML (auto-detect)
    let parsed: any
    try {
      parsed = this.parseInput(inputValue)
    } catch {
      this.clearOutputSchema()
      return
    }

    // Find output port
    const outputPort = this.findPort(
      p => p.getConfig().key === 'output'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as AnyPort | undefined

    if (!outputPort) {
      return
    }

    // Build options from port values
    const options: InferOptions = {
      allRequired: this.options?.allRequired ?? true,
      inferArrayItemType: this.options?.inferArrayItemType ?? true,
      maxDepth: this.options?.maxDepth || 10,
    }

    // Derive schema (works for both objects and arrays)
    const derivedConfig = inferPortConfig(parsed, 'output', options, 0)

    // Update output port: set schema AND value
    outputPort.setUnderlyingType(deepCopy({
      ...derivedConfig,
      direction: 'output',
      ui: {
        hideEditor: true,
        collapsed: false,
      },
    }))

    // Set the actual parsed value on the port
    outputPort.setValue(parsed)

    // Refresh child ports to match new schema
    this.refreshAnyPortUnderlyingPorts(outputPort as IPort, true)
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Schema derivation happens in @OnPortUpdate
    // Execute just ensures the output is up to date
    this.updateDerivedSchema()
    return {}
  }
}

export default SchemaInferNode
