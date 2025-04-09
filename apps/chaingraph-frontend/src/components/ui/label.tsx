/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cva } from 'class-variance-authority'

import * as React from 'react'

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
)

function Label({ ref, className, ...props }: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants> & { ref?: React.RefObject<React.ElementRef<typeof LabelPrimitive.Root> | null> }) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    />
  )
}
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
