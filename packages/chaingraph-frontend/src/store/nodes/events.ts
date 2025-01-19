import type { INode } from '@chaingraph/types'
import type { AddNodeEvent, NodeState, UpdateNodeEvent } from './types'
import { createEvent } from 'effector'

// Local state CRUD events
export const addNode = createEvent<INode>()
export const updateNode = createEvent<UpdateNodeEvent>()
export const removeNode = createEvent<string>()
export const setNodeMetadata = createEvent<{ id: string, metadata: NodeState['metadata'] }>()

// Backend operation events
export const addNodeToFlow = createEvent<AddNodeEvent>()
export const removeNodeFromFlow = createEvent<{ flowId: string, nodeId: string }>()

// Bulk operations
export const setNodes = createEvent<Record<string, NodeState>>()
export const clearNodes = createEvent()

// State events
export const setNodesLoading = createEvent<boolean>()
export const setNodesError = createEvent<Error | null>()
