/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortConfigFull, PortUIState } from '../ports-v2/types'
import type { NodeExecutionState } from '../execution/types'
import type { ExecutionState } from '../execution/types'
import { isSystemErrorPort, isSystemPort } from '../ports-v2'
import { EDGE_STYLES } from './consts'

/**
 * Extract edge color from port UI and config
 *
 * IMPORTANT: `ui` field is stored separately in $portUI, NOT in $portConfigs!
 * - $portConfigs stores config WITHOUT ui (stripped by extractConfigCore)
 * - $portUI stores ui state separately
 * - This includes underlyingType.ui (also stripped from configs)
 *
 * For AnyPort edges, we use the AnyPort's own UI color from $portUI.
 * The AnyPort component should set its UI bgColor based on the underlying type.
 */
export function extractEdgeColor(
  sourceConfig: PortConfigFull,
  sourceUI: PortUIState | undefined,
  targetConfig: PortConfigFull | undefined,
  targetUI: PortUIState | undefined,
): string {
  // Type-safe access to bgColor (exists on BasePortConfigUIType)
  const getBgColor = (ui: PortUIState | undefined): string | undefined => {
    if (!ui) return undefined
    // bgColor is part of BasePortConfigUIType which all port UIs extend
    if ('bgColor' in ui && typeof (ui as Record<string, unknown>).bgColor === 'string') {
      return (ui as Record<string, unknown>).bgColor as string
    }
    return undefined
  }

  // Use source port UI bgColor from $portUI store
  // For AnyPort, this should be the color set by the AnyPort component
  // based on its underlying type
  const color = getBgColor(sourceUI) ?? getBgColor(targetUI) ?? 'currentColor'

  return color
}

/**
 * Style result from compute functions
 */
export interface EdgeStyleResult {
  type: 'flow' | 'default'
  animated: boolean
  strokeWidth: number
  strokeOpacity: number
}

/**
 * Compute edge styling based on execution state
 *
 * This determines:
 * - Edge type ('flow' for system ports, 'default' otherwise)
 * - Animation state (animated during execution)
 * - Stroke style (highlighted, dimmed, or default)
 */
export function computeExecutionStyle(
  targetExec: NodeExecutionState | undefined,
  execState: ExecutionState,
  targetConfig: PortConfigFull | undefined,
): EdgeStyleResult {
  const { executionId } = execState

  let type: 'flow' | 'default' = 'default'
  let animated = false
  let style = EDGE_STYLES.DEFAULT

  if (!targetConfig) {
    return { type, animated, ...style }
  }

  // Compute target port type flags
  const isTargetSystem = isSystemPort(targetConfig)
  const isTargetSystemError = isSystemErrorPort(targetConfig)

  // System flow ports use 'flow' type
  if (isTargetSystem && !isTargetSystemError) {
    type = 'flow'
    animated = false
    style = EDGE_STYLES.DEFAULT
  }

  // Execution state styling
  if (targetExec) {
    switch (targetExec.status) {
      case 'running':
        type = 'flow'
        animated = (isTargetSystem && !isTargetSystemError) || targetConfig.type === 'stream'
        style = EDGE_STYLES.HIGHLIGHTED
        break

      case 'completed':
        type = 'flow'
        animated = isTargetSystem && !isTargetSystemError
        style = EDGE_STYLES.HIGHLIGHTED
        break

      case 'failed':
        type = 'flow'
        animated = isTargetSystem && !isTargetSystemError
        style = EDGE_STYLES.DEFAULT
        break

      case 'skipped':
        type = 'default'
        animated = false
        style = EDGE_STYLES.DIMMED
        break

      case 'idle':
      default:
        if (executionId) {
          style = EDGE_STYLES.DIMMED
          type = 'default'
        }
        break
    }
  } else if (executionId) {
    // Execution is active but this node hasn't been reached yet
    style = EDGE_STYLES.DIMMED
    type = 'default'
  }

  return {
    type,
    animated,
    strokeWidth: style.strokeWidth,
    strokeOpacity: style.strokeOpacity,
  }
}

/**
 * Compute edge styling based on highlighting state
 *
 * Rules:
 * - If nothing is highlighted, return DEFAULT
 * - If this edge is highlighted, return HIGHLIGHTED
 * - If source or target node is highlighted, return HIGHLIGHTED
 * - Otherwise, return DIMMED (something else is highlighted)
 */
export function computeHighlightStyle(
  hasHighlights: boolean,
  isConnected: boolean,
  isEdgeHighlighted: boolean,
): { strokeWidth: number, strokeOpacity: number } {
  if (!hasHighlights) {
    return EDGE_STYLES.DEFAULT
  }

  if (isEdgeHighlighted || isConnected) {
    return EDGE_STYLES.HIGHLIGHTED
  }

  return EDGE_STYLES.DIMMED
}
