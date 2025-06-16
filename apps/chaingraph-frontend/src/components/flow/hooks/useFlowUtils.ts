/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Utility functions for flow operations
 */

export function isPointInBounds(
  point: { x: number, y: number },
  bounds: { x: number, y: number, width: number, height: number },
) {
  return point.x >= bounds.x
    && point.x <= bounds.x + bounds.width
    && point.y >= bounds.y
    && point.y <= bounds.y + bounds.height
}

export function isValidPosition(pos: any): pos is { x: number, y: number } {
  return pos
    && typeof pos.x === 'number'
    && typeof pos.y === 'number'
    && !Number.isNaN(pos.x)
    && !Number.isNaN(pos.y)
    && Number.isFinite(pos.x)
    && Number.isFinite(pos.y)
}

export function roundPosition(pos: { x: number, y: number }, precision = 10) {
  return {
    x: Math.round(pos.x / precision) * precision,
    y: Math.round(pos.y / precision) * precision,
  }
}
