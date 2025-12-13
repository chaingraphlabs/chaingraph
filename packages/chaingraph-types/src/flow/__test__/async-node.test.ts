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

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Explicitly resolve the stream port - downstream can start reading
    context.resolvePort('numbers')

    // Stream in main loop (no background actions)
    for (const number of this.countFn()) {
      await Promise.resolve()
      this.numbers.send(number)
    }

    this.numbers.close()
    return {}
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
  output: MultiChannel<number> = new MultiChannel<number>()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Explicitly resolve output stream - downstream can start reading
    context.resolvePort('output')

    // Process both streams in parallel in main loop
    await Promise.all([
      this.processStream(this.inputA),
      this.processStream(this.inputB),
    ])

    return {}
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
    // Execute both operations, one will fail
    await Promise.all([
      this.resolve(),
      this.reject(),
    ])
    return {}
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
    flow.setIsDisabledPropagationEvents(true)

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
    const executionEngine = new ExecutionEngine(flow, context, {
      execution: {
        maxConcurrency: 5,
      },
    })
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

  it('completes after streaming finishes', async () => {
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

    const transitionToCompleted = new Promise((resolve) => {
      executionEngine.on(ExecutionEventEnum.NODE_COMPLETED, resolve)
    })

    await expect(executionEngine.execute()).resolves.not.toThrow()

    await expect(transitionToCompleted).resolves.not.toThrow()
  })
})
