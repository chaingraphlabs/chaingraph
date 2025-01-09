import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@chaingraph/types'
import {
  BaseNode,
  NumberPort,
  PortDirectionEnum,
  PortKindEnum,
} from '@chaingraph/types'
import { Flow } from '@chaingraph/types/flow/flow'
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
    await flow.execute()

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
    await flow.execute()

    // Verify results
    expect(sourceNode1.output.getValue().toNumber()).toBe(15) // 5 + 10
    expect(sourceNode2.output.getValue().toNumber()).toBe(10) // 3 + 7
    expect(intermediateNode1.output.getValue().toNumber()).toBe(25) // 15 + 10
    expect(intermediateNode2.output.getValue().toNumber()).toBe(30) // 10 + 20
    expect(finalNode.output.getValue().toNumber()).toBe(55) // 25 + 30
  })
})
