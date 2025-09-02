/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { SerializedEdge } from '../edge'
import type { FlowMetadata } from '../flow/types'
import type { INode, NodeStatus } from '../node'
import type { JSONValue } from '../utils/json'
import SuperJSON from 'superjson'

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
  /**
   * Node started running background actions, and is ready to stream the data through its edges.
   */
  NODE_BACKGROUNDED = 'node:backgrounded',
  NODE_COMPLETED = 'node:completed',
  NODE_FAILED = 'node:failed',
  NODE_SKIPPED = 'node:skipped',
  NODE_STATUS_CHANGED = 'node:status-changed',
  NODE_DEBUG_LOG_STRING = 'node:debug-log-string',

  // Edge events
  EDGE_TRANSFER_STARTED = 'edge:transfer-started',
  EDGE_TRANSFER_COMPLETED = 'edge:transfer-completed',
  EDGE_TRANSFER_FAILED = 'edge:transfer-failed',

  // Child execution events
  CHILD_EXECUTION_SPAWNED = 'child:spawned',
  CHILD_EXECUTION_COMPLETED = 'child:completed',
  CHILD_EXECUTION_FAILED = 'child:failed',

  // Debug events
  DEBUG_BREAKPOINT_HIT = 'debug:breakpoint-hit',
}

export interface ExecutionEventData {
  [ExecutionEventEnum.FLOW_SUBSCRIBED]: {
    flowMetadata: FlowMetadata
  }
  [ExecutionEventEnum.FLOW_STARTED]: {
    flowMetadata: FlowMetadata
  }
  [ExecutionEventEnum.FLOW_COMPLETED]: {
    flowMetadata: FlowMetadata
    executionTime: number
  }
  [ExecutionEventEnum.FLOW_FAILED]: {
    flowMetadata: FlowMetadata
    error: Error
    executionTime: number
  }
  [ExecutionEventEnum.FLOW_CANCELLED]: {
    flowMetadata: FlowMetadata
    reason: string
    executionTime: number
  }
  [ExecutionEventEnum.FLOW_PAUSED]: {
    flowMetadata: FlowMetadata
    reason: string
  }
  [ExecutionEventEnum.FLOW_RESUMED]: {
    flowMetadata: FlowMetadata
  }
  [ExecutionEventEnum.NODE_STARTED]: {
    node: INode
  }
  [ExecutionEventEnum.NODE_BACKGROUNDED]: {
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
    nodeId: string
    reason: string
  }
  [ExecutionEventEnum.NODE_STATUS_CHANGED]: {
    nodeId: string
    oldStatus: NodeStatus
    newStatus: NodeStatus
  }
  [ExecutionEventEnum.NODE_DEBUG_LOG_STRING]: {
    nodeId: string
    log: string
  }
  [ExecutionEventEnum.EDGE_TRANSFER_STARTED]: {
    serializedEdge: SerializedEdge
  }
  [ExecutionEventEnum.EDGE_TRANSFER_COMPLETED]: {
    serializedEdge: SerializedEdge
    transferTime: number
  }
  [ExecutionEventEnum.EDGE_TRANSFER_FAILED]: {
    serializedEdge: SerializedEdge
    error: Error
  }
  [ExecutionEventEnum.DEBUG_BREAKPOINT_HIT]: {
    node: INode
  }
  [ExecutionEventEnum.CHILD_EXECUTION_SPAWNED]: {
    parentExecutionId: string
    childExecutionId: string
    eventName: string
    eventData: any // TODO: specific type?
  }
  [ExecutionEventEnum.CHILD_EXECUTION_COMPLETED]: {
    parentExecutionId: string
    childExecutionId: string
    eventName: string
  }
  [ExecutionEventEnum.CHILD_EXECUTION_FAILED]: {
    parentExecutionId: string
    childExecutionId: string
    eventName: string
    error: Error
  }
}

// TODO: add discriminated union with serialize/deserialize functions for event data

// Base event interface
export interface ExecutionEvent<T extends ExecutionEventEnum = ExecutionEventEnum> {
  index: number
  type: T
  timestamp: Date
  data: ExecutionEventData[T]

  serialize: () => JSONValue
  deserialize: (v: JSONValue) => ExecutionEventImpl<T>
}

export class ExecutionEventImpl<T extends ExecutionEventEnum = ExecutionEventEnum> implements ExecutionEvent<T> {
  constructor(
    public index: number,
    public type: T,
    public timestamp: Date,
    public data: ExecutionEventData[T],
  ) { }

  serialize(): JSONValue {
    return {
      index: this.index,
      type: this.type,
      timestamp: this.timestamp.toISOString(),
      data: SuperJSON.serialize(this.data),
    }
  }

  deserialize(v: JSONValue): ExecutionEventImpl<T> {
    if (typeof v !== 'object' || v === null) {
      throw new Error('Invalid serialized ExecutionEvent')
    }
    const obj = v as { index: number, type: T, timestamp: string, data: any }
    this.index = obj.index
    this.type = obj.type
    this.timestamp = new Date(obj.timestamp)
    this.data = SuperJSON.deserialize(obj.data) as ExecutionEventData[T]
    return this
  }

  static deserializeStatic<T extends ExecutionEventEnum = ExecutionEventEnum>(v: JSONValue): ExecutionEventImpl<T> {
    if (typeof v !== 'object' || v === null) {
      throw new Error('Invalid serialized ExecutionEvent')
    }
    const obj = v as { index: number, type: T, timestamp: string, data: any }
    return new ExecutionEventImpl<T>(
      obj.index,
      obj.type,
      new Date(obj.timestamp),
      SuperJSON.deserialize(obj.data) as ExecutionEventData[T],
    )
  }
}

export type AllExecutionEvents = {
  [T in ExecutionEventEnum]: ExecutionEventImpl<T>
}[ExecutionEventEnum]

// Helper type to get event data type based on event type
export type EventDataType<T extends ExecutionEventEnum> = Extract<
  ExecutionEventImpl,
  { type: T }
>['data']
