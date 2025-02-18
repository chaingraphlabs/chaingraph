/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Position } from '@badaitech/chaingraph-types'

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
