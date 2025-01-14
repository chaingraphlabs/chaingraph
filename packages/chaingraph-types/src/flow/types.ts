/**
 * Flow metadata
 */
export interface FlowMetadata {
  /** Unique identifier */
  id?: string

  /** Display name */
  name: string

  /** Optional description */
  description?: string

  /** Creation timestamp */
  createdAt: Date

  /** Last modified timestamp */
  updatedAt: Date

  /** Tags for organization */
  tags?: string[]

  /** Custom metadata */
  metadata?: Record<string, unknown>
}
