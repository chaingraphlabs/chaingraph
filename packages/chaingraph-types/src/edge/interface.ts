import type { INode } from '@chaingraph/types/node'
import type { IPort } from '@chaingraph/types/port/base'
import type { EdgeMetadata, EdgeStatus } from './types'

/**
 * Interface representing an edge in the graph, connecting output ports of one node to input ports of another node.
 */
export interface IEdge {
  /** Unique identifier of the edge */
  readonly id: string

  /** Current status of the edge */
  readonly status: EdgeStatus

  /** Edge metadata */
  readonly metadata: EdgeMetadata

  /** Source node and port */
  readonly sourceNode: INode
  readonly sourcePort: IPort

  /** Target node and port */
  readonly targetNode: INode
  readonly targetPort: IPort

  /**
   * Initialize the edge connection
   */
  initialize: () => Promise<void>

  /**
   * Validate the edge connection
   */
  validate: () => Promise<boolean>

  /**
   * Transfer data from source to target
   * @param data Data to transfer
   */
  transfer: () => Promise<void>

  /**
   * Update edge metadata
   * @param metadata New metadata
   */
  updateMetadata: (metadata: Partial<EdgeMetadata>) => void

  /**
   * Dispose of edge resources
   */
  dispose: () => Promise<void>
}
