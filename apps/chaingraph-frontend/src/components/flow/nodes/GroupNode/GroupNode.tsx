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
import { updateNodeTitle, updateNodeUI } from '@/store/nodes'
import { useXYFlowNodeRenderData } from '@/store/xyflow'
import { ColorPicker } from './components/ColorPicker'
import { EditableTitle } from './components/EditableTitle'

const defaultColor = 'rgba(147, 51, 234, 0.2)'

function GroupNodeComponent({
  selected,
  id,
}: NodeProps<GroupNode>) {
  const activeFlow = useUnit($activeFlowMetadata)
  const dropFeedback = useNodeDropFeedback(id)
  const renderData = useXYFlowNodeRenderData(id)

  const [isEditing, setIsEditing] = useState(false)

  const handleTitleChange = useCallback((title: string) => {
    if (!activeFlow?.id || !id)
      return

    // Always update the title, even if empty
    // updateNodeUI({
    //   flowId: activeFlow.id,
    //   nodeId: id,
    //   ui: {
    //     title: title || '', // Convert undefined/null to empty string
    //   },
    //   version: 0,
    // })

    updateNodeTitle({
      flowId: activeFlow.id,
      nodeId: id,
      title,
      version: 0,
    })
    setIsEditing(false)
  }, [activeFlow, id])

  const handleColorChange = useCallback((color: string) => {
    if (!activeFlow?.id || !id)
      return

    if (renderData?.uiStyle?.backgroundColor === color)
      return

    updateNodeUI({
      flowId: activeFlow.id,
      nodeId: id,
      ui: {
        style: {
          backgroundColor: color,
        },
      },
      version: 0,
    })
  }, [activeFlow, id, renderData?.uiStyle?.backgroundColor])

  // const hasTitle = !!node?.metadata.ui?.title
  const hasTitle = !!renderData?.title

  return (
    <div
      className={cn(
        // REMOVED: w-full h-full - conflicts with inline style dimensions
        // REMOVED: transition-all - causes animation lag during resize
        'rounded-xl border-2',
        'transition-colors duration-200', // Only transition colors, not size
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
      style={{
        backgroundColor: renderData?.uiStyle?.backgroundColor ?? defaultColor,
        // CRITICAL: Control size via CSS style, not via nodes array width/height
        // React Flow's width/height are READ-ONLY (measured by ResizeObserver)
        // Use renderData for faster updates during resize
        width: renderData?.dimensions.width,
        height: renderData?.dimensions.height,
      }}
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
          if (!activeFlow?.id || !id)
            return

          // Atomic update - position + dimensions in single request
          // Prevents race condition where separate requests get conflicting versions
          updateNodeUI({
            flowId: activeFlow.id,
            nodeId: id,
            ui: {
              position: { x: params.x, y: params.y },
              dimensions: { width: params.width, height: params.height },
            },
            version: 0,
          })
        }}
        onResizeEnd={(_e, params) => {
          if (!activeFlow?.id || !id)
            return

          // Final atomic update on resize end
          updateNodeUI({
            flowId: activeFlow.id,
            nodeId: id,
            ui: {
              position: { x: params.x, y: params.y },
              dimensions: { width: params.width, height: params.height },
            },
            version: 0,
          })
        }}
      />

      {/* Color Picker */}
      {selected && (
        <div
          className="absolute top-2 right-2 z-10"
          onMouseDown={e => e.stopPropagation()}
        >
          <ColorPicker
            color={renderData?.uiStyle?.backgroundColor ?? defaultColor}
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
                value={renderData?.title || ''}
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
