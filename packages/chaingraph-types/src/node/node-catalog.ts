/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategorizedNodes, CategoryMetadata, NodeCategory } from './category'
import type { INode } from './interface'
import { getPortsMetadata } from './../decorator'

export class NodeCatalog {
  // Singleton instance if needed
  private static instance: NodeCatalog

  // Map for storing nodes by unique type (or key)
  private nodeInstances: Map<string, INode> = new Map()

  // Map for storing category metadata – these are provided externally
  private categoryMetadata: Map<NodeCategory, CategoryMetadata> = new Map()

  // Map for storing nodes grouped by category.
  // Each category holds an object implementing CategorizedNodes for easier management.
  private categorizedNodes: Map<NodeCategory, CategorizedNodes> = new Map()

  constructor() {}

  //
  // private initializeNodes(): void {
  //   const nodeTypes = this.registry.getNodeTypes()
  //
  //   nodeTypes.forEach((type) => {
  //     try {
  //       const node = this.registry.createNode(type, `${type}-catalog`)
  //       this.nodeInstances.set(type, node)
  //
  //       // Get node category or use OTHER if not specified
  //       const category = node.metadata.category || NODE_CATEGORIES.OTHER
  //
  //       // Get metadata based on category
  //       const metadata = isKnownCategory(category)
  //         ? CATEGORY_METADATA[category]
  //         : CATEGORY_METADATA[NODE_CATEGORIES.OTHER]
  //
  //       // Initialize category if not exists
  //       if (!this.categorizedNodes.has(category)) {
  //         this.categorizedNodes.set(category, {
  //           category,
  //           metadata,
  //           nodes: [],
  //         })
  //       }

  /**
   * Register a new category with its metadata.
   * If the category already exists, its metadata will be overwritten.
   *
   * @param category
   * @param metadata
   */
  registerCategory(category: NodeCategory, metadata: CategoryMetadata): void {
    this.categoryMetadata.set(category, metadata)

    // Create a new entry in categorized nodes if not exists,
    // preserving already added nodes if any
    if (!this.categorizedNodes.has(category)) {
      this.categorizedNodes.set(category, {
        category,
        metadata,
        nodes: [],
      })
    } else {
      // update metadata on existing entry
      const catGroup = this.categorizedNodes.get(category)!
      catGroup.metadata = metadata
    }
  }

  /**
   * Register a node instance in the catalog within a specific category.
   * The category can be provided as the second parameter. If not provided,
   * the node's own metadata.category is used. If still not defined, the node will be
   * registered under a default category identifier ("other").
   *
   * @param type A unique identifier for the node
   * @param node
   * @param categoryOverride Optional category id to force registration into a specific category.
   */
  registerNode(type: string, node: INode, categoryOverride?: NodeCategory): void {
    this.nodeInstances.set(type, node)

    // Determine the category: use override > node.metadata.category > default ("other")
    const defaultCategory = 'other'
    const category: NodeCategory = categoryOverride || node.metadata.category || defaultCategory

    // If the category metadata has not been registered yet, create a default metadata record.
    if (!this.categoryMetadata.has(category)) {
      const defaultMetadata: CategoryMetadata = {
        id: category,
        label: category,
        description: '',
        icon: '',
        style: {
          light: {
            primary: '#cccccc',
            secondary: '#999999',
            background: '#ffffff',
            text: '#000000',
          },
          dark: {
            primary: '#333333',
            secondary: '#666666',
            background: '#000000',
            text: '#ffffff',
          },
        },
        order: 1000, // default order
      }
      this.registerCategory(category, defaultMetadata)
    }

    // Now add the node's metadata to the list in the category.
    const catGroup = this.categorizedNodes.get(category)!
    const portsConfig = getPortsMetadata(node.constructor)

    catGroup.nodes.push({
      ...node.metadata,
      portsConfig,
    })

    // Sort nodes in this category by title
    catGroup.nodes.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
  }

  /**
   * Get all available nodes grouped by categories.
   * Categories are sorted based on the metadata order.
   */
  getAllNodes(): CategorizedNodes[] {
    const result = Array.from(this.categorizedNodes.values())
    result.sort((a, b) => a.metadata.order - b.metadata.order)
    return result
  }

  /**
   * Get nodes for a specific category.
   *
   * @param category
   */
  getNodesByCategory(category: NodeCategory): CategorizedNodes | undefined {
    return this.categorizedNodes.get(category)
  }

  /**
   * Get a registered node instance by its type.
   *
   * @param type
   */
  getNodeByType(type: string): INode | undefined {
    return this.nodeInstances.get(type)
  }

  /**
   * Get all available categories that have nodes registered.
   */
  getCategories(): NodeCategory[] {
    return Array.from(this.categorizedNodes.keys())
  }

  /**
   * Search nodes by a query across all categories.
   * Searches in node title, description and tags.
   *
   * @param query
   */
  searchNodes(query: string): CategorizedNodes[] {
    const normalizedQuery = query.toLowerCase().trim()

    if (!normalizedQuery) {
      return this.getAllNodes()
    }

    const results = new Map<NodeCategory, CategorizedNodes>()

    this.categorizedNodes.forEach((categoryData, category) => {
      const matchedNodes = categoryData.nodes.filter((nodeMeta) => {
        const title = nodeMeta.title?.toLowerCase() || ''
        const description = nodeMeta.description?.toLowerCase() || ''
        const tags = nodeMeta.tags?.map(t => t.toLowerCase()) || []
        return (
          title.includes(normalizedQuery)
          || description.includes(normalizedQuery)
          || tags.some(tag => tag.includes(normalizedQuery))
        )
      })

      if (matchedNodes.length > 0) {
        results.set(category, {
          ...categoryData,
          nodes: matchedNodes,
        })
      }
    })

    return Array.from(results.values())
  }

  /**
   * Clear all cached node and category registrations.
   */
  clear(): void {
    this.nodeInstances.clear()
    this.categorizedNodes.clear()
    this.categoryMetadata.clear()
  }
}
