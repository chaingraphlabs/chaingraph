/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Position in the flow canvas
 */
export interface Position {
  x: number
  y: number
}

/**
 * Dimensions of a UI element
 */
export interface Dimensions {
  width: number
  height: number
}

export const DefaultPosition: Position = { x: 0, y: 0 }

export interface NodeUIStyle {
  backgroundColor?: string
  borderColor?: string
}

export interface NodeUIState {
  isSelected?: boolean
  isHighlighted?: boolean
  isDisabled?: boolean
  isErrorPortCollapsed?: boolean
}

/**
 * Basic UI metadata for node positioning and appearance
 */
export interface NodeUIMetadata {
  /**
   * Node position in the flow canvas
   */
  position?: Position

  /**
   * Node dimensions
   */
  dimensions?: Dimensions

  /**
   * Basic visual styling
   */
  style?: NodeUIStyle

  /**
   * Node UI state
   */
  state?: NodeUIState

  [key: string]: any
}
