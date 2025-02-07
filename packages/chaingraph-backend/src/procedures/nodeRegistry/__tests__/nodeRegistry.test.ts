import { NodeCatalog, NodeRegistry } from '@badaitech/chaingraph-types'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { appRouter } from '../../../router'
import { createTestContext } from '../../../test/utils/createTestContext'
import { createCallerFactory } from '../../../trpc'
import { cleanupTestNodes, registerTestNodes } from '../utils'

describe('node Registry Procedures', () => {
  const createCaller = createCallerFactory(appRouter)
  let nodeRegistry: NodeRegistry
  let nodeCatalog: NodeCatalog

  beforeAll(() => {
    nodeRegistry = NodeRegistry.getInstance()
    registerTestNodes()
    nodeCatalog = new NodeCatalog()
  })

  afterAll(() => {
    cleanupTestNodes()
  })

  describe('getCategorizedNodes', () => {
    it('should return nodes grouped by categories', async () => {
      const ctx = createTestContext(nodeRegistry, nodeCatalog)
      const caller = createCaller(ctx)

      const categorizedNodes = await caller.nodeRegistry.getCategorizedNodes()

      expect(categorizedNodes).toBeDefined()
      expect(Array.isArray(categorizedNodes)).toBe(true)
      expect(categorizedNodes.length).toBeGreaterThan(0)

      // Check structure of returned data
      const firstCategory = categorizedNodes[0]
      expect(firstCategory).toHaveProperty('category')
      expect(firstCategory).toHaveProperty('metadata')
      expect(firstCategory).toHaveProperty('nodes')
      expect(Array.isArray(firstCategory.nodes)).toBe(true)
    })
  })

  describe('searchNodes', () => {
    it('should find nodes matching search query', async () => {
      const ctx = createTestContext(nodeRegistry, nodeCatalog)
      const caller = createCaller(ctx)

      const searchResults = await caller.nodeRegistry.searchNodes('test')

      expect(searchResults).toBeDefined()
      expect(Array.isArray(searchResults)).toBe(true)

      // Should find our test nodes
      const allNodes = searchResults.flatMap(category => category.nodes)
      expect(allNodes.some(node => node.type === 'TestNode')).toBe(true)
    })

    it('should return empty array for non-matching query', async () => {
      const ctx = createTestContext(nodeRegistry, nodeCatalog)
      const caller = createCaller(ctx)

      const searchResults = await caller.nodeRegistry.searchNodes('nonexistent')
      expect(searchResults).toHaveLength(0)
    })
  })

  describe('getNodesByCategory', () => {
    it('should return nodes for existing category', async () => {
      const ctx = createTestContext(nodeRegistry, nodeCatalog)
      const caller = createCaller(ctx)

      const category = nodeCatalog.getCategories()[0]
      const categoryNodes = await caller.nodeRegistry.getNodesByCategory(category)

      expect(categoryNodes).toBeDefined()
      expect(categoryNodes?.nodes.length).toBeGreaterThan(0)
    })

    it('should return undefined for non-existent category', async () => {
      const ctx = createTestContext(nodeRegistry, nodeCatalog)
      const caller = createCaller(ctx)

      const categoryNodes = await caller.nodeRegistry.getNodesByCategory('nonexistent')
      expect(categoryNodes).toBeUndefined()
    })
  })
})
