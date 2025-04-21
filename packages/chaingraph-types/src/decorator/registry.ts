/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '../node/interface'
import type { IObjectSchema } from '../port/base'
import { getNodeMetadata, getOrCreateNodeMetadata } from './index'

export type NodeConstructor = new (...args: any[]) => INode

/**
 * Registry for managing node types
 */
export class NodeRegistry {
  private static instance: NodeRegistry
  private nodesConstructors: Map<string, NodeConstructor> = new Map()
  private objectSchema: Map<string, IObjectSchema> = new Map()

  constructor() {}

  static getInstance(): NodeRegistry {
    if (!NodeRegistry.instance) {
      NodeRegistry.instance = new NodeRegistry()
    }
    return NodeRegistry.instance
  }

  static setInstance(instance: NodeRegistry): void {
    NodeRegistry.instance = instance
  }

  /**
   * Copy and append nodes and object schemas from another registry
   * @param other NodeRegistry instance to copy from
   */
  copyFrom(other: NodeRegistry): void {
    // append nodes
    other.nodesConstructors.forEach((nodeClass, type) => {
      if (!this.nodesConstructors.has(type)) {
        this.nodesConstructors.set(type, nodeClass)
      }
    })

    // append object schemas
    other.objectSchema.forEach((schema, id) => {
      if (!this.objectSchema.has(id)) {
        this.objectSchema.set(id, schema)
      }
    })
  }

  /**
   * Register a node class with its type identifier.
   * @param nodeClass Constructor of the node
   */
  registerNode(nodeClass: NodeConstructor): void {
    const metadata = getNodeMetadata(nodeClass)
    if (metadata) {
      this.nodesConstructors.set(metadata.type, nodeClass)
    } else {
      throw new Error('Node metadata missing. Ensure @Node decorator is used.')
    }
  }

  /**
   * Update a node class with metadata
   * @param nodeClass Constructor
   * @param metadata Metadata to update
   */
  updateNode(nodeClass: NodeConstructor, metadata: any): void {
    const nodeMetadata = getOrCreateNodeMetadata(nodeClass)
    Object.assign(nodeMetadata, metadata)
    this.nodesConstructors.set(nodeMetadata.type, nodeClass)
  }

  /**
   * Create a node instance by type
   * @param type Node type identifier
   * @param args Arguments to pass to the node constructor
   */
  createNode(type: string, ...args: any[]): INode {
    const NodeClass = this.nodesConstructors.get(type)
    if (!NodeClass)
      throw new Error(`Unknown node type: ${type}`)

    return new NodeClass(...args)
  }

  /**
   * Get all registered node types
   */
  getNodeTypes(): string[] {
    return Array.from(this.nodesConstructors.keys())
  }

  /**
   * Register an object schema
   * @param id Object schema identifier
   * @param schema Object schema
   */
  registerObjectSchema(id: string, schema: IObjectSchema): void {
    this.objectSchema.set(id, {
      ...schema,
    })
  }

  /**
   * Get the object schema
   * @param id Object schema identifier
   */
  getObjectSchema(id: string): IObjectSchema | undefined {
    return this.objectSchema.get(id)
  }

  /**
   * Get all registered object schemas
   */
  getObjectSchemas(): Map<string, IObjectSchema> {
    return this.objectSchema
  }

  clear() {
    this.nodesConstructors.clear()
    this.objectSchema.clear()
  }
}
