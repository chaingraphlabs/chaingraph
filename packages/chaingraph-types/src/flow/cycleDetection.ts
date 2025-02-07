/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'

/**
 * Minimal data to represent an edge between two nodes
 * from point of view of {@link hasCycle} function.
 */
interface Edge {
  targetNode: INode
  sourceNode: INode
}

/**
 * Detect if a given flow has a cycle between its nodes.
 *
 * This function implements Kahn's topological sorting to detect a cycle in a directed graph.
 *
 * @param nodes the set of flow's nodes.
 * @param edges the set of flow's edges.
 * @param edge if present, assume this edge is in the flow, without adding it to avoid side effects.
 */
export function hasCycle(nodes: Iterable<INode>, edges: Iterable<Edge>, edge?: Edge): boolean {
  const allEdges = Array.from(edges)

  const inDegree: Record<string, number> = Object.fromEntries(
    Iterator.from(nodes).map(node => [node.id, 0]),
  )

  if (edge) {
    inDegree[edge.targetNode.id]++
  }

  for (const edge of allEdges) {
    inDegree[edge.targetNode.id]++
  }

  const queue: string[] = Object.entries(inDegree)
    .filter(([, degree]) => degree === 0)
    .map(([node]) => node)

  let visited = 0
  while (queue.length > 0) {
    const node = queue.shift()!
    visited++

    const outgoingEdges = [...allEdges.filter(edge => edge.sourceNode.id === node)]
    if (edge && node === edge.sourceNode.id) {
      outgoingEdges.push(edge)
    }

    for (const edge of outgoingEdges) {
      const degree = --inDegree[edge.targetNode.id]
      if (degree === 0) {
        queue.push(edge.targetNode.id)
      }
    }
  }

  return visited !== Object.keys(inDegree).length
}
