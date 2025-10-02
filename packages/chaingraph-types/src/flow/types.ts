/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

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

  /** Owner ID */
  ownerID?: string

  /** Parent flow ID */
  parentId?: string

  /** Version number */
  version?: number

  /** Custom metadata */
  metadata?: Record<string, unknown>

  /** Fork permission rule in JSONLogic format - defaults to false (not forkable) */
  forkRule?: Record<string, any>

  /** Whether the flow is publicly visible - defaults to false (private) */
  isPublic?: boolean

  /** Whether the current user can fork this flow */
  canFork?: boolean

  /** Schema version for the flow */
  schemaVersion?: string
}
