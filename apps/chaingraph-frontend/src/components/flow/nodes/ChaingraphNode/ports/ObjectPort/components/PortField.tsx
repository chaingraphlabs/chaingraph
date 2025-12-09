/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, IPort, IPortConfig, ObjectPortConfig } from '@badaitech/chaingraph-types'
import type {
  PortContextValue,
} from '@/components/flow/nodes/ChaingraphNode/ports/context/PortContext'
import { Pencil } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { PortComponent } from '../../../PortComponent'
import { AddPropPopover } from './AddPropPopover'

interface PortFieldProps {
  node: INode
  parentPort: IPort<ObjectPortConfig>
  port: IPort
  context: PortContextValue
  isOutput: boolean
  isSchemaMutable: boolean
  onDelete: () => void
}

export function PortField({
  node,
  parentPort,
  port,
  context,
  isOutput,
  isSchemaMutable,
  onDelete,
}: PortFieldProps) {
  // Edit mode state
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Memoize this computation to prevent recalculation on every render
  const isKeyDeletable = useMemo(() =>
    parentPort.getConfig()?.ui?.keyDeletable
    || parentPort.getConfig()?.ui?.keyDeletable === undefined, [parentPort])

  const portConfig = port.getConfig()
  port.setConfig({
    ...portConfig,
    ui: {
      ...portConfig.ui || {},
      hideEditor: parentPort.getConfig()?.ui?.hidePropertyEditor || port.getConfig().ui?.hideEditor || false,
    },
  })

  const handleEditSubmit = (data: { key: string, config: IPortConfig }) => {
    // Remove old field then add new field with updated config
    onDelete()
    context.addFieldObjectPort({
      nodeId: node.id!,
      portId: parentPort.id!,
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
          <PortComponent node={node} port={port} context={context} />
        </div>

        {(isSchemaMutable && parentPort.getConfig()?.ui?.keyDeletable)
          && (
            <Popover open={isEditOpen} onOpenChange={setIsEditOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'flex-shrink-0 p-1 rounded-md',
                    'self-start',
                    'hover:bg-accent',
                    'absolute -right-5 top-1',
                    'nodrag',
                    'opacity-0 group-hover/field:opacity-100 transition-opacity',
                  )}
                  onClick={() => setIsEditOpen(true)}
                >
                  <Pencil className="size-3 text-muted-foreground" />
                </button>
              </PopoverTrigger>

              {isEditOpen && (
                <AddPropPopover
                  port={parentPort}
                  onClose={() => setIsEditOpen(false)}
                  onSubmit={handleEditSubmit}
                  onDelete={onDelete}
                  editMode={true}
                  existingField={{
                    key: portConfig.key!,
                    config: port.getConfig(),
                  }}
                />
              )}
            </Popover>
          )}
      </div>
    </div>
  )
}

// Use memo to prevent unnecessary re-renders
export default memo(PortField)
