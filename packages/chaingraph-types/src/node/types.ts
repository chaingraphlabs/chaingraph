/**
 * Node category types
 */
export type NodeCategory =
  | 'input'
  | 'processing'
  | 'output'
  | 'flow-control'
  | 'custom'
  | string // Allow custom categories

/**
 * Node execution status
 */
export type NodeStatus =
  | 'idle'
  | 'running'
  | 'completed'
  | 'error'
  | 'cancelled'

/**
 * Node configuration metadata
 */
export interface NodeMetadata {
  /** Unique identifier for the node type */
  type: string

  /** Display name of the node */
  title: string

  /** Node category for organization */
  category: NodeCategory

  /** Detailed description */
  description?: string

  /** Version information */
  version?: string

  /** Icon identifier */
  icon?: string

  /** Custom metadata */
  [key: string]: unknown
}

/**
 * Node execution context
 */
export interface NodeExecutionContext {
  /** Unique execution ID */
  executionId: string

  /** Timestamp when execution started */
  startTime: Date

  /** Parent flow ID if part of a flow */
  flowId?: string

  /** Additional context data */
  metadata?: Record<string, unknown>
}

/**
 * Node execution result
 */
export interface NodeExecutionResult {
  /** Execution status */
  status: NodeStatus

  /** Output values by port ID */
  outputs: Record<string, unknown>

  /** Execution time in milliseconds */
  executionTime: number

  /** Error details if status is 'error' */
  error?: Error

  /** Additional result metadata */
  metadata?: Record<string, unknown>
}

/**
 * Node validation result
 */
export interface NodeValidationResult {
  /** Is the node valid */
  isValid: boolean

  /** Validation messages */
  messages: Array<{
    type: 'error' | 'warning' | 'info'
    message: string
    portId?: string
  }>
}
