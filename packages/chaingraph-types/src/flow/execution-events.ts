import type { IEdge, IFlow, INode, NodeStatus } from '@chaingraph/types'
import type { ExecutionContext } from './execution-context'

export enum ExecutionEventEnum {
  // Flow events
  FLOW_STARTED = 'flow:started',
  FLOW_COMPLETED = 'flow:completed',
  FLOW_FAILED = 'flow:failed',
  FLOW_CANCELLED = 'flow:cancelled',
  FLOW_PAUSED = 'flow:paused',
  FLOW_RESUMED = 'flow:resumed',

  // Node events
  NODE_STARTED = 'node:started',
  NODE_COMPLETED = 'node:completed',
  NODE_FAILED = 'node:failed',
  NODE_SKIPPED = 'node:skipped',
  NODE_STATUS_CHANGED = 'node:status-changed',

  // Edge events
  EDGE_TRANSFER_STARTED = 'edge:transfer-started',
  EDGE_TRANSFER_COMPLETED = 'edge:transfer-completed',
  EDGE_TRANSFER_FAILED = 'edge:transfer-failed',

  // Debug events
  DEBUG_BREAKPOINT_HIT = 'debug:breakpoint-hit',

  // Special event type to listen to all events
  ALL = '*',
}

// Base event interface
export interface BaseExecutionEvent {
  // Unique incrementing index of the event
  index: number

  // Event type from enum
  type: ExecutionEventEnum

  // Timestamp when event occurred
  timestamp: Date

  // Execution context reference
  context: ExecutionContext
}

// Flow Events
export interface FlowStartedEvent extends BaseExecutionEvent {
  type: ExecutionEventEnum.FLOW_STARTED
  data: {
    flow: IFlow
  }
}

export interface FlowCompletedEvent extends BaseExecutionEvent {
  type: ExecutionEventEnum.FLOW_COMPLETED
  data: {
    flow: IFlow
    executionTime: number // ms
  }
}

export interface FlowFailedEvent extends BaseExecutionEvent {
  type: ExecutionEventEnum.FLOW_FAILED
  data: {
    flow: IFlow
    error: Error
    executionTime: number
  }
}

export interface FlowCancelledEvent extends BaseExecutionEvent {
  type: ExecutionEventEnum.FLOW_CANCELLED
  data: {
    flow: IFlow
    reason: string
    executionTime: number
  }
}

export interface FlowPausedEvent extends BaseExecutionEvent {
  type: ExecutionEventEnum.FLOW_PAUSED
  data: {
    flow: IFlow
    reason: string
  }
}

export interface FlowResumedEvent extends BaseExecutionEvent {
  type: ExecutionEventEnum.FLOW_RESUMED
  data: {
    flow: IFlow
  }
}

// Node Events
export interface NodeStartedEvent extends BaseExecutionEvent {
  type: ExecutionEventEnum.NODE_STARTED
  data: {
    node: INode
  }
}

export interface NodeCompletedEvent extends BaseExecutionEvent {
  type: ExecutionEventEnum.NODE_COMPLETED
  data: {
    node: INode
    executionTime: number
  }
}

export interface NodeFailedEvent extends BaseExecutionEvent {
  type: ExecutionEventEnum.NODE_FAILED
  data: {
    node: INode
    error: Error
    executionTime: number
  }
}

export interface NodeSkippedEvent extends BaseExecutionEvent {
  type: ExecutionEventEnum.NODE_SKIPPED
  data: {
    node: INode
    reason: string
  }
}

export interface NodeStatusChangedEvent extends BaseExecutionEvent {
  type: ExecutionEventEnum.NODE_STATUS_CHANGED
  data: {
    node: INode
    oldStatus: NodeStatus
    newStatus: NodeStatus
  }
}

// Edge Events
export interface EdgeTransferStartedEvent extends BaseExecutionEvent {
  type: ExecutionEventEnum.EDGE_TRANSFER_STARTED
  data: {
    edge: IEdge
  }
}

export interface EdgeTransferCompletedEvent extends BaseExecutionEvent {
  type: ExecutionEventEnum.EDGE_TRANSFER_COMPLETED
  data: {
    edge: IEdge
    transferTime: number
  }
}

export interface EdgeTransferFailedEvent extends BaseExecutionEvent {
  type: ExecutionEventEnum.EDGE_TRANSFER_FAILED
  data: {
    edge: IEdge
    error: Error
  }
}

// Debug Events
export interface DebugBreakpointHitEvent extends BaseExecutionEvent {
  type: ExecutionEventEnum.DEBUG_BREAKPOINT_HIT
  data: {
    node: INode
  }
}

// Union type of all possible events
export type ExecutionEvent =
  | FlowStartedEvent
  | FlowCompletedEvent
  | FlowFailedEvent
  | FlowCancelledEvent
  | FlowPausedEvent
  | FlowResumedEvent
  | NodeStartedEvent
  | NodeCompletedEvent
  | NodeFailedEvent
  | NodeSkippedEvent
  | NodeStatusChangedEvent
  | EdgeTransferStartedEvent
  | EdgeTransferCompletedEvent
  | EdgeTransferFailedEvent
  | DebugBreakpointHitEvent

// Helper type to get event data type based on event type
export type EventDataType<T extends ExecutionEventEnum> = Extract<
  ExecutionEvent,
  { type: T }
>['data']

// Type-safe event emitter interface
export interface ExecutionEventEmitter {
  emit: <T extends ExecutionEventEnum>(
    type: T,
    data: EventDataType<T>
  ) => void

  on: <T extends ExecutionEventEnum>(
    type: T,
    handler: (event: Extract<ExecutionEvent, { type: T }>) => void
  ) => void

  off: <T extends ExecutionEventEnum>(
    type: T,
    handler: (event: Extract<ExecutionEvent, { type: T }>) => void
  ) => void
}
