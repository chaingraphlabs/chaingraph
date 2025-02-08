/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeStatus } from '@badaitech/chaingraph-types/node/node-enums'
import type { NodeUIMetadata, Position } from '@badaitech/chaingraph-types/node/node-ui'
import type { IPort } from '@badaitech/chaingraph-types/port'

/**
 * Enum for all possible node events
 */
export enum NodeEventType {
  // Status events
  StatusChange = 'node:status-change',

  ParentChange = 'node:parent-change',

  // UI events
  UIPositionChange = 'node:ui:position-change',
  UIDimensionsChange = 'node:ui:dimensions-change',
  UIStateChange = 'node:ui:state-change',
  UIStyleChange = 'node:ui:style-change',

  // Port events
  PortUpdate = 'node:port-update',
}

/**
 * Base interface for all node events
 */
export interface NodeEventBase {
  type: NodeEventType
  nodeId: string
  timestamp: Date
  version: number
}

/**
 * Event emitted when node parent changes
 */
export interface NodeParentChangeEvent extends NodeEventBase {
  type: NodeEventType.ParentChange
  oldParentNodeId?: string
  newParentNodeId?: string
  oldPosition?: Position
  newPosition: Position
}

/**
 * Event emitted when node status changes
 */
export interface NodeStatusChangeEvent extends NodeEventBase {
  type: NodeEventType.StatusChange
  oldStatus: NodeStatus
  newStatus: NodeStatus
}

/**
 * Event emitted when node position changes
 */
export interface NodeUIPositionChangeEvent extends NodeEventBase {
  type: NodeEventType.UIPositionChange
  oldPosition?: Position
  newPosition: Position
}

/**
 * Event emitted when node dimensions change
 */
export interface NodeUIDimensionsChangeEvent extends NodeEventBase {
  type: NodeEventType.UIDimensionsChange
  oldDimensions: NodeUIMetadata['dimensions']
  newDimensions: NodeUIMetadata['dimensions']
}

/**
 * Event emitted when node UI state changes
 */
export interface NodeUIStateChangeEvent extends NodeEventBase {
  type: NodeEventType.UIStateChange
  oldState: NodeUIMetadata['state']
  newState: NodeUIMetadata['state']
}

/**
 * Event emitted when node style changes
 */
export interface NodeUIStyleChangeEvent extends NodeEventBase {
  type: NodeEventType.UIStyleChange
  oldStyle: NodeUIMetadata['style']
  newStyle: NodeUIMetadata['style']
}

/**
 * Event emitted when a port is updated
 */
export interface PortUpdateEvent extends NodeEventBase {
  type: NodeEventType.PortUpdate
  portId: string
  port: IPort
}

/**
 * Union type of all possible node events
 */
export type NodeEvent =
  | NodeEventBase
  | NodeStatusChangeEvent
  | NodeParentChangeEvent
  | NodeUIPositionChangeEvent
  | NodeUIDimensionsChangeEvent
  | NodeUIStateChangeEvent
  | NodeUIStyleChangeEvent
  | PortUpdateEvent

export interface EventTypeToInterface {
  [NodeEventType.StatusChange]: NodeStatusChangeEvent
  [NodeEventType.ParentChange]: NodeParentChangeEvent
  [NodeEventType.UIPositionChange]: NodeUIPositionChangeEvent
  [NodeEventType.UIDimensionsChange]: NodeUIDimensionsChangeEvent
  [NodeEventType.UIStateChange]: NodeUIStateChangeEvent
  [NodeEventType.UIStyleChange]: NodeUIStyleChangeEvent
  [NodeEventType.PortUpdate]: PortUpdateEvent
}

export type NodeEventDataType<T extends NodeEventType> = Omit<
  EventTypeToInterface[T],
  keyof NodeEventBase
>

export type EventReturnType<T extends NodeEventType> = EventTypeToInterface[T]

/**
 * Type guard to check if an event is a specific type
 */
export function isNodeEventType<T extends NodeEvent>(
  event: NodeEvent,
  type: NodeEventType,
): event is T {
  return event.type === type
}
