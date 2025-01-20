import type { NodeMetadata } from '@chaingraph/types/node/types'

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
}

export interface CategorizedNodes {
  category: NodeCategory
  metadata: CategoryMetadata
  nodes: NodeMetadata[]
}
