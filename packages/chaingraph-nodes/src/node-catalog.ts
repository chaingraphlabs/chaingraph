import type { CategorizedNodes, INode, NodeRegistry } from '@chaingraph/types'
import type { NodeCategory } from '@chaingraph/types/node/category'

import {
  CATEGORY_METADATA,
  NODE_CATEGORIES,
  type NodeCategoryValue,
} from './categories/constants'

/**
 * Type guard to check if a category is one of predefined categories
 */
export function isKnownCategory(category: NodeCategory): category is NodeCategoryValue {
  return Object.values(NODE_CATEGORIES).includes(category as NodeCategoryValue)
}

/**
 * Manages node instances and provides categorized access to them
 */
export class NodeCatalog {
  private static instance: NodeCatalog
  private nodeInstances: Map<string, INode> = new Map()
  private categorizedNodes: Map<NodeCategory, CategorizedNodes> = new Map()

  constructor(private registry: NodeRegistry) {
    this.initializeNodes()
  }

  /**
   * Get singleton instance of NodeCatalog
   */
  static getInstance(registry: NodeRegistry): NodeCatalog {
    if (!NodeCatalog.instance) {
      NodeCatalog.instance = new NodeCatalog(registry)
    }
    return NodeCatalog.instance
  }

  /**
   * Initialize node instances for all registered node types
   */

  private initializeNodes(): void {
    const nodeTypes = this.registry.getNodeTypes()

    nodeTypes.forEach((type) => {
      try {
        const node = this.registry.createNode(type, `${type}-catalog`)
        this.nodeInstances.set(type, node)

        // Get node category or use OTHER if not specified
        const category = node.metadata.category || NODE_CATEGORIES.OTHER

        // Get metadata based on category
        const metadata = isKnownCategory(category)
          ? CATEGORY_METADATA[category]
          : CATEGORY_METADATA[NODE_CATEGORIES.OTHER]

        // Initialize category if not exists
        if (!this.categorizedNodes.has(category)) {
          this.categorizedNodes.set(category, {
            category,
            metadata,
            nodes: [],
          })
        }

        // Add node to category
        this.categorizedNodes.get(category)?.nodes.push(node.metadata)
      } catch (error) {
        console.error(`Failed to initialize node type: ${type}`, error)
      }
    })

    // Sort nodes within categories
    this.categorizedNodes.forEach((category) => {
      category.nodes.sort((a, b) =>
        (a.title || '').localeCompare(b.title || ''),
      )
    })
  }

  /**
   * Get all available nodes grouped by categories
   */
  getAllNodes(): CategorizedNodes[] {
    const categorizedNodes = Array.from(this.categorizedNodes.values())
    // sort by category order
    categorizedNodes.sort((a, b) => a.metadata.order - b.metadata.order)
    return categorizedNodes
  }

  /**
   * Get nodes for specific category
   */
  getNodesByCategory(category: NodeCategory): CategorizedNodes | undefined {
    return this.categorizedNodes.get(category)
  }

  /**
   * Get node instance by type
   */
  getNodeByType(type: string): INode | undefined {
    return this.nodeInstances.get(type)
  }

  /**
   * Get all available categories that have nodes
   */
  getCategories(): NodeCategory[] {
    return Array.from(this.categorizedNodes.keys())
  }

  /**
   * Search nodes by query across all categories
   * Searches in node title, description and tags
   */
  searchNodes(query: string): CategorizedNodes[] {
    const normalizedQuery = query.toLowerCase().trim()

    if (!normalizedQuery) {
      return this.getAllNodes()
    }

    const results = new Map<NodeCategory, CategorizedNodes>()

    this.categorizedNodes.forEach((categoryData, category) => {
      const matchedNodes = categoryData.nodes.filter((node) => {
        const title = node.title?.toLowerCase() || ''
        const description = node.description?.toLowerCase() || ''
        const tags = node.tags?.map(t => t.toLowerCase()) || []

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
   * Clear all cached instances
   */
  clear(): void {
    this.nodeInstances.clear()
    this.categorizedNodes.clear()
  }
}
