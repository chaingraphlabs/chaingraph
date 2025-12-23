/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ReactNode } from 'react'
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useUnit } from 'effector-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui'
import { $isConnecting } from '@/store/edges/stores'

const LazyPortDocTooltipContent = lazy(() =>
  import('./PortDocTooltipContent').then(module => ({
    default: module.PortDocTooltipContent,
  })),
)

interface PortDocTooltipProps {
  nodeId: string
  portId: string
  children: ReactNode
  className?: string
}

export function PortDocTooltip({
  nodeId,
  portId,
  children,
  className,
}: PortDocTooltipProps) {
  const isConnecting = useUnit($isConnecting)
  const [isOpen, setIsOpen] = useState(false)
  const [hasBeenOpened, setHasBeenOpened] = useState(false)

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
    if (open && !hasBeenOpened) {
      setHasBeenOpened(true)
    }
  }, [hasBeenOpened])

  useEffect(() => {
    if (isConnecting && isOpen) {
      setIsOpen(false)
    }
  }, [isConnecting, isOpen])

  const tooltipContent = useMemo(() => {
    if (!hasBeenOpened)
      return null

    return (
      <Suspense fallback={<PortDocTooltipFallback />}>
        <LazyPortDocTooltipContent nodeId={nodeId} portId={portId} className={className} />
      </Suspense>
    )
  }, [className, hasBeenOpened, nodeId, portId])

  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip open={!isConnecting && isOpen} onOpenChange={handleOpenChange}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        {tooltipContent}
      </Tooltip>
    </TooltipProvider>
  )
}

function PortDocTooltipFallback() {
  return (
    <TooltipContent
      side="right"
      align="center"
      sideOffset={32}
      className="p-0 border-0 bg-transparent select-text"
    >
      <div className="pointer-events-auto">
        <div className="w-[300px] h-[220px] rounded-lg border bg-card/70" />
      </div>
    </TooltipContent>
  )
}
