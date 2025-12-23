/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPortConfig } from '@badaitech/chaingraph-types'
import { Pencil } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { addFieldObjectPort } from '@/store/ports'
import { usePortConfig, usePortUI } from '@/store/ports-v2'
import { PortComponent } from '../../../PortComponent'
import { AddPropPopover } from './AddPropPopover'
import { usePortConfigWithExecution, usePortUIWithExecution } from '@/store'

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

  // Get parent UI config
  const parentUI = usePortUIWithExecution(nodeId, parentPortId)

  // Get current child port config and UI for editing
  const childConfig = usePortConfigWithExecution(nodeId, portId)
  const childUI = usePortUIWithExecution(nodeId, portId)

  // Cast parent UI for type-safe property access
  const objectParentUI = parentUI as { keyDeletable?: boolean }

  // Memoize this computation to prevent recalculation on every render
  const isKeyDeletable = useMemo(() =>
    objectParentUI.keyDeletable
    || objectParentUI.keyDeletable === undefined, [objectParentUI])

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

        {(isSchemaMutable && objectParentUI.keyDeletable)
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
                {isEditOpen && childConfig && (
                  <AddPropPopover
                    onClose={() => setIsEditOpen(false)}
                    onSubmit={handleEditSubmit}
                    nextOrder={0}
                    nodeId={nodeId}
                    portId={portId}
                    editMode
                    existingField={{
                      key: childConfig.key ?? '',
                      config: { ...childConfig, ui: childUI } as IPortConfig,
                    }}
                  />
                )}
              </Popover>
            </div>
          )}
      </div>
    </div>
  )
}

export default memo(PortField)
