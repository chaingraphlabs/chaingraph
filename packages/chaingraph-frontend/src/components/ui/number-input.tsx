import type { NumericFormatProps } from 'react-number-format'
import { cn } from '@/lib/utils'
import React from 'react'
import { NumericFormat } from 'react-number-format'

export function NumberInput({ className, ...props }: NumericFormatProps) {
  return (
    <NumericFormat
      {...props}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        '[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
        className,
      )}
    />
  )
}
