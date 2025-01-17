import { appRouter } from '@chaingraph/backend/router'
import { createTestContext } from '@chaingraph/backend/test/utils/createTestContext'
import { createCallerFactory } from '@chaingraph/backend/trpc'
import { NodeRegistry } from '@chaingraph/types'
import { describe, expect, it } from 'vitest'

describe('flow Node Procedures', () => {
  const createCaller = createCallerFactory(appRouter)

  describe('addNode', () => {
    it('should add node to existing flow', async () => {
      const ctx = createTestContext()
      const caller = createCaller(ctx)

      // Create a test flow first
      const flow = await caller.flow.create({
        name: 'Test Flow',
      })
      if (!flow) {
        throw new Error('Flow creation failed')
      }

      const nodeTypes = await caller.nodeRegistry.listAvailableTypes()
      if (!nodeTypes || nodeTypes.length === 0) {
        throw new Error('No node types available')
      }

      // Get first available node type from registry
      // const nodeTypes = NodeRegistry.getInstance().getNodeTypes()
      // if (nodeTypes.length === 0) {
      //   throw new Error('No node types available')
      // }
      const testNodeType = nodeTypes[0]

      // Add node to flow
      const node = await caller.flow.addNode({
        flowId: flow.id,
        nodeType: testNodeType.metadata.type,
        position: { x: 100, y: 100 },
      })

      // Verify node was added
      expect(node).toBeDefined()
      expect(node).toBeDefined()
      expect(node.metadata.title).toBe('Scalar Node')

      // Verify node exists in flow
      const flowNodes = await ctx.flowStore.listFlowNodes(flow.id)
      expect(flowNodes).toHaveLength(1)
      expect(flowNodes[0].id).toBe(node.id)
    })

    it('should throw error when flow does not exist', async () => {
      const ctx = createTestContext()
      const caller = createCaller(ctx)

      const nodeTypes = NodeRegistry.getInstance().getNodeTypes()
      const testNodeType = nodeTypes[0]

      await expect(caller.flow.addNode({
        flowId: 'non-existent-flow',
        nodeType: testNodeType,
        position: { x: 0, y: 0 },
      })).rejects.toThrow()
    })
  })
})
