/**
 * Execution context passed to nodes during execution
 */
// export interface ExecutionContext {
//   /** Unique execution ID */
//   executionId: string
//
//   /** Timestamp when execution started */
//   startTime: Date
//
//   /** Parent flow ID if part of a flow */
//   flowId?: string
//
//   /** Additional context data */
//   metadata?: Record<string, unknown>
//
//   /** Cancellation signal for interrupting execution */
//   cancelSignal?: AbortSignal
// }

/**
 * Node execution result
 */
export interface NodeExecutionResult {
  /** Execution status */
  status: 'completed' | 'error'

  /** Timestamps */
  startTime: Date
  endTime: Date

  /** Output values by port ID */
  outputs: Map<string, unknown>

  /** Error details if status is 'error' */
  error?: Error

  /** Additional result metadata */
  metadata?: Record<string, unknown>
}
