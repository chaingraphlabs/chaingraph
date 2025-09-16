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
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { use, useCallback } from 'react'
import { useDnd } from '@/components/dnd/useDnd'
import { ZoomContext } from '@/providers/ZoomProvider'
import { NodePreview } from '../sidebar/tabs/node-list/NodePreview'

interface DndProviderProps {
  children: React.ReactNode
}

export function DndProvider({ children }: DndProviderProps) {
  const { draggedNode, setDraggedNode, emitNodeDrop } = useDnd()
  const { zoom } = use(ZoomContext)

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 6,
    },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 150,
      tolerance: 3,
    },
  })
  const sensors = useSensors(mouseSensor, touchSensor)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { node, categoryMetadata, portsConfig } = event.active.data.current as {
      node: NodeMetadataWithPorts
      categoryMetadata: CategoryMetadata
      portsConfig?: Map<string, IPortConfig>
    }
    setDraggedNode({ node, categoryMetadata, portsConfig })
  }, [setDraggedNode])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (!draggedNode)
      return

    // Emit node drop event with all necessary data
    if (event.active.rect.current.translated) {
      emitNodeDrop({
        node: draggedNode.node,
        categoryMetadata: draggedNode.categoryMetadata,
        position: {
          x: event.active.rect.current.translated.left,
          y: event.active.rect.current.translated.top,
        },
        portsConfig: draggedNode.node.portsConfig,
      })
    }

    setDraggedNode(null)
  }, [draggedNode, emitNodeDrop, setDraggedNode])

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}

      <DragOverlay
        dropAnimation={null}
      >
        {draggedNode && (
          <div
            className="opacity-80"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
            }}
          >
            <NodePreview
              key={draggedNode.node.type}
              node={draggedNode.node}
              categoryMetadata={draggedNode.categoryMetadata}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
