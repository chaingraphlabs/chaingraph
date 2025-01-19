import type { NodeState } from '@/store'
import type { INode } from '@chaingraph/types'

// Helpers for converting between live objects and state
export function nodeToState(node: INode): NodeState {
  return {
    id: node.id,
    metadata: node.metadata,
    status: node.status,
    portIds: Array.from(node.ports.keys()),
  }
}
