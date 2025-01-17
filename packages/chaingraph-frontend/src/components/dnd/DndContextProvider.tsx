import type { CategoryMetadata, INode } from '@chaingraph/types'
import type { NodeDropEvent } from './DndContext'
import { useCallback, useMemo, useRef, useState } from 'react'
import { DndContext } from './DndContext'

export function DndContextProvider({ children }: { children: React.ReactNode }) {
  const [draggedNode, setDraggedNode] = useState<{
    node: INode
    categoryMetadata: CategoryMetadata
  } | null>(null)

  // Store callbacks in a ref to avoid re-renders
  const dropCallbacks = useRef<Set<(event: NodeDropEvent) => void>>(new Set())

  const onNodeDrop = useCallback((callback: (event: NodeDropEvent) => void) => {
    dropCallbacks.current.add(callback)

    // Return cleanup function
    return () => {
      dropCallbacks.current.delete(callback)
    }
  }, [])

  const emitNodeDrop = useCallback((event: NodeDropEvent) => {
    dropCallbacks.current.forEach(callback => callback(event))
  }, [])

  const contextValue = useMemo(() => ({
    draggedNode,
    setDraggedNode,
    onNodeDrop,
    emitNodeDrop,
  }), [draggedNode, onNodeDrop, emitNodeDrop])

  return (
    <DndContext.Provider value={contextValue}>
      {children}
    </DndContext.Provider>
  )
}
