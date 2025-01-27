import type { ExecutionContext, ExecutionEvent, INode } from '@chaingraph/types'
import type { NodeExecutionResult } from '@chaingraph/types/node/types'
import { ExecutionStatus } from '@chaingraph/backend/execution'
import { BaseNode, ExecutionEventEnum, Flow, Node, NodeExecutionStatus } from '@chaingraph/types'
import { beforeEach, describe, expect, it } from 'vitest'
import { ExecutionService } from '../services/execution-service'
import { InMemoryExecutionStore } from '../store/execution-store'

// Simple test node for flow execution
@Node({
  title: 'Test Node',
})
class TestNode extends BaseNode {
  constructor(id: string) {
    super(id)
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
    }
  }
}

describe('executionService', () => {
  let executionService: ExecutionService
  let store: InMemoryExecutionStore
  let flow: Flow
  let testNode: INode

  beforeEach(() => {
    // Setup fresh instances for each test
    store = new InMemoryExecutionStore()
    executionService = new ExecutionService(store)
    flow = new Flow({ name: 'Test Flow' })
    testNode = new TestNode('test-node-1')
    testNode.initialize()
    flow.addNode(testNode)
  })

  describe('createExecution', () => {
    it('should create new execution instance', async () => {
      const instance = await executionService.createExecution(flow)

      expect(instance).toBeDefined()
      expect(instance.id).toBeDefined()
      expect(instance.status).toBe(ExecutionStatus.Created)
      expect(instance.flow).toBe(flow)
    })

    it('should create execution with debug options', async () => {
      const instance = await executionService.createExecution(flow, {
        debug: true,
      })

      expect(instance.engine.getDebugger()).toBeDefined()
    })
  })

  describe('startExecution', () => {
    it('should start execution successfully', async () => {
      const instance = await executionService.createExecution(flow)
      await executionService.startExecution(instance.id)

      const state = await executionService.getExecutionState(instance.id)
      expect(state.status).toBe(NodeExecutionStatus.Completed)
    })

    it('should fail for non-existent execution', async () => {
      await expect(
        executionService.startExecution('non-existent'),
      ).rejects.toThrow()
    })
  })

  describe('event handling', () => {
    it('should emit execution events', async () => {
      const events: ExecutionEvent[] = []
      const instance = await executionService.createExecution(flow)

      // Subscribe to events
      const unsubscribe = instance.engine.onAll((event) => {
        events.push(event)
      })

      try {
        await executionService.startExecution(instance.id)

        expect(events).toContainEqual(
          expect.objectContaining({
            type: ExecutionEventEnum.FLOW_STARTED,
          }),
        )
        expect(events).toContainEqual(
          expect.objectContaining({
            type: ExecutionEventEnum.FLOW_COMPLETED,
          }),
        )
      } finally {
        unsubscribe()
      }
    })
  })

  describe('debug operations', () => {
    it('should add and remove breakpoints', async () => {
      const instance = await executionService.createExecution(flow, {
        debug: true,
      })

      await executionService.addBreakpoint(instance.id, testNode.id)
      const breakpoints = await executionService.getBreakpoints(instance.id)
      expect(breakpoints).toContain(testNode.id)

      await executionService.removeBreakpoint(instance.id, testNode.id)
      const updatedBreakpoints = await executionService.getBreakpoints(instance.id)
      expect(updatedBreakpoints).not.toContain(testNode.id)
    })
  })

  describe('cleanup', () => {
    it('should cleanup old executions', async () => {
      // Create multiple executions
      const instance1 = await executionService.createExecution(flow)
      const instance2 = await executionService.createExecution(flow)

      // Complete executions
      await executionService.startExecution(instance1.id)
      await executionService.startExecution(instance2.id)

      // Mock date to simulate old executions
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 2) // 2 days ago
      instance1.completedAt = oldDate

      // Trigger cleanup
      await executionService.getCleanupService().cleanup()

      // Verify cleanup
      const remainingExecutions = await store.list()
      expect(remainingExecutions.length).toBe(1)
      expect(remainingExecutions[0].id).toBe(instance2.id)
    })
  })

  describe('error handling', () => {
    it('should handle execution errors', async () => {
      // Create a failing node
      @Node({ title: 'Failing Node' })
      class FailingNode extends BaseNode {
        async execute(): Promise<NodeExecutionResult> {
          throw new Error('Test error')
        }
      }

      const failingNode = new FailingNode('failing-node')
      failingNode.initialize()
      flow.addNode(failingNode)

      const instance = await executionService.createExecution(flow)
      await executionService.startExecution(instance.id)

      const state = await executionService.getExecutionState(instance.id)
      expect(state.status).toBe(ExecutionStatus.Failed)
      expect(state.error?.message).toContain('Test error')
    })
  })
})
