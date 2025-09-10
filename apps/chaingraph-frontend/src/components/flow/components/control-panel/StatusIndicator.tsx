/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { cn } from '@/lib/utils'
import { ExecutionStatus } from '@badaitech/chaingraph-executor/types'
import { motion } from 'framer-motion'

interface StatusIndicatorProps {
  status: ExecutionStatus
  debugMode: boolean
}

export function StatusIndicator({ status, debugMode }: StatusIndicatorProps) {
  const statusConfig = {
    [ExecutionStatus.Idle]: {
      label: 'Idle',
      color: 'bg-gray-400 dark:bg-gray-500',
    },
    [ExecutionStatus.Creating]: {
      label: 'Creating',
      color: 'bg-blue-500',
    },
    [ExecutionStatus.Created]: {
      label: 'Created',
      color: 'bg-emerald-500',
    },
    [ExecutionStatus.Running]: {
      label: 'Running',
      color: 'bg-emerald-500',
    },
    [ExecutionStatus.Paused]: {
      label: debugMode ? 'Debug Paused' : 'Paused',
      color: debugMode ? 'bg-yellow-500' : 'bg-blue-500',
    },
    [ExecutionStatus.Stopped]: {
      label: 'Stopped',
      color: 'bg-gray-400 dark:bg-gray-500',
    },
    [ExecutionStatus.Completed]: {
      label: 'Completed',
      color: 'bg-emerald-500',
    },
    [ExecutionStatus.Failed]: {
      label: 'Error',
      color: 'bg-red-500',
    },
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <div className="relative">
        <div className={cn(
          'w-2 h-2 rounded-full',
          config.color,
        )}
        />

        {status === ExecutionStatus.Running && (
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
