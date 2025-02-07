/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { StringPortConfig } from '@badaitech/chaingraph-types'
import { cn } from '@/lib/utils.ts'
import { Handle, Position } from '@xyflow/react'

interface Props {
  config: StringPortConfig
}

export function StringOutputPort(props: Props) {
  const { config } = props
  const bgColor = config.ui?.bgColor || null

  return (
    <div
      key={config.id}
      className="relative flex items-center justify-end gap-2 group/port"
    >
      <span className="text-xs truncate text-foreground">
        {config.title || config.key}
      </span>
      <Handle
        id={config.id}
        type="source"
        position={Position.Right}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
        className={cn(
          'w-2 h-2 rounded-full -mr-4',
          'border-2 border-background dark:border-[#1E1E1E]',
          'transition-shadow duration-200',
          'data-[connected=true]:shadow-port-connected',
          !bgColor && 'bg-flow-data',
        )}
      />
    </div>
  )
}
