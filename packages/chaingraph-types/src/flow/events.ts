// /**
//  * Base flow event interface
//  */
// export interface FlowEvent {
//   flowId: string
//   timestamp: Date
// }
//
// /**
//  * Flow status change event
//  */
// export interface FlowStatusChangeEvent extends FlowEvent {
//   type: 'status-change'
//   oldStatus: FlowStatus
//   newStatus: FlowStatus
// }
//
// /**
//  * Flow execution event
//  */
// export interface FlowExecutionEvent extends FlowEvent {
//   type: 'execution-progress'
//   state: FlowExecutionState
// }
//
// /**
//  * Flow error event
//  */
// export interface FlowErrorEvent extends FlowEvent {
//   type: 'error'
//   error: Error
//   nodeId?: string
//   edgeId?: string
// }
//
// /**
//  * Flow structure change event
//  */
// export interface FlowStructureChangeEvent extends FlowEvent {
//   type: 'structure-change'
//   change: {
//     type: 'node-added' | 'node-removed' | 'edge-added' | 'edge-removed'
//     elementId: string
//   }
// }
//
// /**
//  * All flow events mapped by type
//  */
// export interface FlowEvents {
//   'status-change': FlowStatusChangeEvent
//   'execution-progress': FlowExecutionEvent
//   'error': FlowErrorEvent
//   'structure-change': FlowStructureChangeEvent
//   'node-event': NodeEvents
//   'edge-event': EdgeEvents
// }
