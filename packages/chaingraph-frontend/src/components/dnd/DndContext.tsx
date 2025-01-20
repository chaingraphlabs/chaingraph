import type { CategoryMetadata, NodeMetadata } from '@chaingraph/types'
import { createContext } from 'react'

export interface NodeDropEvent {
  node: NodeMetadata
  categoryMetadata: CategoryMetadata
  position: { x: number, y: number }
}

interface DndContextType {
  draggedNode: {
    node: NodeMetadata
    categoryMetadata: CategoryMetadata
  } | null
  setDraggedNode: (data: { node: NodeMetadata, categoryMetadata: CategoryMetadata } | null) => void
  onNodeDrop: (callback: (event: NodeDropEvent) => void) => () => void
  emitNodeDrop: (event: NodeDropEvent) => void
}

export const DndContext = createContext<DndContextType | undefined>(undefined)
