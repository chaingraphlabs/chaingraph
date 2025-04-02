/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPortConfig } from '../port'
import type { NodeCategory } from './category'
import type { ValidationMessageType } from './node-enums'
import type { NodeUIMetadata } from './node-ui'

/**
 * Type definition for node metadata
 */
export interface NodeMetadata {
  type: string
  id?: string
  title?: string
  category?: NodeCategory
  description?: string
  version?: number
  icon?: string
  tags?: string[]
  author?: string
  parentNodeId?: string
  metadata?: Record<string, unknown>
  ui?: NodeUIMetadata
  flowPorts?: FlowPorts
}

/**
 * Type definition for the default node flow ports.
 * Default flow ports include:
 *   - flowIn: boolean (default: true) - Indicates whether the node should be executed
 *   - flowOut: boolean (default: true) - Indicates whether execution was successful
 *   - error: boolean (default: false) - Indicates whether the node execution failed
 *   - errorMessage: string (default: "") - Contains error messages when execution fails
 *
 * When flow ports are disabled, the node won't appear in the flow visualization
 * and will execute automatically by default.
 * When auto-execution is disabled, the node requires manual triggering.
 */
export interface FlowPorts {
  /**
   * disabledFlowPorts - boolean, false by default. Indicates flag if the flow ports are disabled
   */
  disabledFlowPorts?: boolean

  /**
   * disabledAutoExecution - boolean, false by default. Indicates flag if the node auto execution is disabled
   */
  disabledAutoExecution?: boolean

  /**
   * disabledError - boolean, false by default. Indicates flag if the node error ports are disabled
   */
  disabledError?: boolean
}

export interface NodeMetadataWithPorts extends NodeMetadata {
  portsConfig: Map<string, IPortConfig>
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
  backgroundActions?: (() => Promise<void>)[]
}
