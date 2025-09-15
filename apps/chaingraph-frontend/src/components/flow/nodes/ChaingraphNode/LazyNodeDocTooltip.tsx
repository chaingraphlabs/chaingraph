/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryMetadata } from '@badaitech/chaingraph-types'
import type { INode } from '@badaitech/chaingraph-types'
import type { ReactNode } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { lazy, Suspense, useCallback, useMemo, useState } from 'react'

// Lazy load the heavy tooltip content component
const NodeDocTooltipContent = lazy(() =>
  import('./NodeDocTooltipContent').then(module => ({
    default: module.NodeDocTooltipContent,
  })),
)

interface LazyNodeDocTooltipProps {
  node: INode
  categoryMetadata: CategoryMetadata
  children: ReactNode
  className?: string
}

export function LazyNodeDocTooltip({
  node,
  categoryMetadata,
  children,
  className,
}: LazyNodeDocTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasBeenOpened, setHasBeenOpened] = useState(false)

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
    if (open && !hasBeenOpened) {
      setHasBeenOpened(true)
    }
  }, [hasBeenOpened])

  // Only render the heavy content when tooltip has been opened at least once
  const tooltipContent = useMemo(() => {
    if (!hasBeenOpened)
      return null

    return (
      <Suspense fallback={(
        <div className="w-[450px] h-[200px] bg-card rounded-lg flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      )}
      >
        <NodeDocTooltipContent
          node={node}
          categoryMetadata={categoryMetadata}
        />
      </Suspense>
    )
  }, [hasBeenOpened, node, categoryMetadata])

  return (
    <TooltipProvider delayDuration={500}>
      <Tooltip open={isOpen} onOpenChange={handleOpenChange}>
        <TooltipTrigger asChild>
          <div className={className}>
            {children}
          </div>
        </TooltipTrigger>
        {hasBeenOpened && (
          <TooltipContent
            side="right"
            align="center"
            sideOffset={8}
            collisionPadding={20}
            className={cn(
              'p-0 border-0 bg-transparent select-text',
              'pointer-events-auto',
              'z-50',
            )}
          >
            {tooltipContent}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}
