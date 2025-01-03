import type { NodeExecutionResult, NodeStatus } from './types'

/**
 * Node event types
 */
export type NodeEventType =
  | 'status-change'
  | 'port-value-change'
  | 'execution-start'
  | 'execution-complete'
  | 'error'

/**
 * Base node event interface
 */
export interface NodeEvent {
  type: NodeEventType
  nodeId: string
  timestamp: Date
}

/**
 * Status change event
 */
export interface NodeStatusChangeEvent extends NodeEvent {
  type: 'status-change'
  oldStatus: NodeStatus
  newStatus: NodeStatus
}

/**
 * Port value change event
 */
export interface NodePortValueChangeEvent extends NodeEvent {
  type: 'port-value-change'
  portId: string
  oldValue: unknown
  newValue: unknown
}

/**
 * Execution complete event
 */
export interface NodeExecutionCompleteEvent extends NodeEvent {
  type: 'execution-complete'
  result: NodeExecutionResult
}

/**
 * Node event union type
 */
export type NodeEvents =
  | NodeStatusChangeEvent
  | NodePortValueChangeEvent
  | NodeExecutionCompleteEvent
