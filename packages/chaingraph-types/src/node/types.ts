import type { PortConfig } from '@chaingraph/types/port/types/port-config'
import type { ExecutionStatus, NodeCategory, ValidationMessageType } from './node-enums'

/**
 * Type definition for node metadata
 */
export interface NodeMetadata {
  type: string
  id?: string
  title?: string
  category?: NodeCategory
  description?: string
  version?: string
  icon?: string
  tags?: string[]
  author?: string
  metadata?: { [key: string]: unknown }
  portsConfig?: Map<string, PortConfig>
}

/**
 * Type definition for validation message
 */
export interface ValidationMessage {
  type: ValidationMessageType
  message: string
  portId?: string
}

/**
 * Type definition for node validation result
 */
export interface NodeValidationResult {
  isValid: boolean
  messages: ValidationMessage[]
  metadata?: { [key: string]: unknown }
}

/**
 * Type definition for node execution result
 */
export interface NodeExecutionResult {
  status?: ExecutionStatus
  startTime?: Date
  endTime?: Date
  outputs?: Map<string, unknown>
  error?: Error
  metadata?: { [key: string]: unknown }
}

/**
 * Type definition for serialized node
 */
// export interface SerializedNode {
//   id: string
//   metadata: NodeMetadata
//   status: NodeStatus
//   ports: Map<string, SerializedPort>
// }
