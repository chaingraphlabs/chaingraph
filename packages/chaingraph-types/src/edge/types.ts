import type { INode } from '@chaingraph/types/node'
import type { IPort } from '@chaingraph/types/port'

/**
 * Edge status representing the current state of the connection
 */
export type EdgeStatus =
  | 'active' // Connection is established and working
  | 'inactive' // Connection exists but not currently in use
  | 'error' // Connection has an error
  | 'validating' // Connection is being validated

/**
 * Edge validation result
 */
export interface EdgeValidationResult {
  /** Whether the edge is valid */
  isValid: boolean

  /** Validation messages */
  messages: Array<{
    type: 'error' | 'warning' | 'info'
    message: string
    code?: string
  }>

  /** Additional validation metadata */
  metadata?: Record<string, unknown>
}

/**
 * Edge configuration metadata
 */
export interface EdgeMetadata {
  /** Optional label for the edge */
  label?: string

  /** Visual styling properties */
  style?: {
    color?: string
    width?: number
    pattern?: 'solid' | 'dashed' | 'dotted'
    animated?: boolean
  }

  /** Custom metadata */
  [key: string]: unknown
}

/**
 * Data transformation options for edge
 */
export interface EdgeTransformation {
  /** Transform data before it reaches the target */
  transform?: (data: unknown) => unknown | Promise<unknown>

  /** Validate data before transformation */
  validate?: (data: unknown) => boolean | Promise<boolean>

  /** Handle transformation errors */
  onError?: (error: Error, data: unknown) => void
}

/**
 * Edge connection points
 */
export interface EdgeEndpoints {
  source: {
    nodeId: string
    portId: string
    node: INode
    port: IPort<any>
  }
  target: {
    nodeId: string
    portId: string
    node: INode
    port: IPort<any>
  }
}
