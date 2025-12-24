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
      <div className={cn(
        'flex w-full gap-1',
        'rounded',
        isOutput ? 'flex-row-reverse' : 'flex-row',
      )}
      >
        <div className="flex-1 min-w-0">
          <PortComponent nodeId={nodeId} portId={portId} />
        </div>

        {(isSchemaMutable)
          && (
            <div className={cn(
              'flex items-center gap-1 opacity-0 group-hover/field:opacity-100 transition-opacity',
              isOutput ? 'mr-2' : 'ml-2',
            )}
            >
              <Popover open={isEditOpen} onOpenChange={setIsEditOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="p-1 hover:bg-accent rounded-sm transition-colors"
                    onClick={() => setIsEditOpen(true)}
                  >
                    <Pencil className="w-3 h-3" />
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
            </div>
          )}
      </div>
    </div>
  )
}

export default memo(PortField)
