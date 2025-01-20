import type { EdgeMetadata } from '@chaingraph/types'

export interface EdgeData {
  flowId: string
  edgeId: string
  sourceNodeId: string
  sourcePortId: string
  targetNodeId: string
  targetPortId: string
  metadata: EdgeMetadata
}

export interface EdgeState {
  edges: EdgeData[]
  isLoading: boolean
  error: Error | null
}

export interface AddEdgeEventData {
  flowId: string
  sourceNodeId: string
  sourcePortId: string
  targetNodeId: string
  targetPortId: string
  metadata: EdgeMetadata
}

export interface RemoveEdgeEventData {
  flowId: string
  edgeId: string
}

export interface EdgeError {
  message: string
  code?: string
  timestamp: Date
}
