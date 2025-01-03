import type { FlowExport } from '@chaingraph/types/flow/serialization'
import type { IEdge } from '../edge'
import type { INode } from '../node'
import type { FlowEvents } from './events'
import type {
  FlowExecutionOptions,
  FlowExecutionState,
  FlowMetadata,
  FlowStatus,
  FlowValidationResult,
} from './types'

/**
 * Base interface for flows in ChainGraph
 */
export interface IFlow {
  /** Flow metadata */
  readonly metadata: FlowMetadata

  /** Current flow status */
  readonly status: FlowStatus

  /** Map of nodes in the flow */
  readonly nodes: Map<string, INode>

  /** Map of edges in the flow */
  readonly edges: Map<string, IEdge>

  /** Current execution state */
  readonly executionState: FlowExecutionState

  /**
   * Initialize the flow
   */
  initialize: () => Promise<void>

  /**
   * Start flow execution
   * @param options Execution options
   */
  execute: (options?: FlowExecutionOptions) => Promise<void>

  /**
   * Pause flow execution
   */
  pause: () => Promise<void>

  /**
   * Resume flow execution
   */
  resume: () => Promise<void>

  /**
   * Terminate flow execution
   */
  terminate: () => Promise<void>

  /**
   * Validate the flow
   */
  validate: () => Promise<FlowValidationResult>

  /**
   * Add a node to the flow
   * @param node Node to add
   */
  addNode: (node: INode) => void

  /**
   * Remove a node from the flow
   * @param nodeId ID of node to remove
   */
  removeNode: (nodeId: string) => void

  /**
   * Add an edge to the flow
   * @param edge Edge to add
   */
  addEdge: (edge: IEdge) => void

  /**
   * Remove an edge from the flow
   * @param edgeId ID of edge to remove
   */
  removeEdge: (edgeId: string) => void

  /**
   * Subscribe to flow events
   * @param event Event type
   * @param handler Event handler
   */
  on: <T extends keyof FlowEvents>(
    event: T,
    handler: (event: FlowEvents[T]) => void
  ) => () => void

  /**
   * Export flow to serializable format
   */
  export: () => Promise<FlowExport>

  /**
   * Import flow from serialized data
   * @param data Imported flow data
   */
  import: (data: FlowExport) => Promise<void>

  /**
   * Dispose of flow resources
   */
  dispose: () => Promise<void>
}
