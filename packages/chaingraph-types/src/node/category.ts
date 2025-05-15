/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeMetadataWithPorts } from './types'

/**
 * Base type for node category identifier
 */
export type NodeCategory = string

/**
 * Base interface for category styling
 */
export interface CategoryStyle {
  // Colors for light theme
  light: {
    primary: string // Header background & accent color
    secondary: string // Border color
    background: string // Node background
    text: string // Text color
  }
  // Colors for dark theme
  dark: {
    primary: string
    secondary: string
    background: string
    text: string
  }
}

/**
 * Metadata for node categories
 */
export interface CategoryMetadata {
  id: NodeCategory
  label: string
  description: string
  icon: string
  style: CategoryStyle
  order: number
  hidden?: boolean
}

export interface CategorizedNodes {
  category: NodeCategory
  metadata: CategoryMetadata
  nodes: NodeMetadataWithPorts[]
}
