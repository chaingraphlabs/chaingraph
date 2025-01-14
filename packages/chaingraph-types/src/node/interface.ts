import type { ExecutionContext } from '@chaingraph/types/flow/execution-context'
import type { NodeEventUnion } from '@chaingraph/types/node/events'
import type { NodeStatus } from '@chaingraph/types/node/node-enums'
import type { IPort } from '@chaingraph/types/port'
import type {
  NodeExecutionResult,
  NodeMetadata,
  NodeValidationResult,
} from './types'

/**
 * Base interface for all nodes in ChainGraph
 */
export interface INode { // extends CustomTransfomer<INode, JSONValue> {
  get id(): string
  get metadata(): NodeMetadata
  get status(): NodeStatus
  get ports(): Map<string, IPort<any>>

  /**
   * Initialize the node
   */
  initialize: () => void

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
   * @param port Port to add
   */
  addPort: (port: IPort<any>) => IPort<any>

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
   * Get all input ports
   */
  getInputs: () => IPort<any>[]

  /**
   * Get all output ports
   */
  getOutputs: () => IPort<any>[]

  /**
   * Set the node status
   * @param status New status
   */
  setStatus: (status: NodeStatus) => void

  /**
   * Set the node metadata
   * @param metadata New metadata
   */
  setMetadata: (metadata: NodeMetadata) => void

  /**
   * Event handling - Subscribe to node events
   * @param event Event type
   * @param handler Event handler function
   */
  on: <T extends NodeEventUnion>(event: T['type'], handler: (event: T) => void) => void

  /**
   * Event handling - Unsubscribe from node events
   * @param event Event type
   * @param handler Event handler function
   */
  off: <T extends NodeEventUnion>(event: T['type'], handler: (event: T) => void) => void

  // superjson serialization methods
  // readonly name: string
  // isApplicable: (v: any) => v is INode
  // deserialize: (v: JSONValue) => INode
  // serialize: (v: INode) => JSONValue
}
