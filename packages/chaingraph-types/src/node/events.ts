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
  PositionChange = 'node:ui:position-change',
  DimensionsChange = 'node:ui:dimensions-change',
  StateChange = 'node:ui:state-change',
  StyleChange = 'node:ui:style-change',
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
export interface NodePositionChangeEvent extends NodeEventBase {
  type: NodeEventType.PositionChange
  oldPosition?: NodeUIMetadata['position']
  newPosition: NodeUIMetadata['position']
}

/**
 * Event emitted when node dimensions change
 */
export interface NodeDimensionsChangeEvent extends NodeEventBase {
  type: NodeEventType.DimensionsChange
  oldDimensions: NodeUIMetadata['dimensions']
  newDimensions: NodeUIMetadata['dimensions']
}

/**
 * Event emitted when node UI state changes
 */
export interface NodeStateChangeEvent extends NodeEventBase {
  type: NodeEventType.StateChange
  oldState: NodeUIMetadata['state']
  newState: NodeUIMetadata['state']
}

/**
 * Event emitted when node style changes
 */
export interface NodeStyleChangeEvent extends NodeEventBase {
  type: NodeEventType.StyleChange
  oldStyle: NodeUIMetadata['style']
  newStyle: NodeUIMetadata['style']
}

/**
 * Union type of all possible node events
 */
export type NodeEvent =
  | NodeEventBase
  | NodeStatusChangeEvent
  | NodePositionChangeEvent
  | NodeDimensionsChangeEvent
  | NodeStateChangeEvent
  | NodeStyleChangeEvent

/**
 * Type guard to check if an event is a specific type
 */
export function isNodeEventType<T extends NodeEvent>(
  event: NodeEvent,
  type: NodeEventType,
): event is T {
  return event.type === type
}
