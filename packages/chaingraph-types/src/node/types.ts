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
  | 'initialized'
  | 'ready'
  | 'pending'
  | 'executing'
  | 'completed'
  | 'error'
  | 'disposed'

/**
 * Node configuration metadata
 */
export interface NodeMetadata {
  /** Display name of the node */
  type: string

  /** Display name of the node */
  title: string

  /** Node category for organization */
  category: string

  /** Detailed description */
  description?: string

  /** Version information */
  version?: string

  /** Icon identifier */
  icon?: string

  /** Tags for organization */
  tags?: string[]

  /** Author information */
  author?: string

  /** Custom metadata */
  [key: string]: unknown
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

  /** Additional validation metadata */
  metadata?: Record<string, unknown>
}
