/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { Circle, CircleDot } from 'lucide-react'
import { useCallback } from 'react'

interface BreakpointButtonProps {
  nodeId: string
  enabled: boolean
  onToggle: (nodeId: string) => void
  className?: string
}

export function BreakpointButton({
  nodeId,
  enabled,
  onToggle,
  className,
}: BreakpointButtonProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle(nodeId)
  }, [nodeId, onToggle])

  return (
    <motion.button
      className={cn(
        'absolute -left-1 -top-1',
        'w-6 h-6 rounded-full',
        'flex items-center justify-center',
        'hover:bg-background/80 dark:hover:bg-background/50',
        'transition-colors duration-200',
        'group',
        className,
      )}
      onClick={handleClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={false}
    >
      <AnimatePresence mode="wait">
        {enabled
          ? (
              <motion.div
                key="enabled"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-red-500 dark:text-red-400"
              >
                <CircleDot className="w-4 h-4" />
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse" />
              </motion.div>
            )
          : (
              <motion.div
                key="disabled"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-muted-foreground/40
                     group-hover:text-muted-foreground/60
                     transition-colors duration-200"
              >
                <Circle className="w-4 h-4" />
              </motion.div>
            )}
      </AnimatePresence>
    </motion.button>
  )
}
