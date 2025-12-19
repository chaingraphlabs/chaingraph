/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { usePortUI } from '@/store/ports-v2'
import { PortComponent } from '../../PortComponent'
import { DeleteButton } from '../ui/DeleteButton'

interface PortFieldProps {
  nodeId: string
  parentPortId: string
  portId: string
  isOutput: boolean
  isMutable: boolean
  onDelete: () => void
}

export function PortField({
  nodeId,
  parentPortId,
  portId,
  isOutput,
  isMutable,
  onDelete,
}: PortFieldProps) {
  const parentUI = usePortUI(nodeId, parentPortId)

  const isKeyDeletable
    = useMemo(() => parentUI?.keyDeletable
      || parentUI?.keyDeletable === undefined, [parentUI])

  return (
    <div className="py-1 w-full relative">
      <div className={cn(
        'flex w-full gap-1',
        'rounded',
        isOutput ? 'flex-row-reverse' : 'flex-row',
      )}
      >
        <div className="flex-1 min-w-0">
          <PortComponent nodeId={nodeId} portId={portId} />
        </div>

        {(isMutable && <DeleteButton onClick={onDelete} />)}
      </div>
    </div>
  )
}
