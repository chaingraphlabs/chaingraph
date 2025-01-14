import {
  cleanupTestNodes,
  registerTestNodes,
} from '@chaingraph/backend/procedures/nodeRegistry/__tests__/utils'
import { appRouter } from '@chaingraph/backend/router'
import { createTestContext } from '@chaingraph/backend/test/utils/createTestContext'
import { createCallerFactory } from '@chaingraph/backend/trpc'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('node Registry Procedures', () => {
  const createCaller = createCallerFactory(appRouter)

  beforeAll(() => {
    registerTestNodes()
  })

  afterAll(() => {
    cleanupTestNodes()
  })

  describe('listAvailableTypes', () => {
    it('should list all registered node types', async () => {
      const ctx = createTestContext()
      const caller = createCaller(ctx)

      const availableNodes = await caller.nodeRegistry.listAvailableTypes()

      expect(availableNodes).toHaveLength(2) // TestNode and AnotherTestNode
      expect(availableNodes.map(node => node.metadata.type))
        .toEqual(expect.arrayContaining(['TestNode', 'AnotherTestNode']))
    })

    it('should return nodes with correct metadata', async () => {
      const ctx = createTestContext()
      const caller = createCaller(ctx)

      const availableNodes = await caller.nodeRegistry.listAvailableTypes()

      const testNode = availableNodes.find(node => node.metadata.type === 'TestNode')
      expect(testNode).toBeDefined()
      expect(testNode?.metadata).toMatchObject({
        type: 'TestNode',
        category: 'processing',
        description: 'Test node for testing purposes',
      })
    })

    // it('should return empty array when no nodes registered', async () => {
    //   const ctx = createTestContext()
    //   const caller = createCaller(ctx)
    //
    //   // Temporarily clear registry
    //   const registry = NodeRegistry.getInstance()
    //   const originalNodes = registry.getNodeTypes()
    //   // cleanupTestNodes()
    //
    //   const availableNodes = await caller.nodeRegistry.listAvailableTypes()
    //   expect(availableNodes).toHaveLength(0)
    //
    //   // Restore registry
    //   originalNodes.forEach((type) => {
    //     registry.registerNode(type === 'TestNode' ? TestNode : AnotherTestNode)
    //   })
    // })
  })

  describe('getNodeType', () => {
    it('should return correct node instance for valid type', async () => {
      const ctx = createTestContext()
      const caller = createCaller(ctx)

      const node = await caller.nodeRegistry.getNodeType('TestNode')

      expect(node).toBeDefined()
      expect(node.metadata.type).toBe('TestNode')
      expect(node.id).toBe('id:TestNode')
    })

    it('should throw error for non-existent node type', async () => {
      const ctx = createTestContext()
      const caller = createCaller(ctx)

      await expect(
        caller.nodeRegistry.getNodeType('NonExistentNode'),
      ).rejects.toThrow()
    })

    it('should create unique instances for same type', async () => {
      const ctx = createTestContext()
      const caller = createCaller(ctx)

      const node1 = await caller.nodeRegistry.getNodeType('TestNode')
      const node2 = await caller.nodeRegistry.getNodeType('TestNode')

      expect(node1.id).toBe('id:TestNode')
      expect(node2.id).toBe('id:TestNode')
      expect(node1).not.toBe(node2) // Should be different instances
    })

    it('should preserve node metadata', async () => {
      const ctx = createTestContext()
      const caller = createCaller(ctx)

      const node = await caller.nodeRegistry.getNodeType('AnotherTestNode')

      expect(node.metadata).toMatchObject({
        type: 'AnotherTestNode',
        category: 'input',
        description: 'Another test node',
      })
    })
  })
})
