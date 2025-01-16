import type { IEdge } from '../edge'
import type { INode } from '../node'
import type { IFlow } from './interface'

/**
 * Enumeration of flow event types
 */
export enum FlowEventType {
  // Node events
  NodeAdded = 'flow:node:added',
  NodeRemoved = 'flow:node:removed',
  NodeUpdated = 'flow:node:updated',

  // Edge events
  EdgeAdded = 'flow:edge:added',
  EdgeRemoved = 'flow:edge:removed',
  EdgeUpdated = 'flow:edge:updated',

  // Node UI events
  NodeUIPositionChanged = 'flow:node:ui:position-changed',
  NodeUIDimensionsChanged = 'flow:node:ui:dimensions-changed',
  NodeUIStyleChanged = 'flow:node:ui:style-changed',
  NodeUIStateChanged = 'flow:node:ui:state-changed',

  // Metadata events
  MetadataUpdated = 'flow:metadata-updated',
}

/**
 * Base interface for all flow events
 */
export interface FlowEvent<T extends FlowEventType = FlowEventType, D = any> {
  /** Unique index for the event. Used for linearization. */
  index: number

  /** The flow where the event occurred */
  flowId: string

  /** Type of the event */
  type: T

  /** Timestamp when the event occurred */
  timestamp: Date

  /** Event-specific data */
  data: D
}

/**
 * Event data definitions
 */

/** Data for NodeAdded event */
export interface NodeAddedEventData {
  node: INode
}

/** Data for NodeRemoved event */
export interface NodeRemovedEventData {
  nodeId: string
}

/** Data for NodeUpdated event */
export interface NodeUpdatedEventData {
  node: INode
}

/** Data for EdgeAdded event */
export interface EdgeAddedEventData {
  edge: IEdge
}

/** Data for EdgeRemoved event */
export interface EdgeRemovedEventData {
  edgeId: string
}

/** Data for EdgeUpdated event */
export interface EdgeUpdatedEventData {
  edge: IEdge
}

/** Data for Node UI events */
export interface NodeUIEventData {
  nodeId: string
  oldValue: any
  newValue: any
}

/** Data for MetadataUpdated event */
export interface MetadataUpdatedEventData {
  oldMetadata: IFlow['metadata']
  newMetadata: IFlow['metadata']
}

/**
 * Union type for all flow events
 */
export type FlowEvents =
  | FlowEvent<FlowEventType.NodeAdded, NodeAddedEventData>
  | FlowEvent<FlowEventType.NodeRemoved, NodeRemovedEventData>
  | FlowEvent<FlowEventType.NodeUpdated, NodeUpdatedEventData>
  | FlowEvent<FlowEventType.EdgeAdded, EdgeAddedEventData>
  | FlowEvent<FlowEventType.EdgeRemoved, EdgeRemovedEventData>
  | FlowEvent<FlowEventType.EdgeUpdated, EdgeUpdatedEventData>
  | FlowEvent<FlowEventType.NodeUIPositionChanged, NodeUIEventData>
  | FlowEvent<FlowEventType.NodeUIDimensionsChanged, NodeUIEventData>
  | FlowEvent<FlowEventType.NodeUIStyleChanged, NodeUIEventData>
  | FlowEvent<FlowEventType.NodeUIStateChanged, NodeUIEventData>
  | FlowEvent<FlowEventType.MetadataUpdated, MetadataUpdatedEventData>
