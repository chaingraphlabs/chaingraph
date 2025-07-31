/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  CategoryMetadata,
  IPortConfig,
  NodeMetadataWithPorts,
} from '@badaitech/chaingraph-types'
import type { NodeDropEvent } from './DndContext'
import { useCallback, useMemo, useRef, useState } from 'react'
import { DndContext } from './DndContext'

export function DndContextProvider({ children }: { children: React.ReactNode }) {
  const [draggedNode, setDraggedNode] = useState<{
    node: NodeMetadataWithPorts
    categoryMetadata: CategoryMetadata
    portsConfig?: Map<string, IPortConfig>
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
    <DndContext value={contextValue}>
      {children}
    </DndContext>
  )
}
