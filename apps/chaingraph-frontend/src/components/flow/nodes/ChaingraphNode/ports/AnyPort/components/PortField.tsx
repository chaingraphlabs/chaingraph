/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { usePortConfig } from '@/store/ports-v2'
import { PortComponent } from '../../../PortComponent'
import { DeleteButton } from '../../ui/DeleteButton'

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
  // Get parent config for underlying type
  const parentConfig = usePortConfig(nodeId, parentPortId)

  const underlyingType = (parentConfig as any)?.underlyingType

  // Memoize this computation to prevent recalculation on every render
  const isKeyDeletable = useMemo(() =>
    (underlyingType?.type === 'object' && underlyingType?.ui?.keyDeletable)
    || underlyingType?.ui?.keyDeletable === undefined, [underlyingType])

  // Note: Removed port.setConfig() mutation - UI config should be handled via requestUpdatePortUI
  // The hidePropertyEditor logic will be handled by the child PortComponent itself

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

        {(isSchemaMutable && underlyingType?.type === 'object' && underlyingType?.ui?.keyDeletable)
          && <DeleteButton onClick={onDelete} />}
      </div>
    </div>
  )
}

// Use memo to prevent unnecessary re-renders
export default memo(PortField)
