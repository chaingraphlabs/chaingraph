import type { CategoryMetadata, INode } from '@chaingraph/types'
import { createContext } from 'react'

export interface NodeDropEvent {
  node: INode
  categoryMetadata: CategoryMetadata
  position: { x: number, y: number }
}

interface DndContextType {
  draggedNode: {
    node: INode
    categoryMetadata: CategoryMetadata
  } | null
  setDraggedNode: (data: { node: INode, categoryMetadata: CategoryMetadata } | null) => void
  onNodeDrop: (callback: (event: NodeDropEvent) => void) => () => void
  emitNodeDrop: (event: NodeDropEvent) => void
}

export const DndContext = createContext<DndContextType | undefined>(undefined)
