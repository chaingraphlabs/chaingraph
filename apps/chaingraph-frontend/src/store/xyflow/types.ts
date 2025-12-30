/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryMetadata, INode, Position } from '@badaitech/chaingraph-types'

/**
 * Execution status for a node during flow execution
 */
export type NodeExecutionStatus = 'idle' | 'running' | 'completed' | 'failed' | 'skipped'

/**
 * Pulse state for node update animations
 */
export type PulseState = 'pulse' | 'fade' | null

/**
 * Drop feedback state when dragging items over nodes
 */
export interface DropFeedback {
  canAcceptDrop: boolean
  dropType: 'group' | 'schema'
}

/**
 * Execution node state from $executionNodes
 */
export interface ExecutionNodeData {
  status: string
  executionTime?: number
  error?: unknown
  node?: INode
}

/**
 * Complete render data for a single XYFlow node
 *
 * This interface consolidates ALL data needed by the ChaingraphNode component
 * from 9+ different source stores into a single object, enabling:
 * - Single store subscription instead of 13
 * - Surgical delta updates instead of full recalculation
 * - Efficient updateFilter comparisons
 */
export interface XYFlowNodeRenderData {
  // Core identity
  nodeId: string
  version: number

  // Port ID arrays (from $nodePortLists - replaces node.getInputs()/getOutputs() iteration)
  inputPortIds: string[]
  outputPortIds: string[]
  passthroughPortIds: string[]

  // Specific system ports (pre-computed - no iteration needed in components)
  flowInputPortId: string | null
  flowOutputPortId: string | null

  // Specific error ports (pre-computed - no iteration needed in components)
  errorPortId: string | null
  errorMessagePortId: string | null

  // Node metadata (from node instance - will replace direct node access)
  title: string
  status: 'idle' | 'running' | 'completed' | 'failed' | 'skipped'

  // Node UI state (for components that need UI state without accessing node)
  isErrorPortCollapsed: boolean

  // Position (from $nodePositions)
  position: Position

  // Dimensions (from node.metadata.ui.dimensions)
  dimensions: { width: number, height: number }

  // Visual properties (from node + $categoryMetadata)
  nodeType: 'chaingraphNode' | 'groupNode'
  categoryMetadata: CategoryMetadata
  zIndex: number // from $nodeLayerDepth

  // Selection & Interaction (from node.metadata.ui.state)
  isSelected: boolean
  isHidden: boolean
  isDraggable: boolean // !node.metadata.ui.state.isMovingDisabled

  // Parent relationship (from node.metadata)
  parentNodeId: string | undefined

  // Parent node category (for output port visibility check)
  // Pre-computed to avoid loading entire parent INode in NodeBody
  parentNodeCategory: string | undefined

  // Execution state (from $executionState + $executionNodes)
  executionStyle: string | undefined // Border/shadow className
  executionStatus: NodeExecutionStatus
  executionNode: ExecutionNodeData | null // For merged node rendering

  // Interaction state (from $highlightedNodeId)
  isHighlighted: boolean
  hasAnyHighlights: boolean

  // Animation state (from $nodesPulseState)
  pulseState: PulseState

  // Debug state (from $executionState)
  hasBreakpoint: boolean
  debugMode: boolean // For debug UI visibility

  // Drop feedback (from $dragDropRenderState)
  dropFeedback: DropFeedback | null
}

/**
 * Payload for batch node data changes
 */
export interface XYFlowNodesDataChangedPayload {
  changes: Array<{
    nodeId: string
    changes: Partial<XYFlowNodeRenderData>
  }>
}
