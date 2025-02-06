import type { NodeExecutionResult } from '@chaingraph/types'
import { BaseNode, ExecutionContext, ExecutionEngine, Flow, MultiChannel, Node, NodeStatus, PortDirection, PortKind, PortStreamInput, PortStreamOutput } from '@chaingraph/types'
import { describe, expect, it } from 'vitest'

@Node({})
class AsyncNode extends BaseNode {
  @PortStreamOutput({
    direction: PortDirection.Output,
    valueType: {
      kind: PortKind.Number,
    },
  })
  numbers: MultiChannel<number> = new MultiChannel()

  constructor(id: string, private countFn: () => Iterable<number>) {
    super(id)
  }

  async execute(): Promise<NodeExecutionResult> {
    return {
      backgroundActions: [this.count.bind(this)],
    }
  }

  private async count(): Promise<void> {
    for (const number of this.countFn()) {
      await Promise.resolve()
      this.numbers.send(number)
    }

    this.numbers.close()
  }
}

@Node({})
class MergerNode extends BaseNode {
  @PortStreamInput({
    direction: PortDirection.Input,
    valueType: {
      kind: PortKind.Number,
    },
  })
  inputA: MultiChannel<number> = new MultiChannel<number>()

  @PortStreamInput({
    direction: PortDirection.Input,
    valueType: {
      kind: PortKind.Number,
    },
  })
  inputB: MultiChannel<number> = new MultiChannel<number>()

  @PortStreamOutput({
    direction: PortDirection.Output,
    valueType: {
      kind: PortKind.Number,
    },
  })
  output: MultiChannel<number> = new MultiChannel()

  async execute(): Promise<NodeExecutionResult> {
    return {
      backgroundActions: [
        this.processStream.bind(this, this.inputA),
        this.processStream.bind(this, this.inputB),
      ],
    }
  }

  private async processStream(stream: MultiChannel<number>): Promise<void> {
    for await (const number of stream) {
      await Promise.resolve()
      this.output.send(number)
    }

    this.close()
  }

  private close() {
    if (this.inputA.isChannelClosed() && this.inputB.isChannelClosed()) {
      this.output.close()
    }
  }
}

@Node({})
class FailingNode extends BaseNode {
  async execute(): Promise<NodeExecutionResult> {
    return {
      backgroundActions: [
        this.reject,
        this.resolve,
      ],
    }
  }

  private async resolve(): Promise<void> {
    return Promise.resolve()
  }

  private async reject(): Promise<void> {
    throw new Error('Simulated failure')
  }
}

describe('flow with async nodes', () => {
  it('supports background actions', async () => {
    const flow = new Flow()

    const node = new AsyncNode('async-node', () => Array.from({ length: 100 })
      .map((_, i) => i))

    flow.addNode(node)

    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)
    const executionEngine = new ExecutionEngine(flow, context)
    await executionEngine.execute()

    const actual = await Array.fromAsync(node.numbers)
    const expected = Array.from({ length: 100 }).map((_, i) => i)

    expect(actual).toEqual(expected)
  })

  it('supports multiple background actions from several nodes', async () => {
    const flow = new Flow()

    const evenNumbers = Array.from({ length: 100 })
      .map((_, i) => i * 2)

    const evenNode = new AsyncNode('even async-node', () => evenNumbers)
    evenNode.initialize()
    flow.addNode(evenNode)

    const oddNumbers = Array.from({ length: 100 })
      .map((_, i) => i * 2 + 1)

    const oddNode = new AsyncNode('odd async-node', () => oddNumbers)
    oddNode.initialize()
    flow.addNode(oddNode)

    const mergerNode = new MergerNode('merger-node')
    mergerNode.initialize()
    flow.addNode(mergerNode)

    await flow.connectPorts(
      evenNode.id,
      evenNode.getOutputs()[0].config.id,
      mergerNode.id,
      mergerNode.getInputs()[0].config.id,
    )

    await flow.connectPorts(
      oddNode.id,
      oddNode.getOutputs()[0].config.id,
      mergerNode.id,
      mergerNode.getInputs()[1].config.id,
    )

    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)
    const executionEngine = new ExecutionEngine(flow, context)
    await executionEngine.execute()

    const actual = await Array.fromAsync(mergerNode.output)
    expect(actual).toEqual(expect.arrayContaining(evenNumbers))
    expect(actual).toEqual(expect.arrayContaining(oddNumbers))
  })

  it('sets node status to error for an exception in background action', async () => {
    const flow = new Flow()

    const node = new FailingNode('failing-node')
    flow.addNode(node)

    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)
    const executionEngine = new ExecutionEngine(flow, context)

    await expect(executionEngine.execute.bind(executionEngine)).rejects.toThrow('Simulated failure')
    expect(node.status).toBe(NodeStatus.Error)
  })
})
