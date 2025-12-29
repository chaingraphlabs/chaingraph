/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPortConfig } from '@badaitech/chaingraph-types'
import { Pencil } from 'lucide-react'
import { memo, useState } from 'react'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { addFieldObjectPort } from '@/store/ports'
import { PortComponent } from '../../../PortComponent'
import { LazyAddPropPopover } from './LazyAddPropPopover'

interface PortFieldProps {
  nodeId: string
  parentPortId: string
  portId: string
  isOutput: boolean
  isSchemaMutable: boolean
  onDelete: () => void
}

export function PortField({
  nodeId,
  parentPortId,
  portId,
  isOutput,
  isSchemaMutable,
  onDelete,
}: PortFieldProps) {
  // Edit mode state
  const [isEditOpen, setIsEditOpen] = useState(false)

  const handleEditSubmit = (data: { key: string, config: IPortConfig }) => {
    // Remove old field then add new field with updated config
    onDelete()
    addFieldObjectPort({
      nodeId,
      portId: parentPortId,
      key: data.key,
      config: data.config,
    })
    setIsEditOpen(false)
  }

  return (
    <div className="py-1 w-full relative group/field">
      {/* Port content - takes full width */}
      <PortComponent nodeId={nodeId} portId={portId} />

      {/* Edit button - appears on hover at top-right corner, doesn't affect layout */}
      {(isSchemaMutable)
        && (
          <Popover open={isEditOpen} onOpenChange={setIsEditOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'absolute top-1 z-20',
                  'p-0.5 rounded-sm transition-all',
                  'opacity-0 group-hover/field:opacity-100',
                  'hover:bg-accent bg-background/90 border border-border/50',
                  // Position based on port direction - near the title area
                  isOutput ? 'left-1' : 'right-1',
                )}
                onClick={() => setIsEditOpen(true)}
              >
                <Pencil className="w-2.5 h-2.5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <LazyAddPropPopover
              isOpen={isEditOpen}
              onClose={() => setIsEditOpen(false)}
              onSubmit={handleEditSubmit}
              nextOrder={0}
              nodeId={nodeId}
              portId={portId}
              editMode
              onDelete={onDelete}
            />
          </Popover>
        )}
    </div>
  )
}

export default memo(PortField)
