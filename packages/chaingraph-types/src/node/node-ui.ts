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
