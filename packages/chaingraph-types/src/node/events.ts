import type { NodeStatus } from '@chaingraph/types/node/node-enums'
import type { NodeUIMetadata, Position } from '@chaingraph/types/node/node-ui'

/**
 * Enum for all possible node events
 */
export enum NodeEventType {
  // Status events
  StatusChange = 'node:status-change',

  // UI events
  UIPositionChange = 'node:ui:position-change',
  UIDimensionsChange = 'node:ui:dimensions-change',
  UIStateChange = 'node:ui:state-change',
  UIStyleChange = 'node:ui:style-change',
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
 * Union type of all possible node events
 */
export type NodeEvent =
  | NodeEventBase
  | NodeStatusChangeEvent
  | NodeUIPositionChangeEvent
  | NodeUIDimensionsChangeEvent
  | NodeUIStateChangeEvent
  | NodeUIStyleChangeEvent

export interface EventTypeToInterface {
  [NodeEventType.StatusChange]: NodeStatusChangeEvent
  [NodeEventType.UIPositionChange]: NodeUIPositionChangeEvent
  [NodeEventType.UIDimensionsChange]: NodeUIDimensionsChangeEvent
  [NodeEventType.UIStateChange]: NodeUIStateChangeEvent
  [NodeEventType.UIStyleChange]: NodeUIStyleChangeEvent
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
