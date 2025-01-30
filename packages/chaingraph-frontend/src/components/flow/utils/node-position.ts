import type { XYPosition } from '@xyflow/react'

export function getNodePositionInsideParent(position: XYPosition, parentPosition: XYPosition): XYPosition {
  return {
    x: position.x - parentPosition.x,
    y: position.y - parentPosition.y,
  }
}

export function getNodePositionInFlow(position: XYPosition, parentPosition: XYPosition): XYPosition {
  return {
    x: position.x + parentPosition.x,
    y: position.y + parentPosition.y,
  }
}
