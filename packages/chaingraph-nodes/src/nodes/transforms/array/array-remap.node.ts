/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ArrayPort,
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
  PortArray,
} from '@badaitech/chaingraph-types'

import { NODE_CATEGORIES } from '../../../categories'
import { getByPath, getTypeAtPath } from '../utils'

/**
 * Field mapping definition for ArrayRemap
 */
interface FieldMapping {
  /** Source path to extract from (e.g., "user.email") */
  from: string
  /** Target path to embed into (e.g., "contact.emailAddress") */
  to: string
}

/**
 * ArrayRemap Node - Transform object arrays by remapping fields
 *
 * Combines the power of ArrayPluck (extract) and ArrayEmbed (construct)
 * into a single node for complex object transformations.
 *
 * EXAMPLE:
 *   Input: [{ user: { name: "John" }, url: "http://..." }]
 *   Mappings: [
 *     { from: "user.name", to: "label" },
 *     { from: "url", to: "fileData.fileUri" }
 *   ]
 *   Output: [{ label: "John", fileData: { fileUri: "http://..." } }]
 *
 * USE CASES:
 * - Restructure API responses for different consumers
 * - Transform data between different schema versions
 * - Prepare objects for specific API requirements (e.g., Gemini)
 *
 * TYPE INFERENCE:
 * - Output schema is built from mappings at edit-time
 * - Source field types are preserved in target locations
 */
@Node({
  type: 'ArrayRemapNode',
  title: 'Array Remap',
  description: `**Remap object fields to new structure**

Transform array objects by extracting fields from source paths
and embedding them into target paths.

**Type:** \`Array<T> × Mappings → Array<R>\`

**Example:**
\`[{a: {x: 1}}]\` + mapping \`{from: "a.x", to: "b.y"}\`
→ \`[{b: {y: 1}}]\`

**Use for:**
- Restructuring API responses
- Schema migrations
- Preparing data for specific APIs`,
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['array', 'remap', 'transform', 'restructure', 'map', 'project', 'schema'],
})
class ArrayRemapNode extends BaseNode {
  @Passthrough()
  @PortArray({
    title: 'Source',
    description: `**Source object array**

Objects to transform. Fields will be extracted using "from" paths.`,
    itemConfig: {
      type: 'object',
      schema: { properties: {} },
      isSchemaMutable: true,
    },
    isMutable: true,
    isSchemaMutable: true,
  })
  @OnPortUpdate(async (node: INode) => {
    (node as ArrayRemapNode).updateResultType()
  })
  source: object[] = []

  @Passthrough()
  @PortArray({
    title: 'Mappings',
    description: `**Field mappings**

Define how fields move from source to target:
- \`from\`: Source path (e.g., "user.email", "items[0].name")
- \`to\`: Target path (e.g., "contact", "data.email")

**Example mappings:**
\`[
  { from: "url", to: "fileData.fileUri" },
  { from: "type", to: "fileData.mimeType" }
]\``,
    itemConfig: {
      type: 'object',
      schema: {
        properties: {
          from: {
            type: 'string',
            key: 'from',
            title: 'From',
            description: 'Source path to extract value from',
            defaultValue: '',
          },
          to: {
            type: 'string',
            key: 'to',
            title: 'To',
            description: 'Target path to embed value into',
            defaultValue: '',
          },
        },
      },
      isSchemaMutable: false,
    },
    isMutable: true,
    defaultValue: [],
  })
  @OnPortUpdate(async (node: INode) => {
    (node as ArrayRemapNode).updateResultType()
  })
  mappings: FieldMapping[] = []

  @Output()
  @PortArray({
    title: 'Result',
    description: `**Transformed object array**

Objects with fields remapped according to mappings.
Type is inferred from source types and target paths.`,
    itemConfig: {
      type: 'object',
      schema: { properties: {} },
    },
    isSchemaMutable: true,
  })
  result: object[] = []

