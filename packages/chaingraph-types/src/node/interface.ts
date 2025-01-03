import type { IPort, PortConfig } from '@chaingraph/types/port'
import type {
  NodeExecutionContext,
  NodeExecutionResult,
  NodeMetadata,
  NodeStatus,
  NodeValidationResult,
} from './types'

/**
 * Base interface for all nodes in ChainGraph
 */
export interface INode {
  /** Unique instance ID */
  readonly id: string

  /** Node metadata */
  readonly metadata: NodeMetadata

  /** Current execution status */
  readonly status: NodeStatus

  /** Input ports mapped by ID */
  readonly inputs: Map<string, IPort>

  /** Output ports mapped by ID */
  readonly outputs: Map<string, IPort>

  /**
   * Initialize the node
   * @returns Promise that resolves when initialization is complete
   */
  initialize: () => Promise<void>

  /**
   * Execute the node's logic
   * @param context Execution context
   * @returns Execution result
   */
  execute: (context: NodeExecutionContext) => Promise<NodeExecutionResult>

  /**
   * Validate the node's configuration and current state
   * @returns Validation result
   */
  validate: () => Promise<NodeValidationResult>

  /**
   * Reset the node to its initial state
   */
  reset: () => Promise<void>

  /**
   * Clone the node
   * @returns A new instance of the node
   */
  clone: () => INode

  /**
   * Dispose of node resources
   */
  dispose: () => Promise<void>

  /**
   * Add a port to the node
   * @param config Port configuration
   */
  addPort: (config: PortConfig) => IPort

  /**
   * Remove a port from the node
   * @param portId ID of the port to remove
   */
  removePort: (portId: string) => void

  /**
   * Get a port by ID
   * @param portId ID of the port
   */
  getPort: (portId: string) => IPort | undefined
}
