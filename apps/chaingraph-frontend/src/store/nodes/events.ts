/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, Position } from '@badaitech/chaingraph-types'
import type {
  AddNodeEvent,
  NodeState,
  UpdateNodeParent,
  UpdateNodePosition,
  UpdateNodeUIEvent,
} from './types'
import { nodesDomain } from '../domains'

// Local state CRUD events
export const addNode = nodesDomain.createEvent<INode>()
export const addNodes = nodesDomain.createEvent<INode[]>()
export const updateNode = nodesDomain.createEvent<INode>()
export const removeNode = nodesDomain.createEvent<string>()
export const setNodeMetadata = nodesDomain.createEvent<{ nodeId: string, metadata: NodeState['metadata'] }>()
export const setNodeVersion = nodesDomain.createEvent<{ nodeId: string, version: number }>()
export const updateNodeParent = nodesDomain.createEvent<UpdateNodeParent>()

// Backend operation events
export const addNodeToFlow = nodesDomain.createEvent<AddNodeEvent>()
export const removeNodeFromFlow = nodesDomain.createEvent<{ flowId: string, nodeId: string }>()

// Bulk operations
export const setNodes = nodesDomain.createEvent<Record<string, INode>>()
export const clearNodes = nodesDomain.createEvent()

// State events
export const setNodesLoading = nodesDomain.createEvent<boolean>()
export const setNodesError = nodesDomain.createEvent<Error | null>()

// UI update events
export const updateNodeUI = nodesDomain.createEvent<UpdateNodeUIEvent>()
export const updateNodeUILocal = nodesDomain.createEvent<UpdateNodeUIEvent>() // For optimistic updates
export const updateNodePosition = nodesDomain.createEvent<UpdateNodePosition>()
export const updateNodePositionLocal = nodesDomain.createEvent<UpdateNodePosition>() // For optimistic updates

// New event for interpolated position updates
export const updateNodePositionInterpolated = nodesDomain.createEvent<{
  nodeId: string
  position: Position
}>()
