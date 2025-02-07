import type { IEdge, IFlow, INode, NodeStatus } from '@badaitech/chaingraph-types'

export enum ExecutionEventEnum {
  // Flow events
  FLOW_SUBSCRIBED = 'flow:subscribed',
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
}

export interface ExecutionEventData {
  [ExecutionEventEnum.FLOW_SUBSCRIBED]: {
    flow: IFlow
  }
  [ExecutionEventEnum.FLOW_STARTED]: {
    flow: IFlow
  }
  [ExecutionEventEnum.FLOW_COMPLETED]: {
    flow: IFlow
    executionTime: number
  }
  [ExecutionEventEnum.FLOW_FAILED]: {
    flow: IFlow
    error: Error
    executionTime: number
  }
  [ExecutionEventEnum.FLOW_CANCELLED]: {
    flow: IFlow
    reason: string
    executionTime: number
  }
  [ExecutionEventEnum.FLOW_PAUSED]: {
    flow: IFlow
    reason: string
  }
  [ExecutionEventEnum.FLOW_RESUMED]: {
    flow: IFlow
  }
  [ExecutionEventEnum.NODE_STARTED]: {
    node: INode
  }
  [ExecutionEventEnum.NODE_COMPLETED]: {
    node: INode
    executionTime: number
  }
  [ExecutionEventEnum.NODE_FAILED]: {
    node: INode
    error: Error
    executionTime: number
  }
  [ExecutionEventEnum.NODE_SKIPPED]: {
    node: INode
    reason: string
  }
  [ExecutionEventEnum.NODE_STATUS_CHANGED]: {
    node: INode
    oldStatus: NodeStatus
    newStatus: NodeStatus
  }
  [ExecutionEventEnum.EDGE_TRANSFER_STARTED]: {
    edge: IEdge
  }
  [ExecutionEventEnum.EDGE_TRANSFER_COMPLETED]: {
    edge: IEdge
    transferTime: number
  }
  [ExecutionEventEnum.EDGE_TRANSFER_FAILED]: {
    edge: IEdge
    error: Error
  }
  [ExecutionEventEnum.DEBUG_BREAKPOINT_HIT]: {
    node: INode
  }
}

// Base event interface
export interface ExecutionEvent<T extends ExecutionEventEnum = ExecutionEventEnum> {
  index: number
  type: T
  timestamp: Date
  data: ExecutionEventData[T]
}

export class ExecutionEventImpl<T extends ExecutionEventEnum = ExecutionEventEnum> implements ExecutionEvent<T> {
  constructor(
    public index: number,
    public type: T,
    public timestamp: Date,
    public data: ExecutionEventData[T],
  ) {}
}

export type AllExecutionEvents = {
  [T in ExecutionEventEnum]: ExecutionEventImpl<T>
}[ExecutionEventEnum]

// Helper type to get event data type based on event type
export type EventDataType<T extends ExecutionEventEnum> = Extract<
  ExecutionEventImpl,
  { type: T }
>['data']
