/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, IPort, ObjectPortConfig } from '@badaitech/chaingraph-types'
import type {
  PortContextValue,
} from '@/components/flow/nodes/ChaingraphNode/ports/context/PortContext'
import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { PortComponent } from '../../../PortComponent'
import { DeleteButton } from '../../ui/DeleteButton'

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

  return (
    <div className="py-1 w-full relative">
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
            <DeleteButton onClick={onDelete} />
          )}
      </div>
    </div>
  )
}

// Use memo to prevent unnecessary re-renders
export default memo(PortField)
