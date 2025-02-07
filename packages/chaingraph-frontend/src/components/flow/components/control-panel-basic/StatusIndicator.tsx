/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionStatus } from './types'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface StatusIndicatorProps {
  status: ExecutionStatus
  breakpointHit: boolean
}

export function StatusIndicator({ status, breakpointHit }: StatusIndicatorProps) {
  const statusConfig = {
    stopped: {
      label: 'Stopped',
      color: 'bg-gray-400 dark:bg-gray-500',
    },
    running: {
      label: 'Running',
      color: 'bg-emerald-500',
    },
    paused: {
      label: breakpointHit ? 'Breakpoint' : 'Paused',
      color: breakpointHit ? 'bg-yellow-500' : 'bg-blue-500',
    },
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-2 px-2">
      <div className="relative">
        <div className={cn(
          'w-2 h-2 rounded-full',
          config.color,
        )}
        />

        {status === 'running' && (
          <motion.div
            className={cn(
              'absolute inset-0 rounded-full',
              config.color,
            )}
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </div>

      <span className="text-xs font-medium text-muted-foreground">
        {config.label}
      </span>
    </div>
  )
}
