/**
 * Represents possible node execution statuses
 */
export enum NodeStatus {
  Idle = 'idle',
  Initialized = 'initialized',
  Ready = 'ready',
  Pending = 'pending',
  Executing = 'executing',
  Completed = 'completed',
  Error = 'error',
  Disposed = 'disposed',
}

/**
 * Represents possible validation message types
 */
export enum ValidationMessageType {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

/**
 * Represents possible node execution result statuses
 */
export enum NodeExecutionStatus {
  Completed = 'completed',
  Error = 'error',
}
