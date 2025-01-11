import type {
  NodeExecutionResult,
} from '@chaingraph/types'
import {
  BaseNode,
  ExecutionEventEnum,
  NumberPort,
  PortDirectionEnum,
  PortKindEnum,
} from '@chaingraph/types'
import { ExecutionContext } from '@chaingraph/types/flow/execution-context'
import { ExecutionEngine } from '@chaingraph/types/flow/execution-engine'
import { Flow } from '@chaingraph/types/flow/flow'
import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'

class AddNode extends BaseNode {
  inputA: NumberPort
  inputB: NumberPort
  output: NumberPort

  constructor(id: string) {
    super(id, { type: 'AddNode', title: 'Add Node', category: 'Math' })

    this.inputA = new NumberPort({
      id: 'inputA',
      kind: PortKindEnum.Number,
      direction: PortDirectionEnum.Input,
    })

    this.inputB = new NumberPort({
      id: 'inputB',
      kind: PortKindEnum.Number,
      direction: PortDirectionEnum.Input,
    })

    this.output = new NumberPort({
      id: 'output',
      kind: PortKindEnum.Number,
      direction: PortDirectionEnum.Output,
    })

    this.ports.set('inputA', this.inputA)
    this.ports.set('inputB', this.inputB)
    this.ports.set('output', this.output)
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const a = this.inputA.getValue()?.toNumber() ?? 0

    const b = this.inputB.getValue()?.toNumber() ?? 0
    const result = a + b
    this.output.setValue(result)

    return {
      status: 'completed',
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['output', this.output.getValue()]]),
    }
  }
}

