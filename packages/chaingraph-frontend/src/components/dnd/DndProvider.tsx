import type { CategoryMetadata, NodeMetadata } from '@badaitech/chaingraph-types'
import { useDnd } from '@/components/dnd/useDnd'
import { ZoomContext } from '@/providers/ZoomProvider'
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { DragOverlay } from '@dnd-kit/core'
import { useCallback, useContext } from 'react'
import { NodePreview } from '../sidebar/tabs/node-list/NodePreview'

interface DndProviderProps {
  children: React.ReactNode
}

export function DndProvider({ children }: DndProviderProps) {
  const { draggedNode, setDraggedNode, emitNodeDrop } = useDnd()
  const { zoom } = useContext(ZoomContext)

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
    const { node, categoryMetadata } = event.active.data.current as {
      node: NodeMetadata
      categoryMetadata: CategoryMetadata
    }
    setDraggedNode({ node, categoryMetadata })
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
