/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort, IPortConfig } from '@badaitech/chaingraph-types'
import type { ReactNode } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { PortDocContent } from './PortDocContent'

interface PortDocTooltipProps<C extends IPortConfig> {
  port: IPort<C>
  children: ReactNode
  className?: string
}

export function PortDocTooltip<C extends IPortConfig>({
  port,
  children,
  className,
}: PortDocTooltipProps<C>) {
  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('relative', className)}>
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          sideOffset={32}
          className="p-0 border-0 bg-transparent shadow-primary select-text"
        >
          <div className="pointer-events-auto">
            <PortDocContent port={port} />
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
