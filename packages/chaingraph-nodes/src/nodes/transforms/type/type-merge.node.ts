/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  INode,
  IPort,
  IPortConfig,
  NodeExecutionResult,
  ObjectPort,
  ObjectPortConfig,
} from '@badaitech/chaingraph-types'

import {
  BaseNode,
  deepCopy,
  Node,
  OnPortUpdate,
  Output,
  Passthrough,
  PortObject,
} from '@badaitech/chaingraph-types'

import { NODE_CATEGORIES } from '../../../categories'

@Node({
  type: 'TypeMergeNode',
  title: 'Type Merge',
  description: 'Merge two object types into one (intersection). Type: Object<A> × Object<B> → Object<A & B>',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['type', 'merge', 'combine', 'intersection', 'object', 'transform', 'algebra'],
})
class TypeMergeNode extends BaseNode {
  @Passthrough()
  @PortObject({
    title: 'Type A',
    description: 'The first object type',
    schema: { properties: {} },
    isSchemaMutable: true,
  })
  @OnPortUpdate(async (node: INode) => {
    (node as TypeMergeNode).updateMergedType()
  })
  typeA: Record<string, any> = {}

  @Passthrough()
  @PortObject({
    title: 'Type B',
    description: 'The second object type',
    schema: { properties: {} },
    isSchemaMutable: true,
  })
  @OnPortUpdate(async (node: INode) => {
    (node as TypeMergeNode).updateMergedType()
  })
  typeB: Record<string, any> = {}

  @Output()
  @PortObject({
    title: 'Merged',
    description: 'The merged object type (A & B)',
    schema: { properties: {} },
    isSchemaMutable: false,
  })
  merged: Record<string, any> = {}

  /**
   * Deep merge two port configs
   * If both are objects, recursively merge their properties
   * Otherwise, second config wins (including UI properties)
   */
  private deepMergeConfigs(configA: IPortConfig, configB: IPortConfig): IPortConfig {
    // If both are objects, deep merge their properties
    if (configA.type === 'object' && configB.type === 'object') {
      const objA = configA as ObjectPortConfig
      const objB = configB as ObjectPortConfig

      const propsA = objA.schema?.properties || {}
      const propsB = objB.schema?.properties || {}

      const allKeys = new Set([...Object.keys(propsA), ...Object.keys(propsB)])
      const mergedProps: Record<string, IPortConfig> = {}

      for (const key of allKeys) {
        const propA = propsA[key]
        const propB = propsB[key]

        if (propA && propB) {
          // Both have this property - deep merge
          mergedProps[key] = this.deepMergeConfigs(propA, propB)
        } else if (propB) {
          // Only B has it
          mergedProps[key] = deepCopy(propB)
        } else if (propA) {
          // Only A has it
          mergedProps[key] = deepCopy(propA)
        }
      }

      // Return merged object config, with B's UI winning on conflicts
      return {
        ...deepCopy(configA),
        ...deepCopy(configB),
        schema: {
          properties: mergedProps,
        },
      } as ObjectPortConfig
    }

    // For non-objects or type mismatch, B wins completely
    return deepCopy(configB)
  }

  private updateMergedType() {
    const portA = this.findPort(
      p => p.getConfig().key === 'typeA' && !p.getConfig().parentId,
    ) as ObjectPort | undefined

    const portB = this.findPort(
      p => p.getConfig().key === 'typeB' && !p.getConfig().parentId,
    ) as ObjectPort | undefined

    const mergedPort = this.findPort(
      p => p.getConfig().key === 'merged'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as ObjectPort | undefined

    if (!mergedPort) {
      return
    }

    const schemaA = portA?.getConfig().schema?.properties || {}
    const schemaB = portB?.getConfig().schema?.properties || {}

    // Get all unique keys from both schemas
    const allKeys = new Set([...Object.keys(schemaA), ...Object.keys(schemaB)])
    const mergedProperties: Record<string, IPortConfig> = {}

    // Deep merge each property
    for (const key of allKeys) {
      const propA = schemaA[key]
      const propB = schemaB[key]

      if (propA && propB) {
        // Both schemas have this property - deep merge
        mergedProperties[key] = this.deepMergeConfigs(propA, propB)
      } else if (propB) {
        // Only B has this property
        mergedProperties[key] = deepCopy(propB)
      } else if (propA) {
        // Only A has this property
        mergedProperties[key] = deepCopy(propA)
      }
    }

    // Start batch update for performance
    this.startBatchUpdate()

    // Remove all existing properties
    const existingKeys = Object.keys(mergedPort.getConfig().schema?.properties || {})
    if (existingKeys.length > 0) {
      this.removeObjectProperties(mergedPort as IPort, existingKeys)
    }

    // Set the merged schema
    mergedPort.setConfig({
      ...mergedPort.getConfig(),
      schema: {
        properties: mergedProperties,
      },
      isSchemaMutable: false,
    })

    // Add all merged properties to create child ports
    const propertyConfigs = Object.entries(mergedProperties).map(([key, config]) => ({
      ...config,
      key,
      title: config.title || key,
      direction: 'output' as const,
    }))

    if (propertyConfigs.length > 0) {
      this.addObjectProperties(mergedPort as IPort, propertyConfigs, true)
    }

    // Commit all changes at once
    this.commitBatchUpdate()
  }

  /**
   * Deep merge two objects at runtime
   * Recursively merges nested objects, with B winning on conflicts
   */
  private deepMergeValues(objA: any, objB: any): any {
    if (!objA || typeof objA !== 'object') return objB
    if (!objB || typeof objB !== 'object') return objB

    const result: any = { ...objA }

    for (const key in objB) {
      if (Object.prototype.hasOwnProperty.call(objB, key)) {
        const valueA = result[key]
        const valueB = objB[key]

        // If both values are plain objects, recursively merge
        if (
          valueA
          && typeof valueA === 'object'
          && !Array.isArray(valueA)
          && valueB
          && typeof valueB === 'object'
          && !Array.isArray(valueB)
        ) {
          result[key] = this.deepMergeValues(valueA, valueB)
        } else {
          // Otherwise, B wins
          result[key] = valueB
        }
      }
    }

    return result
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Deep merge the actual values (B wins on conflicts)
    this.merged = this.deepMergeValues(this.typeA || {}, this.typeB || {})
    return {}
  }
}

export default TypeMergeNode
