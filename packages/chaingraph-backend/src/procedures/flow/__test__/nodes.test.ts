import { appRouter } from '@chaingraph/backend/router'
import { createTestContext } from '@chaingraph/backend/test/utils/createTestContext'
import { createCallerFactory } from '@chaingraph/backend/trpc'
import { NodeCatalog } from '@chaingraph/nodes'
import {
  BaseNode,
  type ExecutionContext,
  Id,
  Input,
  Node,
  type NodeExecutionResult,
  NodeExecutionStatus,
  NodeRegistry,
  Output,
  PortBoolean,
  PortNumber,
  PortString,
} from '@chaingraph/types'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

@Node({
  title: 'Scalar Node',
  description: 'Node with scalar ports',
}, null)
class ScalarNode extends BaseNode {
  @Input()
  @PortString({
    defaultValue: 'default string',
  })
  @Id('strInput')
  strInput: string = 'default string'

  @Input()
  @PortNumber({
    defaultValue: 42,
  })
  @Id('numInput')
  numInput: number = 42

  @Input()
  @PortBoolean({
    defaultValue: true,
  })
  @Id('boolInput')
  boolInput: boolean = true

  @Id('strOutput')
  @PortString()
  @Output()
  strOutput: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

describe('flow Node Procedures', () => {
  beforeAll(() => {
    NodeRegistry.getInstance().clear()
    NodeRegistry.getInstance().registerNode(ScalarNode)
  })

  afterAll(() => {
    NodeRegistry.getInstance().clear()
  })

  async function setupTestFlow() {
    const ctx = createTestContext(
      NodeRegistry.getInstance(),
      new NodeCatalog(NodeRegistry.getInstance()),
    )

    const caller = createCallerFactory(appRouter)(ctx)
    const flow = await caller.flow.create({ name: 'Test Flow' })
    const types = await caller.nodeRegistry.listAvailableTypes()
    expect(types.length).toBeGreaterThan(0)

    // Find ScalarNode type
    const scalarNodeType = types.find(t => t.title === 'Scalar Node')
    expect(scalarNodeType).toBeDefined()

    return { caller, flow, nodeType: scalarNodeType!.type }
  }

  describe('addNode', () => {
    it('should add node to existing flow', async () => {
      const { caller, flow, nodeType } = await setupTestFlow()

      // Add node to flow
      const node = await caller.flow.addNode({
        flowId: flow.id,
        nodeType,
        position: { x: 100, y: 100 },
      })

      // Verify node was added
      expect(node).toBeDefined()
      expect(node).toBeDefined()
      expect(node.metadata.title).toBe('Scalar Node')

      // Verify node exists in flow
      const fetchedFlow = await caller.flow.get(flow.id)
      expect(fetchedFlow.nodes).toHaveLength(1)
      expect(Array.from(fetchedFlow.nodes.values())[0].id).toBe(node.id)
    })
  })
})
