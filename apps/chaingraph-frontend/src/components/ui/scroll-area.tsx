/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { cn } from '@/lib/utils'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'

import * as React from 'react'

function ScrollBar({ ref, className, orientation = 'vertical', ...props }: React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> & { ref?: React.RefObject<React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> | null> }) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        'flex touch-none select-none transition-colors',
        orientation === 'vertical'
        && 'h-full w-2.5 border-l border-l-transparent p-[1px]',
        orientation === 'horizontal'
        && 'h-2.5 flex-col border-t border-t-transparent p-[1px]',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

function ScrollArea({ ref, className, children, ...props }: React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & { ref?: React.RefObject<React.ElementRef<typeof ScrollAreaPrimitive.Root> | null> }) {
  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

export { ScrollArea, ScrollBar }
