import type { ExecutionContext } from '@chaingraph/types/flow/execution-context'
import type { NodeEvent } from '@chaingraph/types/node/events'
import type { NodeStatus } from '@chaingraph/types/node/node-enums'
import type {
  Dimensions,
  NodeUIMetadata,
  NodeUIState,
  NodeUIStyle,
  Position,
} from '@chaingraph/types/node/node-ui'
import type { IPort, JSONValue } from '@chaingraph/types/port/base'
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
  get ports(): Map<string, IPort>

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
  addPort: (port: IPort) => IPort

  /**
   * Set the node ports
   * @param ports Map of ports
   */
  setPorts: (ports: Map<string, IPort>) => void

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

  /**
   * Get all input ports
   */
  getInputs: () => IPort[]

  /**
   * Get all output ports
   */
  getOutputs: () => IPort[]

  /**
   * Set the node status
   * @param status New status
   */
  setStatus: (status: NodeStatus, emitEvent?: boolean) => void

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
  on: <T extends NodeEvent>(event: T['type'], handler: (event: T) => void) => () => void

  /**
   * Event handling - Subscribe to all node events
   * @param handler Event handler function
   */
  onAll: (handler: (event: NodeEvent) => void) => () => void

  /**
   * Set the node UI position
   * @param position New position
   * @param emitEvent Emit event
   * @returns
   */
  setPosition: (position: Position, emitEvent?: boolean) => void

  /**
   * Set the node UI dimensions
   * @param dimensions New dimensions
   * @param emitEvent Emit event
   */
  setDimensions: (dimensions: Dimensions, emitEvent?: boolean) => void

  /**
   * Set the node parent
   * @param parentNodeId New parent node ID
   * @param position Position relative to the parent node
   * @param emitEvent Emit event
   */
  setNodeParent: (position: Position, parentNodeId?: string, emitEvent?: boolean) => void

  /**
   * Set the node UI state
   * @param state New state
   * @param emitEvent Emit event
   */
  setUIState: (state: NodeUIState, emitEvent?: boolean) => void

  /**
   * Set the node UI style
   * @param style New style
   * @param emitEvent Emit event
   */
  setUIStyle: (style: NodeUIStyle, emitEvent?: boolean) => void

  /**
   * Get the node UI metadata
   * @returns Node UI metadata
   */
  getUIMetadata: () => NodeUIMetadata | undefined

  /**
   * Disable node events
   */
  disableEvents: () => void

  /**
   * Enable node events (default)
   */
  enableEvents: () => void

  /**
   * Increment the node version
   */
  incrementVersion: () => void

  /**
   * Get the node version
   */
  getVersion: () => number

  /**
   * Serializes the node into a JSON-compatible value.
   */
  serialize: () => JSONValue

  /**
   * Deserializes the given JSON-compatible value into the node.
   * The method returns the updated node instance.
   */
  deserialize: (data: JSONValue) => this
}
