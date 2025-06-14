/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeExecutionResult } from '@badaitech/chaingraph-types'
import type { ExecutionEventImpl } from '../../flow/execution-events'
import {
  BaseNode,
  ExecutionContext,
  ExecutionEngine,
  ExecutionEventEnum,
  Flow,
  MultiChannel,
  Node,
  NodeStatus,
  PortDirection,
  PortStream,
} from '@badaitech/chaingraph-types'
import { describe, expect, it } from 'vitest'

@Node({ type: 'AsyncNode' })
class AsyncNode extends BaseNode {
  @PortStream({
    direction: PortDirection.Output,
    itemConfig: {
      type: 'number',
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

@Node({ type: 'MergerNode' })
class MergerNode extends BaseNode {
  @PortStream({
    direction: PortDirection.Input,
    itemConfig: {
      type: 'number',
    },
  })
  inputA: MultiChannel<number> = new MultiChannel<number>()

  @PortStream({
    direction: PortDirection.Input,
    itemConfig: {
      type: 'number',
    },
  })
  inputB: MultiChannel<number> = new MultiChannel<number>()

  @PortStream({
    direction: PortDirection.Output,
    itemConfig: {
      type: 'number',
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

@Node({ type: 'FailingNode' })
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

@Node({ type: 'ManualResolveNode' })
class ManualResolveNode extends BaseNode {
  get resolve1(): () => void {
    return this._resolve1
  }

  private _resolve1!: () => void

  get resolve2(): () => void {
    return this._resolve2
  }

  private _resolve2!: () => void

  async execute(): Promise<NodeExecutionResult> {
    return {
      backgroundActions: [
        () =>
          new Promise(resolve => this._resolve1 = resolve),
        () =>
          new Promise(resolve => this._resolve2 = resolve),
      ],
    }
  }
}

describe('flow with async nodes', () => {
  it('supports background actions', async () => {
    const flow = new Flow()

    const node = new AsyncNode(
      'async-node',
      () => Array.from({ length: 100 })
        .map((_, i) => i),
    )
    node.initialize()

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
      evenNode.getOutputs()[3].id,
      mergerNode.id,
      mergerNode.getInputs()[1].id,
    )

    await flow.connectPorts(
      oddNode.id,
      oddNode.getOutputs()[3].id,
      mergerNode.id,
      mergerNode.getInputs()[2].id,
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
    node.initialize()

    flow.addNode(node)

    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)
    const executionEngine = new ExecutionEngine(flow, context)

    const events: ExecutionEventImpl[] = []
    executionEngine.onAll((event) => {
      events.push(event)
    })

    await executionEngine.execute()

    // TODO: finish test
    // console.log(events)

    // await expect(executionEngine.execute.bind(executionEngine)).rejects.toThrow('Simulated failure')
    // expect(node.status).toBe(NodeStatus.Error)
  })

  it(`has ${NodeStatus.Backgrounding} status, and then ${NodeStatus.Completed} after`, async () => {
    const flow = new Flow()

    const node = new ManualResolveNode('manual-resolve-node')
    node.initialize()

    flow.addNode(node)

    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)
    const executionEngine = new ExecutionEngine(flow, context)
    const executionPromise = executionEngine.execute()

    await expect.poll(() => node.status).toBe(NodeStatus.Backgrounding)

    node.resolve1()
    expect(node.status).toBe(NodeStatus.Backgrounding)

    node.resolve2()
    await expect.poll(() => node.status).toBe(NodeStatus.Completed)

    await expect(executionPromise).resolves.not.toThrow()
  })

  it(`emits events when node status transitions to ${NodeStatus.Backgrounding}`, async () => {
    const flow = new Flow()

    const node = new AsyncNode(
      'async-node',
      () => Array.from({ length: 100 })
        .map((_, i) => i),
    )
    node.initialize()

    flow.addNode(node)

    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)
    const executionEngine = new ExecutionEngine(flow, context)

    const transitionToBackground = new Promise((resolve) => {
      executionEngine.on(ExecutionEventEnum.NODE_BACKGROUNDED, resolve)
    })

    const transitionToCompleted = new Promise((resolve) => {
      executionEngine.on(ExecutionEventEnum.NODE_COMPLETED, resolve)
    })

    await expect(executionEngine.execute()).resolves.not.toThrow()

    await expect(transitionToBackground).resolves.not.toThrow()
    await expect(transitionToCompleted).resolves.not.toThrow()
  })
})
