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
  ObjectPortConfig,
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

/**
 * ArrayZipMerge Node - Combine object arrays with deep merge
 *
 * Takes two arrays of objects and merges them element-wise.
 * Unlike ArrayZip which creates {a, b} pairs, this deep-merges
 * the objects together.
 *
 * EXAMPLE:
 *   Array A: [{ x: 1 }, { x: 2 }]
 *   Array B: [{ y: "a" }, { y: "b" }]
 *   Result:  [{ x: 1, y: "a" }, { x: 2, y: "b" }]
 *
 * NESTED MERGE:
 *   Array A: [{ data: { x: 1 } }]
 *   Array B: [{ data: { y: 2 } }]
 *   Result:  [{ data: { x: 1, y: 2 } }]
 *
 * USE CASES:
 * - Combine multiple ArrayEmbed outputs
 * - Merge partial objects from different sources
 * - Build complex nested structures step by step
 *
 * COMPOSABILITY:
 * - Chain multiple ZipMerge nodes for 3+ arrays
 * - Use after ArrayEmbed to combine embeddings
 */
@Node({
  type: 'ArrayZipMergeNode',
  title: 'Array Zip Merge',
  description: `**Merge object arrays element-wise**

Combines two object arrays by deep-merging corresponding elements.

**Type:** \`Array<A> × Array<B> → Array<A & B>\`

**Example:**
\`[{x:1}]\` + \`[{y:2}]\` → \`[{x:1, y:2}]\`

**Nested merge:**
\`[{a:{x:1}}]\` + \`[{a:{y:2}}]\` → \`[{a:{x:1, y:2}}]\`

**Use with:**
- ArrayEmbed outputs to combine multiple embeddings
- Partial objects from different transformations`,
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['array', 'zip', 'merge', 'combine', 'deep-merge', 'transform'],
})
class ArrayZipMergeNode extends BaseNode {
  @Passthrough()
  @PortArray({
    title: 'Array A',
    description: `**First object array**

Objects from this array form the base.
Properties are overwritten by Array B on conflicts.`,
    itemConfig: {
      type: 'object',
      schema: { properties: {} },
      isSchemaMutable: true,
    },
    isMutable: true,
    isSchemaMutable: true,
  })
  @OnPortUpdate(async (node: INode) => {
    (node as ArrayZipMergeNode).updateResultType()
  })
  arrayA: object[] = []

  @Passthrough()
  @PortArray({
    title: 'Array B',
    description: `**Second object array**

Objects merged into Array A elements.
On property conflicts, Array B values win.`,
    itemConfig: {
      type: 'object',
      schema: { properties: {} },
      isSchemaMutable: true,
    },
    isMutable: true,
    isSchemaMutable: true,
  })
  @OnPortUpdate(async (node: INode) => {
    (node as ArrayZipMergeNode).updateResultType()
  })
  arrayB: object[] = []

  @Output()
  @PortArray({
    title: 'Result',
    description: `**Merged object array**

Each element is a deep merge of corresponding A and B elements.
Length matches the shorter input array.`,
    itemConfig: {
      type: 'object',
      schema: { properties: {} },
    },
    isSchemaMutable: true,
  })
  result: object[] = []

  /**
   * Update output type by merging schemas from both inputs
   */
  private updateResultType() {
    const portA = this.findPort(
      p => p.getConfig().key === 'arrayA' && !p.getConfig().parentId,
    ) as ArrayPort | undefined

    const portB = this.findPort(
      p => p.getConfig().key === 'arrayB' && !p.getConfig().parentId,
    ) as ArrayPort | undefined

    const resultPort = this.findPort(
      p => p.getConfig().key === 'result'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as ArrayPort | undefined

    if (!resultPort) {
      return
    }

    const itemConfigA = portA?.getConfig().itemConfig || { type: 'object', schema: { properties: {} } }
    const itemConfigB = portB?.getConfig().itemConfig || { type: 'object', schema: { properties: {} } }

    // Deep merge the schemas
    const mergedSchema = this.deepMergeSchemas(itemConfigA, itemConfigB)

    resultPort.setConfig({
      ...resultPort.getConfig(),
      itemConfig: mergedSchema,
    })

    this.updateArrayItemConfig(resultPort as IPort)
  }

  /**
   * Deep merge two port schemas
   * B's properties override A's on conflict
   */
  private deepMergeSchemas(configA: IPortConfig, configB: IPortConfig): IPortConfig {
    // If either is not an object, B wins
    if (configA.type !== 'object' || configB.type !== 'object') {
      return deepCopy(configB)
    }

    const schemaA = (configA as ObjectPortConfig).schema || { properties: {} }
    const schemaB = (configB as ObjectPortConfig).schema || { properties: {} }

    const propsA = schemaA.properties || {}
    const propsB = schemaB.properties || {}

    // Collect all keys
    const allKeys = new Set([...Object.keys(propsA), ...Object.keys(propsB)])
    const mergedProps: Record<string, IPortConfig> = {}

    for (const key of allKeys) {
      const propA = propsA[key]
      const propB = propsB[key]

      if (propA && propB) {
        // Both have this key - recurse if both are objects
        if (propA.type === 'object' && propB.type === 'object') {
          mergedProps[key] = this.deepMergeSchemas(propA, propB)
        }
        else {
          // Type mismatch or non-objects - B wins
          mergedProps[key] = deepCopy(propB)
        }
      }
      else if (propB) {
        mergedProps[key] = deepCopy(propB)
      }
      else if (propA) {
        mergedProps[key] = deepCopy(propA)
      }
    }

    return {
      type: 'object',
      schema: {
        ...schemaA,
        ...schemaB,
        properties: mergedProps,
      },
      isSchemaMutable: false,
    }
  }

  /**
   * Deep merge two objects at runtime
   * B's values override A's on conflict
   */
  private deepMergeObjects(objA: any, objB: any): any {
    // Handle null/undefined
    if (objB === null || objB === undefined) {
      return objA
    }
    if (objA === null || objA === undefined) {
      return objB
    }

    // If either is not a plain object, B wins
    if (typeof objA !== 'object' || typeof objB !== 'object') {
      return objB
    }
    if (Array.isArray(objA) || Array.isArray(objB)) {
      return objB
    }

    const result: any = { ...objA }

    for (const key of Object.keys(objB)) {
      if (
        typeof objB[key] === 'object'
        && objB[key] !== null
        && !Array.isArray(objB[key])
        && typeof result[key] === 'object'
        && result[key] !== null
        && !Array.isArray(result[key])
      ) {
        // Both are plain objects - recurse
        result[key] = this.deepMergeObjects(result[key], objB[key])
      }
      else {
        // Otherwise B wins
        result[key] = objB[key]
      }
    }

    return result
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const a = Array.isArray(this.arrayA) ? this.arrayA : []
    const b = Array.isArray(this.arrayB) ? this.arrayB : []

    // Use shorter length (like standard zip)
    const length = Math.min(a.length, b.length)

    this.result = []
    for (let i = 0; i < length; i++) {
      this.result.push(this.deepMergeObjects(a[i] || {}, b[i] || {}))
    }

    return {}
  }
}

export default ArrayZipMergeNode
