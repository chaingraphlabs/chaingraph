/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ArrayPortConfig, INode, IPort } from '@badaitech/chaingraph-types'
import { cn } from '@/lib/utils'
import { PortComponent } from '../../PortComponent'
import { DeleteButton } from '../ui/DeleteButton'

interface PortFieldProps {
  node: INode
  parentPort: IPort<ArrayPortConfig>
  port: IPort
  isOutput: boolean
  isMutable: boolean
  onDelete: () => void
}

export function PortField({
  node,
  parentPort,
  port,
  isOutput,
  isMutable,
  onDelete,
}: PortFieldProps) {
  const isKeyDeletable
    = parentPort.getConfig()?.ui?.keyDeletable
    || parentPort.getConfig()?.ui?.keyDeletable === undefined

  return (
    <div className="py-1 w-full relative">
      <div className={cn(
        'flex w-full gap-1',
        'rounded',
        isOutput ? 'flex-row-reverse' : 'flex-row',
      )}
      >
        <div className="flex-1 min-w-0">
          <PortComponent node={node} port={port} />
        </div>

        {(isMutable && <DeleteButton onClick={onDelete} />)}
      </div>
    </div>
  )
}
