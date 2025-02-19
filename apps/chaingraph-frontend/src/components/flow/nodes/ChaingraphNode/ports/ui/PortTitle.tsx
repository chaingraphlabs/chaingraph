/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function PortTitle({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      {...props}
      className={cn(
        'text-xs truncate text-foreground font-medium mb-1',
        className,
      )}
    />
  )
}
