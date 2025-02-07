import type { Position } from '@badaitech/chaingraph-types/node/node-ui'

export function getNodePositionInsideParent(
  flowPosition: Position,
  parentPosition: Position,
): Position {
  if (!flowPosition || !parentPosition) {
    console.warn('Invalid positions provided to getNodePositionInsideParent:', {
      flowPosition,
      parentPosition,
    })
    return { x: 0, y: 0 }
  }

  return {
    x: Math.round(flowPosition.x - parentPosition.x),
    y: Math.round(flowPosition.y - parentPosition.y),
  }
}

export function getNodePositionInFlow(
  nodePosition: Position,
  parentPosition: Position,
): Position {
  if (!nodePosition || !parentPosition) {
    console.warn('Invalid positions provided to getNodePositionInFlow:', {
      nodePosition,
      parentPosition,
    })
    return { x: 0, y: 0 }
  }

  return {
    x: Math.round(nodePosition.x + parentPosition.x),
    y: Math.round(nodePosition.y + parentPosition.y),
  }
}
