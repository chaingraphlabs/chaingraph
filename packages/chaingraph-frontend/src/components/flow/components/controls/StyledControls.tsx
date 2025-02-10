/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MouseEvent } from 'react'
import { cn } from '@/lib/utils'
import {
  EnterFullScreenIcon,
  MinusIcon,
  PlusIcon,
} from '@radix-ui/react-icons'
import { ControlButton, Controls, useReactFlow } from '@xyflow/react'

interface StyledControlsProps {
  className?: string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export function StyledControls({
  className,
  position = 'bottom-right',
}: StyledControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  // Properly typed event handlers
  const handleZoomIn = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    zoomIn()
  }

  const handleZoomOut = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    zoomOut()
  }

  const handleFitView = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    fitView()
  }

  return (
    <Controls
      position={position}
      className={cn(
        // Base styles
        'p-1 gap-1 !bg-background/80 backdrop-blur-sm',
        'border border-border rounded-lg shadow-lg',
        'dark:!bg-card/80 dark:border-border/30',
        // Custom padding and spacing
        '[&>button]:!p-1.5',
        '[&>button]:!rounded-md',
        '[&>button]:!border-0',
        // Button colors
        '[&>button]:!bg-background/50',
        '[&>button.react-flow__controls-interactive]:dark:!bg-muted/30',
        '[&>button]:dark:hover:!bg-muted/50',
        '[&>button]:hover:!bg-accent/50',
        // Button icons
        '[&>button]:!text-foreground/50',
        '[&>button]:hover:!text-foreground',
        '[&>button]:dark:!text-muted-foreground',
        '[&>button]:dark:hover:!text-foreground',
        // Transitions
        '[&>button]:transition-all [&>button]:duration-200',
        className,
      )}
      showZoom={false}
      showFitView={false}
      showInteractive={false}
    >
      {/* Custom zoom in button */}
      <ControlButton
        onClick={handleZoomIn}
        className="react-flow__controls-zoomin"
        title="Zoom in"
      >
        <PlusIcon className="w-4 h-4" />
      </ControlButton>

      {/* Custom zoom out button */}
      <ControlButton
        onClick={handleZoomOut}
        className="react-flow__controls-zoomout"
        title="Zoom out"
      >
        <MinusIcon className="w-4 h-4" />
      </ControlButton>

      {/* Custom fit view button */}
      <ControlButton
        onClick={handleFitView}
        className="react-flow__controls-fitview"
        title="Fit view"
      >
        <EnterFullScreenIcon className="w-4 h-4" />
      </ControlButton>

    </Controls>
  )
}
