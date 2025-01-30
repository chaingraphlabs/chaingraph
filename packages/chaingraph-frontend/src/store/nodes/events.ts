import type { INode } from '@chaingraph/types'
import type { Position } from '@chaingraph/types/node/node-ui'
import type {
  AddNodeEvent,
  NodeState,
  UpdateNodeEvent,
  UpdateNodeParent,
  UpdateNodePosition,
  UpdateNodeUIEvent,
} from './types'
import { createEvent } from 'effector'

// Local state CRUD events
export const addNode = createEvent<INode>()
export const updateNode = createEvent<UpdateNodeEvent>()
export const removeNode = createEvent<string>()
export const setNodeMetadata = createEvent<{ id: string, metadata: NodeState['metadata'] }>()
export const setNodeVersion = createEvent<{ id: string, version: number }>()
export const updateNodeParent = createEvent<UpdateNodeParent>()

// Backend operation events
export const addNodeToFlow = createEvent<AddNodeEvent>()
export const removeNodeFromFlow = createEvent<{ flowId: string, nodeId: string }>()

// Bulk operations
export const setNodes = createEvent<Record<string, INode>>()
export const clearNodes = createEvent()

// State events
export const setNodesLoading = createEvent<boolean>()
export const setNodesError = createEvent<Error | null>()

// UI update events
export const updateNodeUI = createEvent<UpdateNodeUIEvent>()
export const updateNodeUILocal = createEvent<UpdateNodeUIEvent>() // For optimistic updates
export const updateNodePosition = createEvent<UpdateNodePosition>()
export const updateNodePositionLocal = createEvent<UpdateNodePosition>() // For optimistic updates

// New event for interpolated position updates
export const updateNodePositionInterpolated = createEvent<{
  nodeId: string
  position: Position
}>()
