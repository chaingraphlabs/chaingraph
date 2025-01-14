/**
 * Edge status enumeration
 */
export enum EdgeStatus {
  Active = 'active',
  Inactive = 'inactive',
  Error = 'error',
}

/**
 * Edge configuration metadata
 */
export interface EdgeMetadata {
  /** Optional label for the edge */
  label?: string

  /** Custom metadata */
  [key: string]: unknown
}
