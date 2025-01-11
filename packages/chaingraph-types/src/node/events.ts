import type { INode } from '@chaingraph/types/node/interface'
import type { NodeStatus } from './types'

/**
 * Base node event interface
 */
export interface NodeEvent {
  nodeId: string
  timestamp: Date
}

/**
 * Status change event
 */
export interface NodeStatusChangeEvent extends NodeEvent {
  type: 'status-change'
  node: INode
  oldStatus: NodeStatus
  newStatus: NodeStatus
}

/**
 * Node events mapped by event type
 */
export interface NodeEvents {
  'status-change': NodeStatusChangeEvent
}
