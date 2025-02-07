/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

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
