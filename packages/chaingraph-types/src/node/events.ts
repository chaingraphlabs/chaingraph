import type { NodeExecutionResult } from './execution'
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
  oldStatus: NodeStatus
  newStatus: NodeStatus
}

/**
 * Execution start event
 */
export interface NodeExecutionStartEvent extends NodeEvent {
  type: 'execution-start'
}

/**
 * Execution complete event
 */
export interface NodeExecutionCompleteEvent extends NodeEvent {
  type: 'execution-complete'
  result: NodeExecutionResult
}

/**
 * Node error event
 */
export interface NodeErrorEvent extends NodeEvent {
  type: 'error'
  error: Error
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
 * Node events mapped by event type
 */
export interface NodeEvents {
  'status-change': NodeStatusChangeEvent
  'execution-start': NodeExecutionStartEvent
  'execution-complete': NodeExecutionCompleteEvent
  'error': NodeErrorEvent
  'port-value-change': NodePortValueChangeEvent
}
