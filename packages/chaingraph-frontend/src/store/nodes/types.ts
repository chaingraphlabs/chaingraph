import type { NodeMetadata, NodeStatus } from '@chaingraph/types'

// State types
export interface NodeState {
  id: string
  metadata: NodeMetadata
  status: NodeStatus
  portIds: string[]
}

// Event types
export interface AddNodeEvent {
  flowId: string
  nodeType: string
  position: {
    x: number
    y: number
  }
  metadata?: {
    title?: string
    description?: string
    category?: string
    tags?: string[]
  }
}

export interface UpdateNodeEvent {
  id: string
  data: Partial<NodeState>
}
