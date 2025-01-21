import type { Dimensions, Position } from '@chaingraph/types/node/node-ui'
import type { EdgeMetadata } from '../edge'
import type { INode } from '../node'
import type { IFlow } from './interface'

/**
 * Enumeration of flow event types
 */
export enum FlowEventType {

  // Flow events
  FlowInitStart = 'flow:init-start',
  FlowInitEnd = 'flow:init-end',
  MetadataUpdated = 'flow:metadata-updated',

  // Node events
  NodeAdded = 'flow:node:added',
  NodeRemoved = 'flow:node:removed',
  NodeUpdated = 'flow:node:updated',

  // Edge events
  EdgeAdded = 'flow:edge:added',
  EdgeRemoved = 'flow:edge:removed',
  // EdgeUpdated = 'flow:edge:updated',

  // Node UI events
  NodeUIPositionChanged = 'flow:node:ui:position-changed',
  NodeUIDimensionsChanged = 'flow:node:ui:dimensions-changed',
  NodeUIStyleChanged = 'flow:node:ui:style-changed',
  NodeUIStateChanged = 'flow:node:ui:state-changed',

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
  edgeId: string
  sourceNodeId: string
  sourcePortId: string
  targetNodeId: string
  targetPortId: string
  metadata: EdgeMetadata
}

/** Data for EdgeRemoved event */
export interface EdgeRemovedEventData {
  edgeId: string
}

/** Data for EdgeUpdated event */
export interface EdgeUpdatedEventData {
  edgeId: string
  sourceNodeId: string
  sourcePortId: string
  targetNodeId: string
  targetPortId: string
  metadata: EdgeMetadata
}

/** Data for Node UI events */
export interface NodeUIEventData {
  nodeId: string
  oldValue: any
  newValue: any
  version: number
}

/** Data for Node UI Position Changed event */
export interface NodeUIPositionChangedEventData {
  nodeId: string
  oldPosition: Position
  newPosition: Position
  version: number
}

/** Data for Node UI Dimensions Changed event */
export interface NodeUIDimensionsChangedEventData {
  nodeId: string
  oldDimensions: Dimensions
  newDimensions: Dimensions
  version: number
}

/** Data for MetadataUpdated event */
export interface MetadataUpdatedEventData {
  oldMetadata?: IFlow['metadata']
  newMetadata: IFlow['metadata']
}

/** Data for FlowInitStart event */
export interface FlowInitStart {
  flowId: string
  metadata: IFlow['metadata']
}

/** Data for FlowInitEnd event */
export interface FlowInitEnd {
  flowId: string
}

/**
 * Mapping between event types and their corresponding data types
 */
export interface EventDataMap {
  [FlowEventType.FlowInitStart]: FlowInitStart
  [FlowEventType.FlowInitEnd]: FlowInitEnd
  [FlowEventType.MetadataUpdated]: MetadataUpdatedEventData
  [FlowEventType.NodeAdded]: NodeAddedEventData
  [FlowEventType.NodeRemoved]: NodeRemovedEventData
  [FlowEventType.NodeUpdated]: NodeUpdatedEventData
  [FlowEventType.EdgeAdded]: EdgeAddedEventData
  [FlowEventType.EdgeRemoved]: EdgeRemovedEventData
  // [FlowEventType.EdgeUpdated]: EdgeUpdatedEventData
  [FlowEventType.NodeUIPositionChanged]: NodeUIPositionChangedEventData
  [FlowEventType.NodeUIDimensionsChanged]: NodeUIDimensionsChangedEventData
  [FlowEventType.NodeUIStyleChanged]: NodeUIEventData
  [FlowEventType.NodeUIStateChanged]: NodeUIEventData
}

/**
 * Base flow event interface
 */
export interface FlowEvent<T extends FlowEventType = FlowEventType> {
  /** Unique index for the event. Used for linearization. */
  index: number

  /** The flow where the event occurred */
  flowId: string

  /** Type of the event */
  type: T

  /** Timestamp when the event occurred */
  timestamp: Date

  /** Event-specific data */
  data: EventDataMap[T]
}

/**
 * Helper type to get all possible flow event types
 */
export type FlowEvents = {
  [K in FlowEventType]: FlowEvent<K>
}[FlowEventType]

/**
 * Helper function to create new flow events with proper typing
 */
export function newEvent<T extends FlowEventType>(
  index: number,
  flowId: string,
  type: T,
  data: EventDataMap[T],
): FlowEvent<T> {
  return {
    index,
    flowId,
    type,
    timestamp: new Date(),
    data,
  }
}
