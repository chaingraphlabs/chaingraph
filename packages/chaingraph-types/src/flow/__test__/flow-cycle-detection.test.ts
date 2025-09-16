/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort, NodeExecutionResult } from '../..'
import { describe, expect, it } from 'vitest'
import { Node } from '../..'
import { AnyPort } from '../..'
import { BaseNode, Edge, Flow } from '../..'
import { hasCycle } from '../cycleDetection'

@Node({
  type: 'TestNode',
  title: 'Test Node',
  description: 'A simple test node',
})
class TestNode extends BaseNode {
  async execute(): Promise<NodeExecutionResult> {
    return {}
  }
}

const port = new AnyPort({
  type: 'any',
}) as IPort<any>

describe('detect cycle', async () => {
  it('shouldn\'t detect cycle in an empty graph', async () => {
    const flow = await parseFlow('')

    expect(hasCycle(flow.nodes.values(), flow.edges.values())).toBe(false)
  })

  it('shouldn\'t detect cycle in a single node graph', async () => {
    const flow = await parseFlow('node1')

    expect(hasCycle(flow.nodes.values(), flow.edges.values())).toBe(false)
  })

  it('should detect cycle in a single node with self-loop', async () => {
    const flow = await parseFlow('node1 -> node1')

    expect(hasCycle(flow.nodes.values(), flow.edges.values())).toBe(true)
  })

  it('should detect cycle in a single node with candidate edge for a self-loop', async () => {
    const flow = await parseFlow('node1')

    const edge = new Edge('1 -> 1', flow.nodes.get('node1')!, port, flow.nodes.get('node1')!, port)
    expect(hasCycle(flow.nodes.values(), flow.edges.values(), edge)).toBe(true)
  })

  it('shouldn\'t detect cycle in a two node linear graph', async () => {
    const flow = await parseFlow('node1 -> node2')

    expect(hasCycle(flow.nodes.values(), flow.edges.values())).toBe(false)
  })

  it('shouldn\'t detect cycle in a two node linear graph reverse', async () => {
    const flow = await parseFlow(`node1
node2
node2 -> node1`)

    expect(hasCycle(flow.nodes.values(), flow.edges.values())).toBe(false)
  })

  it('should detect cycle in a two node bidirectional graph', async () => {
    const flow = await parseFlow(`node1 -> node2
node2 -> node1`)

    expect(hasCycle(flow.nodes.values(), flow.edges.values())).toBe(true)
  })

  it('should detect cycle in a two node bidirectional graph through a candidate edge', async () => {
    const flow = await parseFlow('node1 -> node2')

    const edge = new Edge('2 -> 1', flow.nodes.get('node2')!, port, flow.nodes.get('node1')!, port)
    expect(hasCycle(flow.nodes.values(), flow.edges.values(), edge)).toBe(true)
  })

  it('shouldn\'t detect cycle in a three node linear graph', async () => {
    const flow = await parseFlow(`node1 -> node2
node2 -> node3`)

    expect(hasCycle(flow.nodes.values(), flow.edges.values())).toBe(false)
  })

  it('should detect cycle in a three node triangle graph', async () => {
    const flow = await parseFlow(`node1 -> node2
node2 -> node3
node3 -> node1`)

    expect(hasCycle(flow.nodes.values(), flow.edges.values())).toBe(true)
  })

  it('shouldn\'t detect cycle in a rhombus graph', async () => {
    const flow = await parseFlow(`node1 -> node2
node1 -> node3
node2 -> node4
node3 -> node4`)

    expect(hasCycle(flow.nodes.values(), flow.edges.values())).toBe(false)
  })

  it('should detect cycle in a disconnected two node bidirectional subgraph', async () => {
    const flow = await parseFlow(`node1 -> node2
node3 -> node4
node4 -> node3`)

    expect(hasCycle(flow.nodes.values(), flow.edges.values())).toBe(true)
  })

  it('should detect some cycle in a graph with multiple cycles', async () => {
    const flow = await parseFlow(`node1 -> node2
node1 -> node3
node2 -> node4
node2 -> node5
node3 -> node6
node4 -> node1
node5 -> node6
node6 -> node3
`)

    expect(hasCycle(flow.nodes.values(), flow.edges.values())).toBe(true)
  })
})

async function parseFlow(input: string): Promise<Flow> {
  const flow = new Flow()

  for (const edge of input.split('\n')) {
    const [from, to] = edge.split(' -> ', 2)

    if (from && !flow.nodes.has(from)) {
      await flow.addNode(new TestNode(from), true)
    }

    if (to && !flow.nodes.has(to)) {
      await flow.addNode(new TestNode(to), true)
    }

    if (from && to) {
      await flow.addEdge(new Edge(edge, flow.nodes.get(from)!, port, flow.nodes.get(to)!, port))
    }
  }

  return flow
}
