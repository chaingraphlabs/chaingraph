/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeProps } from '@xyflow/react'
import type { GroupNode } from './types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { $activeFlowMetadata } from '@/store/flow'
import { updateNodeUI } from '@/store/nodes'
import { useNode } from '@/store/nodes/hooks/useNode'
import { NodeResizer } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { Plus } from 'lucide-react'
import { memo, useCallback, useState } from 'react'
import { ColorPicker } from './components/ColorPicker'
import { EditableTitle } from './components/EditableTitle'

const defaultColor = 'rgba(147, 51, 234, 0.2)'

function GroupNodeComponent({
  // data,
  selected,
  id,
}: NodeProps<GroupNode>) {
  const activeFlow = useUnit($activeFlowMetadata)
  const node = useNode(id)

  const [isEditing, setIsEditing] = useState(false)

  const handleTitleChange = useCallback((title: string) => {
    if (!activeFlow?.id || !id)
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
  }, [activeFlow, node.metadata.version, id])

  const handleColorChange = useCallback((color: string) => {
    if (!activeFlow?.id || !id)
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

  const hasTitle = !!node.metadata.ui?.title

  return (
    <div
      className={cn(
        'w-full h-full',
        'min-w-[150px] min-h-[100px]',
        'rounded-xl border-2',
        'transition-all duration-200',
        'relative',
        selected
          ? 'border-primary/50 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]'
          : 'border-border/40 hover:border-border/60 shadow-[0_0_12px_rgba(0,0,0,0.1)]',
      )}
      style={{ backgroundColor: node.metadata.ui?.style?.backgroundColor ?? defaultColor }}
    >
      {/* Color Picker */}
      {selected && (
        <div
          className="absolute top-2 right-2 z-10"
          onMouseDown={e => e.stopPropagation()}
        >
          <ColorPicker
            color={node.metadata.ui?.style?.backgroundColor ?? defaultColor}
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
                value={node.metadata.ui?.title || ''}
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

      <NodeResizer
        isVisible={selected}
        minWidth={150}
        minHeight={100}
        lineStyle={{
          border: '3px solid transparent',
        }}
      />
    </div>
  )
}

export default memo(GroupNodeComponent)
