import type { NodeMetadata, NodeStatus } from '@chaingraph/types'
import type { NodeUIMetadata, Position } from '@chaingraph/types/node/node-ui.ts'

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

export interface UpdateNodeUIEvent {
  flowId: string
  nodeId: string
  ui?: NodeUIMetadata
  version: number
}

export interface UpdateNodePosition {
  flowId: string
  nodeId: string
  position: Position
  version: number
}

export interface UpdateNodeParent {
  flowId: string
  nodeId: string
  parentNodeId?: string
  position: Position
  version: number
}