describe('flow Execution', () => {
  it('should execute a simple flow', async () => {
    const flow = new Flow({ name: 'Test Flow' })

    const node1 = new AddNode('node1')
    const node2 = new AddNode('node2')

    // Initialize nodes
    await node1.initialize()
    await node2.initialize()

    // Set initial values
    node1.inputA.setValue(5)
    node1.inputB.setValue(10)

    flow.addNode(node1)
    flow.addNode(node2)

    // Connect node1 output to node2 inputA
    await flow.connectNodes(
      // 'node1',
      node1.id,
      node1.output.id,
      node2.id,
      node2.inputA.id,
    )

    // Set node2 inputB
    node2.inputB.setValue(20)

    // Execute the flow
    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)
    const executionEngine = new ExecutionEngine(flow, context, {
      execution: {
        maxConcurrency: 1,
        nodeTimeoutMs: 1000,
        flowTimeoutMs: 5000,
      },
    })
    await executionEngine.execute()

    // Verify results
    const resultNode1 = node1.output.getValue().toNumber()
    const resultNode2 = node2.output.getValue().toNumber()

    expect(resultNode1).toBe(15)
    expect(resultNode2).toBe(35)
  })

  it('should execute a complex flow with multiple nodes', async () => {
    const flow = new Flow({ name: 'Complex Test Flow' })

    // Create nodes
    const sourceNode1 = new AddNode('source1') // 5 + 10 = 15
    const sourceNode2 = new AddNode('source2') // 3 + 7 = 10
    const intermediateNode1 = new AddNode('intermediate1') // 15 + 10 = 25
    const intermediateNode2 = new AddNode('intermediate2') // 10 + 20 = 30
    const finalNode = new AddNode('final') // 25 + 30 = 55

    // Initialize all nodes
    await sourceNode1.initialize()
    await sourceNode2.initialize()
    await intermediateNode1.initialize()
    await intermediateNode2.initialize()
    await finalNode.initialize()

    // Add nodes to flow
    flow.addNode(sourceNode1)
    flow.addNode(sourceNode2)
    flow.addNode(intermediateNode1)
    flow.addNode(intermediateNode2)
    flow.addNode(finalNode)

    // Set initial values for source nodes
    sourceNode1.inputA.setValue(5)
    sourceNode1.inputB.setValue(10) // Result will be 15

    sourceNode2.inputA.setValue(3)
    sourceNode2.inputB.setValue(7) // Result will be 10

    // Set additional input for intermediateNode2
    intermediateNode2.inputB.setValue(20)

    // Connect nodes
    // sourceNode1.output -> intermediateNode1.inputA
    await flow.connectNodes('source1', 'output', 'intermediate1', 'inputA')

    // sourceNode2.output -> intermediateNode1.inputB
    await flow.connectNodes('source2', 'output', 'intermediate1', 'inputB')

    // sourceNode2.output -> intermediateNode2.inputA
    await flow.connectNodes('source2', 'output', 'intermediate2', 'inputA')

    // intermediateNode1.output -> finalNode.inputA
    await flow.connectNodes('intermediate1', 'output', 'final', 'inputA')

    // intermediateNode2.output -> finalNode.inputB
    await flow.connectNodes('intermediate2', 'output', 'final', 'inputB')

    // Execute the flow
    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)
    const executionEngine = new ExecutionEngine(flow, context, {
      execution: {
        maxConcurrency: 1,
        nodeTimeoutMs: 1000,
        flowTimeoutMs: 5000,
      },
    })

    await executionEngine.execute()

    // Verify results
    expect(sourceNode1.output.getValue().toNumber()).toBe(15) // 5 + 10
    expect(sourceNode2.output.getValue().toNumber()).toBe(10) // 3 + 7
    expect(intermediateNode1.output.getValue().toNumber()).toBe(25) // 15 + 10
    expect(intermediateNode2.output.getValue().toNumber()).toBe(30) // 10 + 20
    expect(finalNode.output.getValue().toNumber()).toBe(55) // 25 + 30
  })

  it('should pause execution at breakpoint and continue', async () => {
    const flow = new Flow({ name: 'Debug Flow Test' })

    // Create and initialize nodes
    const sourceNode1 = new AddNode('source1') // 5 + 10 = 15
    const sourceNode2 = new AddNode('source2') // 3 + 7 = 10
    const finalNode = new AddNode('final') // 15 + 10 = 25

    await sourceNode1.initialize()
    await sourceNode2.initialize()
    await finalNode.initialize()

    // Add nodes to flow
    flow.addNode(sourceNode1)
    flow.addNode(sourceNode2)
    flow.addNode(finalNode)

    // Set initial values
    sourceNode1.inputA.setValue(5)
    sourceNode1.inputB.setValue(10)
    sourceNode2.inputA.setValue(3)
    sourceNode2.inputB.setValue(7)

    // Connect nodes
    await flow.connectNodes('source1', 'output', 'final', 'inputA')
    await flow.connectNodes('source2', 'output', 'final', 'inputB')

    // Create execution context and engine with debug mode
    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)
    const executionEngine = new ExecutionEngine(flow, context, {
      execution: {
        maxConcurrency: 1,
        nodeTimeoutMs: 1000,
        flowTimeoutMs: 5000,
      },
      debug: true, // Enable debug mode
    })

    // Get debugger and set breakpoint on first node
    const dbg = executionEngine.getDebugger()
    expect(dbg).not.toBeNull()
    dbg!.addBreakpoint('source1')

    // Track execution events
    const executedNodes: string[] = []
    const breakpointHits: string[] = []
    let nodeAtBreakpoint: string | null = null

    executionEngine.getEventEmitter().on(ExecutionEventEnum.NODE_STARTED, (event) => {
      executedNodes.push(event.data.node.id)
    })

    executionEngine.getEventEmitter().on(ExecutionEventEnum.DEBUG_BREAKPOINT_HIT, (event) => {
      breakpointHits.push(event.data.node.id)
      nodeAtBreakpoint = event.data.node.id

      // Continue execution after a small delay
      setTimeout(() => {
        dbg!.continue()
      }, 100)
    })

    // Start execution
    const executionPromise = executionEngine.execute()

    // Wait for execution to complete
    await executionPromise

    // Verify execution order and breakpoint hits
    expect(executedNodes).toContain('source1')
    expect(executedNodes).toContain('source2')
    expect(executedNodes).toContain('final')
    expect(breakpointHits).toEqual(['source1']) // Only source1 should hit breakpoint

    // Verify results
    expect(sourceNode1.output.getValue().toNumber()).toBe(15) // 5 + 10
    expect(sourceNode2.output.getValue().toNumber()).toBe(10) // 3 + 7
    expect(finalNode.output.getValue().toNumber()).toBe(25) // 15 + 10
  })

  it('should step through execution', async () => {
    const flow = new Flow({ name: 'Debug Step Test' })

    // Create and initialize nodes
    const sourceNode = new AddNode('source') // 5 + 10 = 15
    const finalNode = new AddNode('final') // 15 + 5 = 20

    await sourceNode.initialize()
    await finalNode.initialize()

    // Add nodes to flow
    flow.addNode(sourceNode)
    flow.addNode(finalNode)

    // Set initial values
    sourceNode.inputA.setValue(5)
    sourceNode.inputB.setValue(10)
    finalNode.inputB.setValue(5)

    // Connect nodes
    await flow.connectNodes('source', 'output', 'final', 'inputA')

    // Create execution context and engine with debug mode
    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)
    const executionEngine = new ExecutionEngine(flow, context, {
      execution: {
        maxConcurrency: 1,
        nodeTimeoutMs: 1000,
        flowTimeoutMs: 5000,
      },
      debug: true,
    })

    // Get debugger and set initial pause
    const dbg = executionEngine.getDebugger()
    expect(dbg).not.toBeNull()
    dbg!.pause() // Start paused

    // Track execution events
    const executionSteps: Array<{ type: string, nodeId: string }> = []

    executionEngine.getEventEmitter().onAll((event) => {
      if (event.type === ExecutionEventEnum.DEBUG_BREAKPOINT_HIT) {
        executionSteps.push({
          type: 'started',
          nodeId: event.data.node.id,
        })

        // Step to next node after a small delay
        setTimeout(() => {
          dbg!.step()
        }, 100)
      } else if (event.type === ExecutionEventEnum.NODE_COMPLETED) {
        executionSteps.push({
          type: 'completed',
          nodeId: event.data.node.id,
        })
      }
    })

    // Start execution
    const executionPromise = executionEngine.execute()

    // Wait for execution to complete
    await executionPromise

    // Verify execution steps
    expect(executionSteps).toEqual([
      { type: 'started', nodeId: 'source' },
      { type: 'completed', nodeId: 'source' },
      { type: 'started', nodeId: 'final' },
      { type: 'completed', nodeId: 'final' },
    ])

    // Verify results
    expect(sourceNode.output.getValue().toNumber()).toBe(15) // 5 + 10
    expect(finalNode.output.getValue().toNumber()).toBe(20) // 15 + 5
  }, 1000)

  it('should step through complex execution with conditional branches', async () => {
    const flow = new Flow({ name: 'Complex Debug Flow' })

    // Create nodes for a more complex flow:
    // source1 (5 + 10 = 15) --\
    //                          --> merger1 (15 + 10 = 25) --\
    // source2 (3 + 7 = 10) --/                             \
    //                                                       --> final (25 + 30 = 55)
    // source3 (8 + 2 = 10) --\                             /
    //                          --> merger2 (10 + 20 = 30) --
    // source4 (15 + 5 = 20) -/

    const source1 = new AddNode('source1')
    const source2 = new AddNode('source2')
    const source3 = new AddNode('source3')
    const source4 = new AddNode('source4')
    const merger1 = new AddNode('merger1')
    const merger2 = new AddNode('merger2')
    const final = new AddNode('final')

    // Initialize all nodes
    const nodes = [source1, source2, source3, source4, merger1, merger2, final]
    await Promise.all(nodes.map(node => node.initialize()))

    // Add nodes to flow
    nodes.forEach(node => flow.addNode(node))

    // Set initial values
    source1.inputA.setValue(5)
    source1.inputB.setValue(10) // 15

    source2.inputA.setValue(3)
    source2.inputB.setValue(7) // 10

    source3.inputA.setValue(8)
    source3.inputB.setValue(2) // 10

    source4.inputA.setValue(15)
    source4.inputB.setValue(5) // 20

    // merger1 gets source1 output as inputA, source2 output as inputB
    await flow.connectNodes('source1', 'output', 'merger1', 'inputA')
    await flow.connectNodes('source2', 'output', 'merger1', 'inputB')

    // merger2 gets source3 output as inputA, source4 output as inputB
    await flow.connectNodes('source3', 'output', 'merger2', 'inputA')
    await flow.connectNodes('source4', 'output', 'merger2', 'inputB')

    // final gets merger1 output as inputA, merger2 output as inputB
    await flow.connectNodes('merger1', 'output', 'final', 'inputA')
    await flow.connectNodes('merger2', 'output', 'final', 'inputB')

    // Setup execution
    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)
    const executionEngine = new ExecutionEngine(flow, context, {
      execution: {
        maxConcurrency: 1, // Force sequential execution for predictable debugging
        nodeTimeoutMs: 1000,
        flowTimeoutMs: 5000,
      },
      debug: true,
    })

    const dbg = executionEngine.getDebugger()
    expect(dbg).not.toBeNull()
    dbg!.pause() // Start paused

    // Track execution events
    const executionSteps: Array<{
      event: string
      nodeId: string
      outputs?: Map<string, unknown>
    }> = []

    executionEngine.getEventEmitter().onAll((event) => {
      if (event.type === ExecutionEventEnum.DEBUG_BREAKPOINT_HIT) {
        executionSteps.push({
          event: 'paused',
          nodeId: event.data.node.id,
        })

        // Continue execution
        dbg!.step()
      } else if (event.type === ExecutionEventEnum.NODE_STARTED) {
        executionSteps.push({
          event: 'started',
          nodeId: event.data.node.id,
        })
      } else if (event.type === ExecutionEventEnum.NODE_COMPLETED) {
        executionSteps.push({
          event: 'completed',
          nodeId: event.data.node.id,
          outputs: new Map(
            event.data.node.getOutputs().map(port => [port.config.id, port.getValue()]),
          ),
        })
      }
    })

    // Start execution
    const executionPromise = executionEngine.execute()

    // Wait for execution to complete
    await executionPromise

    // Verify execution steps sequence
    // The exact sequence might vary due to parallel execution, but we can verify certain constraints
    const nodeSequence = executionSteps.map(step => step.nodeId)

    // Verify that source nodes execute before merger nodes
    function verifyExecutionOrder(sourceId: string, mergerId: string) {
      const sourceIndex = nodeSequence.findIndex(id => id === sourceId)
      const mergerIndex = nodeSequence.findIndex(id => id === mergerId)
      expect(sourceIndex).toBeLessThan(mergerIndex)
    }

    verifyExecutionOrder('source1', 'merger1')
    verifyExecutionOrder('source2', 'merger1')
    verifyExecutionOrder('source3', 'merger2')
    verifyExecutionOrder('source4', 'merger2')
    verifyExecutionOrder('merger1', 'final')
    verifyExecutionOrder('merger2', 'final')

    // Verify that each node appears in started -> paused -> completed sequence
    const nodesIds = ['source1', 'source2', 'source3', 'source4', 'merger1', 'merger2', 'final']
    nodesIds.forEach((nodeId) => {
      const nodeSteps = executionSteps.filter(step => step.nodeId === nodeId)
      expect(nodeSteps.map(step => step.event)).toEqual(['started', 'paused', 'completed'])
    })

    // Verify final results
    expect(source1.output.getValue().toNumber()).toBe(15) // 5 + 10
    expect(source2.output.getValue().toNumber()).toBe(10) // 3 + 7
    expect(source3.output.getValue().toNumber()).toBe(10) // 8 + 2
    expect(source4.output.getValue().toNumber()).toBe(20) // 15 + 5
    expect(merger1.output.getValue().toNumber()).toBe(25) // 15 + 10
    expect(merger2.output.getValue().toNumber()).toBe(30) // 10 + 20
    expect(final.output.getValue().toNumber()).toBe(55) // 25 + 30

    // Verify that we have the correct number of execution steps
    // For each node we expect: started, paused, completed = 3 events
    expect(executionSteps.length).toBe(nodesIds.length * 3)

    // Additional verification of the execution flow
    executionSteps.forEach((step) => {
      if (step.event === 'completed' && step.outputs) {
        const nodeId = step.nodeId
        const expectedOutput = {
          source1: new Decimal(15),
          source2: new Decimal(10),
          source3: new Decimal(10),
          source4: new Decimal(20),
          merger1: new Decimal(25),
          merger2: new Decimal(30),
          final: new Decimal(55),
        }[nodeId]

        const output = step.outputs.get('output')
        if (output && typeof output === 'object' && 'toNumber' in output) {
          expect(output).toStrictEqual(expectedOutput)
        }
      }
    })
  })

  it('should handle stop command during execution', async () => {
    const flow = new Flow({ name: 'Stop Test Flow' })

    // Create and initialize nodes
    const sourceNode = new AddNode('source')
    const finalNode = new AddNode('final')

    await sourceNode.initialize()
    await finalNode.initialize()

    // Add nodes to flow
    flow.addNode(sourceNode)
    flow.addNode(finalNode)

    // Set initial values
    sourceNode.inputA.setValue(5)
    sourceNode.inputB.setValue(10)
    finalNode.inputB.setValue(5)

    // Connect nodes
    await flow.connectNodes('source', 'output', 'final', 'inputA')

    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)
    const executionEngine = new ExecutionEngine(flow, context, {
      execution: {
        maxConcurrency: 1,
        nodeTimeoutMs: 1000,
        flowTimeoutMs: 5000,
      },
      debug: true,
    })

    const dbg = executionEngine.getDebugger()
    expect(dbg).not.toBeNull()

    // Track events
    const events: ExecutionEventEnum[] = []
    executionEngine.getEventEmitter().onAll((event) => {
      events.push(event.type)
    })

    // Call stop before execution
    dbg!.stop()

    // Execute and expect it to fail
    await expect(executionEngine.execute()).rejects.toThrow('Execution stopped by debugger')

    // Verify events
    expect(events).toContain(ExecutionEventEnum.FLOW_STARTED)
    expect(events).toContain(ExecutionEventEnum.FLOW_CANCELLED)
  })

  it('should handle abortController signal during execution', async () => {
    const flow = new Flow({ name: 'Stop Test Flow' })

    // Create and initialize nodes
    const sourceNode = new AddNode('source')
    const finalNode = new AddNode('final')

    await sourceNode.initialize()
    await finalNode.initialize()

    // Add nodes to flow
    flow.addNode(sourceNode)
    flow.addNode(finalNode)

    // Set initial values
    sourceNode.inputA.setValue(5)
    sourceNode.inputB.setValue(10)
    finalNode.inputB.setValue(5)

    // Connect nodes
    await flow.connectNodes('source', 'output', 'final', 'inputA')

    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)
    const executionEngine = new ExecutionEngine(flow, context, {
      execution: {
        maxConcurrency: 1,
        nodeTimeoutMs: 1000,
        flowTimeoutMs: 5000,
      },
    })

    // Track events
    const events: ExecutionEventEnum[] = []
    executionEngine.getEventEmitter().onAll((event) => {
      events.push(event.type)
    })

    // Call abort before execution
    abortController.abort('Execution stopped by abortController')

    // Execute and expect it to fail
    await expect(executionEngine.execute()).rejects.toThrow('Execution stopped by abortController')

    // Verify events
    expect(events).toContain(ExecutionEventEnum.FLOW_STARTED)
    expect(events).toContain(ExecutionEventEnum.FLOW_CANCELLED)
  })
})
