/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort } from '../port'
import type { INode } from './interface'
import type { NodeStatus } from './node-enums'
import type { NodeUIMetadata, Position } from './node-ui'

/**
 * Enum for all possible node events
 */
export enum NodeEventType {
  // Status events
  StatusChange = 'node:status-change',

  // Parent events
  ParentChange = 'node:parent-change',

  // UI events
  UIPositionChange = 'node:ui:position-change',
  UIDimensionsChange = 'node:ui:dimensions-change',
  UIChange = 'node:ui:change',

  // Port events
  PortCreate = 'node:port-create',
  PortDelete = 'node:port-delete',
  PortUpdate = 'node:port-update',
  PortConnected = 'node:port-connected',
  PortDisconnected = 'node:port-disconnected',
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
 * Event emitted when node UI changes
 */
export interface NodeUIChangeEvent extends NodeEventBase {
  type: NodeEventType.UIChange
  ui: NodeUIMetadata
}

/**
 * Event emitted when a port is created
 */
export interface PortCreateEvent extends NodeEventBase {
  type: NodeEventType.PortCreate
  portId: string
  port: IPort
}

/**
 * Event emitted when a port is deleted
 */
export interface PortDeleteEvent extends NodeEventBase {
  type: NodeEventType.PortDelete
  portId: string
  port: IPort
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
 * Event emitted when a port is connected
 */
export interface PortConnectedEvent extends NodeEventBase {
  type: NodeEventType.PortConnected
  sourceNode: INode
  sourcePort: IPort
  targetNode: INode
  targetPort: IPort
}

/**
 * Event emitted when a port is disconnected
 */
export interface PortDisconnectedEvent extends NodeEventBase {
  type: NodeEventType.PortDisconnected
  sourceNode: INode
  sourcePort: IPort
  targetNode: INode
  targetPort: IPort
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
  | NodeUIChangeEvent
  | PortCreateEvent
  | PortDeleteEvent
  | PortUpdateEvent
  | PortConnectedEvent
  | PortDisconnectedEvent

export interface EventTypeToInterface {
  [NodeEventType.StatusChange]: NodeStatusChangeEvent
  [NodeEventType.ParentChange]: NodeParentChangeEvent
  [NodeEventType.UIChange]: NodeUIChangeEvent
  [NodeEventType.UIPositionChange]: NodeUIPositionChangeEvent
  [NodeEventType.UIDimensionsChange]: NodeUIDimensionsChangeEvent
  [NodeEventType.PortCreate]: PortCreateEvent
  [NodeEventType.PortDelete]: PortDeleteEvent
  [NodeEventType.PortUpdate]: PortUpdateEvent
  [NodeEventType.PortConnected]: PortConnectedEvent
  [NodeEventType.PortDisconnected]: PortDisconnectedEvent
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
