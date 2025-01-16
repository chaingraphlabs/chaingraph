import type { NodeStatus } from '@chaingraph/types/node/node-enums'
import type { NodeUIMetadata } from '@chaingraph/types/node/node-ui'

// /**
//  * Schema and type for base node event
//  */
// export const NodeEventSchema = z.object({
//   nodeId: z.string(),
//   timestamp: z.date(),
//   type: z.nativeEnum(NodeEvents),
// })
//
// export type NodeEvent = z.infer<typeof NodeEventSchema>
//
// /**
//  * Schema and type for node status change event
//  */
// export const NodeStatusChangeEventSchema = NodeEventSchema.extend({
//   type: z.literal(NodeEvents.StatusChange),
//   node: z.any(), // TODO: Will be properly typed when full node schema is available
//   oldStatus: z.nativeEnum(NodeStatus),
//   newStatus: z.nativeEnum(NodeStatus),
// })
//
// export type NodeStatusChangeEvent = z.infer<typeof NodeStatusChangeEventSchema>
//
// /**
//  * Schema and type for node event
//  */
// export const NodeEventUnionSchema = z.discriminatedUnion('type', [
//   NodeStatusChangeEventSchema,
// ])
//
// export type NodeEventUnion = z.infer<typeof NodeEventUnionSchema>

/**
 * Enum for all possible node events
 */
export enum NodeEventType {
  // Handle for all events
  All = 'node:all',

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
  oldPosition?: NodeUIMetadata['position']
  newPosition: NodeUIMetadata['position']
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

/**
 * Type guard to check if an event is a specific type
 */
export function isNodeEventType<T extends NodeEvent>(
  event: NodeEvent,
  type: NodeEventType,
): event is T {
  return event.type === type
}
