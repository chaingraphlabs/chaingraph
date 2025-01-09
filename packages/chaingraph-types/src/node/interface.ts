import type { NodeEvents } from '@chaingraph/types/node/events'
import type { ExecutionContext, NodeExecutionResult } from '@chaingraph/types/node/execution'
import type { IPort, PortConfig } from '@chaingraph/types/port'
import type {
  NodeMetadata,
  NodeStatus,
  NodeValidationResult,
} from './types'

/**
 * Base interface for all nodes in ChainGraph
 */
export interface INode {
  get id(): string
  get metadata(): NodeMetadata
  get status(): NodeStatus
  get ports(): Map<string, IPort<any>>

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
  execute: (context: ExecutionContext) => Promise<NodeExecutionResult>

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
  addPort: (config: PortConfig) => IPort<any>

  /**
   * Remove a port from the node
   * @param portId ID of the port to remove
   */
  removePort: (portId: string) => void

  /**
   * Get a port by ID
   * @param portId ID of the port
   */
  getPort: (portId: string) => IPort<any> | undefined

  /**
   * Event handling - Subscribe to node events
   * @param event Event type
   * @param handler Event handler function
   */
  on: <T extends keyof NodeEvents>(event: T, handler: (event: NodeEvents[T]) => void) => void
}
