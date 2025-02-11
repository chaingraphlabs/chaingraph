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
