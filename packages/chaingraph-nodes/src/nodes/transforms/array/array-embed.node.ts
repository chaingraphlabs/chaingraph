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
  Input,
  Node,
  OnPortUpdate,
  Output,
  Passthrough,
  PortArray,
  PortString,
} from '@badaitech/chaingraph-types'

import { NODE_CATEGORIES } from '../../../categories'

/**
 * ArrayEmbed Node - The inverse of ArrayPluck
 *
 * While ArrayPluck extracts values FROM a nested path,
 * ArrayEmbed places values INTO a nested path.
 *
 * EXAMPLE:
 *   Input:  ["url1", "url2", "url3"]
 *   Path:   "fileData.fileUri"
 *   Output: [
 *     { fileData: { fileUri: "url1" } },
 *     { fileData: { fileUri: "url2" } },
 *     { fileData: { fileUri: "url3" } }
 *   ]
 *
 * USE CASES:
 * - Transform string[] URLs into GeminiMessagePart[]
 * - Wrap primitive arrays into structured object arrays
 * - Prepare data for APIs that expect nested structures
 *
 * COMPOSABILITY:
 * - Chain with ArrayZipMerge to combine multiple embeddings
 * - Use after ArrayPluck to restructure data
 */
@Node({
  type: 'ArrayEmbedNode',
  title: 'Array Embed',
  description: `**Embed values into nested path** (inverse of Pluck)

Place each array element into a nested object structure.

**Type:** \`Array<T> × Path → Array<{path: T}>\`

**Example:**
\`["a", "b"]\` + path \`"x.y"\` → \`[{x:{y:"a"}}, {x:{y:"b"}}]\`

**Use with:**
- ArrayZipMerge to combine multiple embeddings
- ArrayPluck to extract then re-embed at different path`,
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['array', 'embed', 'nest', 'wrap', 'construct', 'inverse-pluck', 'transform'],
})
class ArrayEmbedNode extends BaseNode {
  @Passthrough()
  @PortArray({
    title: 'Array',
    description: `**Source values to embed**

Each element will be placed at the specified path.
Works with any type: strings, numbers, objects, etc.`,
    itemConfig: {
      type: 'any',
      title: 'Item',
    },
    isMutable: true,
    isSchemaMutable: true,
  })
  @OnPortUpdate(async (node: INode) => {
    (node as ArrayEmbedNode).updateResultType()
  })
  array: any[] = []

  @Input()
  @PortString({
    title: 'Path',
    description: `**Target path for embedding**

Dot-notation path where values will be placed:
- \`"name"\` → \`{name: value}\`
- \`"user.email"\` → \`{user: {email: value}}\`
- \`"a.b.c"\` → \`{a: {b: {c: value}}}\``,
    defaultValue: '',
  })
  @OnPortUpdate(async (node: INode) => {
    (node as ArrayEmbedNode).updateResultType()
  })
  path: string = ''

  @Output()
  @PortArray({
    title: 'Result',
    description: `**Array of objects with embedded values**

Each object contains the input value at the specified path.
Type is inferred from input array and path.`,
    itemConfig: {
      type: 'object',
      schema: { properties: {} },
    },
    isSchemaMutable: true,
  })
  result: object[] = []

  /**
   * Update output type based on input type and path
   * Builds nested schema structure at edit-time for type inference
   */
  private updateResultType() {
    const arrayPort = this.findPort(
      p => p.getConfig().key === 'array' && !p.getConfig().parentId,
    ) as ArrayPort | undefined

    const resultPort = this.findPort(
      p => p.getConfig().key === 'result'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as ArrayPort | undefined

    if (!resultPort || !arrayPort) {
      return
    }

    const itemConfig = arrayPort.getConfig().itemConfig || { type: 'any' }

    // Build nested schema from path
    if (this.path) {
      const nestedSchema = this.buildSchemaFromPath(this.path, itemConfig)
      resultPort.setConfig({
        ...resultPort.getConfig(),
        itemConfig: nestedSchema,
      })
    }
    else {
      // No path - wrap in object with 'value' key
      resultPort.setConfig({
        ...resultPort.getConfig(),
        itemConfig: {
          type: 'object',
          schema: {
            properties: {
              value: { ...deepCopy(itemConfig), key: 'value', title: 'Value' },
            },
          },
        },
      })
    }

    this.updateArrayItemConfig(resultPort as IPort)
  }

  /**
   * Build nested object schema from dot-notation path
   * "a.b.c" + Type → { a: { b: { c: Type } } }
   */
  private buildSchemaFromPath(path: string, leafType: IPortConfig): IPortConfig {
    const parts = path.split('.').filter(Boolean)

    if (parts.length === 0) {
      return {
        type: 'object',
        schema: {
          properties: {
            value: { ...deepCopy(leafType), key: 'value', title: 'Value' },
          },
        },
      }
    }

    // Build from inside out: "a.b.c" → {c: T} → {b: {c: T}} → {a: {b: {c: T}}}
    let schema: IPortConfig = deepCopy(leafType)

    for (let i = parts.length - 1; i >= 0; i--) {
      const key = parts[i]
      schema = {
        type: 'object',
        schema: {
          properties: {
            [key]: { ...schema, key, title: key },
          },
        },
        isSchemaMutable: false,
      }
    }

    return schema
  }

  /**
   * Embed a single value at the specified path
   * Creates nested object structure dynamically
   */
  private embedAtPath(value: any, path: string): object {
    const parts = path.split('.').filter(Boolean)

    if (parts.length === 0) {
      return { value }
    }

    const result: any = {}
    let current = result

    // Build nested structure: {a: {b: {c: ...}}}
    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = {}
      current = current[parts[i]]
    }

    // Set the value at the leaf
    current[parts[parts.length - 1]] = value

    return result
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Handle empty or invalid array
    if (!Array.isArray(this.array)) {
      this.result = []
      return {}
    }

    // Embed each element at the specified path
    this.result = this.array.map(item => this.embedAtPath(item, this.path))

    return {}
  }
}

export default ArrayEmbedNode
