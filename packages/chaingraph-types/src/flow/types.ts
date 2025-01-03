/**
 * Flow status representing the current state of execution
 */
export type FlowStatus =
  | 'idle' // Flow is not running
  | 'running' // Flow is currently executing
  | 'paused' // Flow execution is paused
  | 'completed' // Flow has completed successfully
  | 'error' // Flow encountered an error
  | 'terminated' // Flow was manually terminated

/**
 * Flow metadata
 */
export interface FlowMetadata {
  /** Unique identifier */
  id: string

  /** Display name */
  name: string

  /** Optional description */
  description?: string

  /** Version information */
  version?: string

  /** Creation timestamp */
  createdAt: Date

  /** Last modified timestamp */
  updatedAt: Date

  /** Creator information */
  creator?: {
    id: string
    name: string
  }

  /** Tags for organization */
  tags?: string[]

  /** Custom metadata */
  [key: string]: unknown
}

/**
 * Flow execution options
 */
export interface FlowExecutionOptions {
  /** Timeout in milliseconds */
  timeout?: number

  /** Maximum number of retries on error */
  maxRetries?: number

  /** Debug mode flag */
  debug?: boolean

  /** Initial input data */
  inputs?: Record<string, unknown>

  /** Execution context */
  context?: Record<string, unknown>
}

/**
 * Flow execution state
 */
export interface FlowExecutionState {
  /** Current status */
  status: FlowStatus

  /** Start time */
  startTime?: Date

  /** End time */
  endTime?: Date

  /** Current execution progress (0-1) */
  progress: number

  /** Executed node IDs */
  executedNodes: Set<string>

  /** Currently executing node IDs */
  activeNodes: Set<string>

  /** Error information if status is 'error' */
  error?: Error

  /** Execution metrics */
  metrics: FlowExecutionMetrics
}

/**
 * Flow execution metrics
 */
export interface FlowExecutionMetrics {
  /** Total execution time in milliseconds */
  totalTime: number

  /** Time spent in each node */
  nodeExecutionTimes: Record<string, number>

  /** Number of data transfers */
  dataTransferCount: number

  /** Memory usage estimation */
  estimatedMemoryUsage: number

  /** Custom metrics */
  [key: string]: unknown
}

/**
 * Flow validation result
 */
export interface FlowValidationResult {
  /** Is the flow valid */
  isValid: boolean

  /** Validation messages */
  messages: Array<{
    type: 'error' | 'warning' | 'info'
    message: string
    nodeId?: string
    edgeId?: string
    code?: string
  }>

  /** Validation metadata */
  metadata?: Record<string, unknown>
}
