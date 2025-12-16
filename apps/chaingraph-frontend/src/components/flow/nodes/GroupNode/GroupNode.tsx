/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeProps } from '@xyflow/react'
import type { GroupNode } from './types'
import { NodeResizer } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { Plus } from 'lucide-react'
import { memo, useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useNodeDropFeedback } from '@/store/drag-drop'
import { $activeFlowMetadata } from '@/store/flow'
import { updateNodeDimensions, updateNodeDimensionsLocal, updateNodePosition, updateNodeUI } from '@/store/nodes'
import { useNode } from '@/store/nodes/hooks/useNode'
import { ColorPicker } from './components/ColorPicker'
import { EditableTitle } from './components/EditableTitle'

const defaultColor = 'rgba(147, 51, 234, 0.2)'

function GroupNodeComponent({
  data,
  selected,
  id,
}: NodeProps<GroupNode>) {
  const activeFlow = useUnit($activeFlowMetadata)
  const node = useNode(id)
  const dropFeedback = useNodeDropFeedback(id)

  const [isEditing, setIsEditing] = useState(false)

  const handleTitleChange = useCallback((title: string) => {
    if (!activeFlow?.id || !id || !node)
      return

    // Always update the title, even if empty
    updateNodeUI({
      flowId: activeFlow.id,
      nodeId: id,
      ui: {
        title: title || '', // Convert undefined/null to empty string
      },
      version: node.metadata.version ?? 0,
    })
    setIsEditing(false)
  }, [activeFlow, node, id])

  const handleColorChange = useCallback((color: string) => {
    if (!activeFlow?.id || !id || !node)
      return

    if (node.metadata.ui?.style?.backgroundColor === color)
      return

    updateNodeUI({
      flowId: activeFlow.id,
      nodeId: id,
      ui: {
        style: {
          backgroundColor: color,
        },
      },
      version: node.metadata.version ?? 0,
    })
  }, [activeFlow, node, id])

  const hasTitle = !!node?.metadata.ui?.title

  return (
    <div
      className={cn(
        'w-full h-full',
        // 'min-w-[150px] min-h-[100px]',
        'rounded-xl border-2',
        'transition-all duration-200',
        'relative',
        // Drop feedback styling
        dropFeedback?.canAcceptDrop && [
          'border-green-500',
          'shadow-[0_0_20px_rgba(34,197,94,0.4)]',
          'ring-4 ring-green-500/30',
        ],
        // Regular selection styling (only if not accepting drop)
        !dropFeedback?.canAcceptDrop && selected
          ? 'border-primary/50 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]'
          : !dropFeedback?.canAcceptDrop && 'border-border/40 hover:border-border/60 shadow-[0_0_12px_rgba(0,0,0,0.1)]',
      )}
      style={{ backgroundColor: node?.metadata.ui?.style?.backgroundColor ?? defaultColor }}
    >

      <NodeResizer
        isVisible={selected}
        minWidth={150}
        minHeight={100}
        lineStyle={{
          border: '3px solid transparent',
        }}
        onResizeStart={() => {
          // Resize starting, nothing needed
        }}
        onResize={(_e, params) => {
          if (!activeFlow?.id || !id || !node)
            return

          // INSTANT local update - makes resize feel responsive
          updateNodeDimensionsLocal({
            flowId: activeFlow.id,
            nodeId: id,
            dimensions: { width: params.width, height: params.height },
            version: node.getVersion(),
          })

          // Throttled backend sync
          updateNodeDimensions({
            flowId: activeFlow.id,
            nodeId: id,
            dimensions: { width: params.width, height: params.height },
            version: node.getVersion(),
          })

          // Position update
          updateNodePosition({
            flowId: activeFlow.id,
            nodeId: id,
            position: { x: params.x, y: params.y },
            version: node.getVersion(),
          })
        }}
        onResizeEnd={() => {
          // Throttled events handle server sync, nothing needed here
        }}
      />

      {/* Color Picker */}
      {selected && (
        <div
          className="absolute top-2 right-2 z-10"
          onMouseDown={e => e.stopPropagation()}
        >
          <ColorPicker
            color={node?.metadata.ui?.style?.backgroundColor ?? defaultColor}
            onChange={handleColorChange}
          />
        </div>
      )}

      {/* Title Area */}
      <div
        className={cn(
          'absolute top-2 left-3 right-12',
          'bottom-2',
          'flex flex-col',
          'min-h-[32px]',
        )}
        onMouseDown={e => e.stopPropagation()}
      >
        {hasTitle || isEditing
          ? (
              <EditableTitle
                value={node?.metadata.ui?.title || ''}
                onChange={handleTitleChange}
                isEditing={isEditing}
                onEditingChange={setIsEditing}
                className={cn(
                  'text-xl leading-tight',
                  'max-w-full',
                )}
              />
            )
          : (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'text-muted-foreground/60',
                  'hover:text-muted-foreground',
                  'transition-colors',
                  'flex items-center gap-2',
                  'w-fit',
                )}
                onClick={() => setIsEditing(true)}
              >
                <Plus className="w-4 h-4" />
                <span>Add Title</span>
              </Button>
            )}
      </div>

    </div>
  )
}

export default memo(GroupNodeComponent)
