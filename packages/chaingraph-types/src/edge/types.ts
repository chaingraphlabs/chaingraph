/**
 * Edge status enumeration
 */
export enum EdgeStatus {
  Active = 'active',
  Inactive = 'inactive',
  Error = 'error',
}

export interface EdgeStyle {
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string
}

/**
 * Edge configuration metadata
 */
export interface EdgeMetadata {
  label?: string

  /** Custom metadata */
  [key: string]: unknown
}
