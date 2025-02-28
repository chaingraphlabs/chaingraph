/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Cross2Icon } from '@radix-ui/react-icons'
import { motion } from 'framer-motion'
import { forwardRef } from 'react'

interface FlowTagProps {
  tag: string
  onRemove?: (tag: string) => void
  interactive?: boolean
  maxLength?: number
}

export const FlowTag = forwardRef<HTMLDivElement, FlowTagProps>(
  ({ tag, onRemove, interactive = false, maxLength = 20 }, ref) => {
    // Truncate long tags with ellipsis
    const displayTag = tag.length > maxLength
      ? `${tag.slice(0, maxLength)}...`
      : tag

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        whileHover={interactive ? { scale: 1.05 } : undefined}
        whileTap={interactive ? { scale: 0.95 } : undefined}
        transition={{ duration: 0.2 }}
      >
        <Badge
          variant="secondary"
          className={cn(
            'inline-flex items-center px-2 py-0.5 gap-1',
            'text-xs',
            interactive && 'cursor-pointer',
          )}
          title={tag} // Show full tag on hover
        >
          <span>{displayTag}</span>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-3 w-3 p-0 hover:bg-muted/50"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(tag)
              }}
            >
              <Cross2Icon className="h-3 w-3" />
            </Button>
          )}
        </Badge>
      </motion.div>
    )
  },
)

FlowTag.displayName = 'FlowTag'
