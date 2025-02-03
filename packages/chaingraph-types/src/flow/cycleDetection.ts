import type { IEdge, IFlow } from '@chaingraph/types'

/**
 * Detect if a given flow has a cycle between its nodes.
 *
 * This function implements Kahn's topological sorting to detect a cycle in a directed graph.
 *
 * @param flow a flow to check.
 * @param edge if present, assume this edge is in the flow, without adding it to avoid side effects.
 */
export function hasCycle(flow: IFlow, edge?: IEdge): boolean {
  const inDegree: Record<string, number> = Object.fromEntries(
    flow.nodes.keys().map(id => [id, 0]),
  )

  if (edge) {
    inDegree[edge.targetNode.id]++
  }

  for (const [, edge] of flow.edges) {
    inDegree[edge.targetNode.id]++
  }

  const queue: string[] = Object.entries(inDegree)
    .filter(([, degree]) => degree === 0)
    .map(([node]) => node)

  let visited = 0
  while (queue.length > 0) {
    const node = queue.shift()!
    visited++

    const edges = [...flow.edges.values().filter(edge => edge.sourceNode.id === node)]
    if (edge && node === edge.sourceNode.id) {
      edges.push(edge)
    }

    for (const edge of edges) {
      const degree = --inDegree[edge.targetNode.id]
      if (degree === 0) {
        queue.push(edge.targetNode.id)
      }
    }
  }

  return visited !== flow.nodes.size
}
