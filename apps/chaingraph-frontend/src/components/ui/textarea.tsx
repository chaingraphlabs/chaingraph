/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ ref, className, ...props }: React.ComponentProps<'textarea'> & { ref?: React.RefObject<HTMLTextAreaElement | null> }) {
  return (
    <textarea
      className={cn(
        'flex min-h-[60px] rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'md:text-sm',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
}
Textarea.displayName = 'Textarea'

export { Textarea }
