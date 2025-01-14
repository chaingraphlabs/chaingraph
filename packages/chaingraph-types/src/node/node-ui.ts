/**
 * Basic UI metadata for node positioning and appearance
 */
export interface NodeUIMetadata {
  /**
   * Node position in the flow canvas
   */
  position: {
    x: number
    y: number
  }

  /**
   * Node dimensions
   */
  dimensions?: {
    width?: number
    height?: number
  }

  /**
   * Basic visual styling
   */
  style?: {
    backgroundColor?: string
    borderColor?: string
  }

  /**
   * Node UI state
   */
  state?: {
    isSelected?: boolean
    isHighlighted?: boolean
    isDisabled?: boolean
  }
}
