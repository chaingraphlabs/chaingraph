import type {
  EdgeEndpoints,
  EdgeMetadata,
  EdgeStatus,
  EdgeTransformation,
  EdgeValidationResult,
} from './types'

/**
 * Base interface for all edges in ChainGraph
 */
export interface IEdge {
  /** Unique identifier of the edge */
  readonly id: string

  /** Current status of the edge */
  readonly status: EdgeStatus

  /** Edge metadata */
  readonly metadata: EdgeMetadata

  /** Edge endpoints */
  readonly endpoints: EdgeEndpoints

  /** Edge transformations */
  readonly transformation?: EdgeTransformation

  /**
   * Initialize the edge connection
   */
  initialize: () => Promise<void>

  /**
   * Activate the edge for data flow
   */
  activate: () => Promise<void>

  /**
   * Deactivate the edge
   */
  deactivate: () => Promise<void>

  /**
   * Validate the edge connection
   */
  validate: () => Promise<EdgeValidationResult>

  /**
   * Transfer data from source to target
   * @param data Data to transfer
   */
  transfer: (data: unknown) => Promise<void>

  /**
   * Update edge metadata
   * @param metadata New metadata
   */
  updateMetadata: (metadata: Partial<EdgeMetadata>) => void

  /**
   * Set transformation options
   * @param transformation New transformation options
   */
  setTransformation: (transformation: EdgeTransformation) => void

  /**
   * Dispose of edge resources
   */
  dispose: () => Promise<void>
}
