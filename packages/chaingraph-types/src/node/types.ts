/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPortConfig } from '../port'
import type { NodeCategory } from './category'
import type { NodeExecutionStatus, ValidationMessageType } from './node-enums'
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
  portsConfig?: Map<string, IPortConfig>
  ui?: NodeUIMetadata
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
  status?: NodeExecutionStatus
  startTime?: Date
  endTime?: Date
  outputs?: Map<string, unknown>
  error?: Error
  metadata?: { [key: string]: unknown }
  backgroundActions?: (() => Promise<void>)[]
}