  /**
   * Update output type based on source type and mappings
   * Builds target schema by combining all mapping target paths
   */
  private updateResultType() {
    const sourcePort = this.findPort(
      p => p.getConfig().key === 'source' && !p.getConfig().parentId,
    ) as ArrayPort | undefined

    const resultPort = this.findPort(
      p => p.getConfig().key === 'result'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as ArrayPort | undefined

    if (!resultPort) {
      return
    }

    const sourceItemConfig = sourcePort?.getConfig().itemConfig || { type: 'object', schema: { properties: {} } }

    // Build target schema from all mappings
    let targetSchema: IPortConfig = {
      type: 'object',
      schema: { properties: {} },
      isSchemaMutable: false,
    }

    for (const mapping of this.mappings || []) {
      if (!mapping.from || !mapping.to) continue

      // Get type at source path
      const sourceType = getTypeAtPath(sourceItemConfig, mapping.from) || { type: 'any' }

      // Merge into target schema at target path
      targetSchema = this.mergeAtPath(targetSchema, mapping.to, sourceType)
    }

    resultPort.setConfig({
      ...resultPort.getConfig(),
      itemConfig: targetSchema,
    })

    this.updateArrayItemConfig(resultPort as IPort)
  }

  /**
   * Merge a type into a schema at the specified path
   * Creates nested structure as needed
   */
  private mergeAtPath(schema: IPortConfig, path: string, valueType: IPortConfig): IPortConfig {
    const parts = path.split('.').filter(Boolean)

    if (parts.length === 0) {
      return schema
    }

    const result = deepCopy(schema)
    let current: any = result

    // Navigate/create path to parent
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i]

      if (!current.schema) {
        current.schema = { properties: {} }
      }
      if (!current.schema.properties) {
        current.schema.properties = {}
      }

      if (!current.schema.properties[key]) {
        current.schema.properties[key] = {
          type: 'object',
          key,
          title: key,
          schema: { properties: {} },
        }
      }

      current = current.schema.properties[key]
    }

    // Set value at leaf
    const leafKey = parts[parts.length - 1]
    if (!current.schema) {
      current.schema = { properties: {} }
    }
    if (!current.schema.properties) {
      current.schema.properties = {}
    }

    current.schema.properties[leafKey] = {
      ...deepCopy(valueType),
      key: leafKey,
      title: leafKey,
    }

    return result
  }

  /**
   * Embed a value at a nested path in an object
   */
  private setAtPath(obj: any, path: string, value: any): void {
    const parts = path.split('.').filter(Boolean)

    if (parts.length === 0) return

    let current = obj

    // Navigate/create path to parent
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i]
      if (current[key] === undefined || current[key] === null) {
        current[key] = {}
      }
      current = current[key]
    }

    // Set value at leaf
    current[parts[parts.length - 1]] = value
  }

  /**
   * Deep merge two objects (for combining multiple embeddings)
   */
  private deepMerge(target: any, source: any): any {
    if (source === null || source === undefined) {
      return target
    }

    if (typeof source !== 'object' || Array.isArray(source)) {
      return source
    }

    const result = { ...target }

    for (const key of Object.keys(source)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key])
      }
      else {
        result[key] = source[key]
      }
    }

    return result
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Handle empty or invalid source
    if (!Array.isArray(this.source)) {
      this.result = []
      return {}
    }

    // Handle no mappings
    if (!this.mappings || this.mappings.length === 0) {
      this.result = this.source.map(() => ({}))
      return {}
    }

    // Transform each source object
    this.result = this.source.map((sourceObj) => {
      const targetObj: any = {}

      for (const mapping of this.mappings) {
        if (!mapping.from || !mapping.to) continue

        // Extract value from source path
        const value = getByPath(sourceObj, mapping.from)

        // Embed into target path (with deep merge for overlapping paths)
        const embedded: any = {}
        this.setAtPath(embedded, mapping.to, value)

        // Merge into result
        Object.assign(targetObj, this.deepMerge(targetObj, embedded))
      }

      return targetObj
    })

    return {}
  }
}

export default ArrayRemapNode
