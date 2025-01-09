/**
 * Edge status representing the current state of the connection
 */
export type EdgeStatus =
  | 'active' // Connection is established and working
  | 'inactive' // Connection exists but not currently in use
  | 'error' // Connection has an error

/**
 * Edge configuration metadata
 */
export interface EdgeMetadata {
  /** Optional label for the edge */
  label?: string

  /** Custom metadata */
  [key: string]: unknown
}
