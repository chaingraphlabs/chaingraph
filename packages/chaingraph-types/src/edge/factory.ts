import type { INode } from '../node'
import type { IEdge } from './interface'
import type { EdgeMetadata, EdgeTransformation } from './types'

/**
 * Edge creation options
 */
export interface EdgeCreationOptions {
  sourceNode: INode
  sourcePortId: string
  targetNode: INode
  targetPortId: string
  metadata?: EdgeMetadata
  transformation?: EdgeTransformation
}

/**
 * Edge factory function type
 */
export type EdgeFactory = (options: EdgeCreationOptions) => Promise<IEdge>
