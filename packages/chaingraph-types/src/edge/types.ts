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
 * Control point anchor for edge path customization
 */
export interface EdgeAnchor {
  /** Unique identifier */
  id: string
  /** Absolute X coordinate on canvas */
  x: number
  /** Absolute Y coordinate on canvas */
  y: number
  /** Order index in path (0 = closest to source) */
  index: number
}

/**
 * Edge configuration metadata
 */
export interface EdgeMetadata {
  label?: string
  /** Control point anchors for custom path */
  anchors?: EdgeAnchor[]
  /** Version for optimistic update conflict resolution */
  version?: number

  /** Custom metadata */
  [key: string]: unknown
}
