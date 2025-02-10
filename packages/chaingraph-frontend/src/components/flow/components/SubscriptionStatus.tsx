/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { FlowSubscriptionStatus } from '@/store'
import { useTheme } from '@/components/theme/hooks/useTheme'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface SubscriptionStatusProps {
  status: FlowSubscriptionStatus
  className?: string
}

export function SubscriptionStatus({ status, className }: SubscriptionStatusProps) {
  const { theme } = useTheme()

  const statusConfig = {
    CONNECTING: {
      label: 'Connecting to server...',
      color: 'bg-yellow-500 dark:bg-yellow-600',
      pulseColor: 'bg-yellow-400 dark:bg-yellow-500',
    },
    SUBSCRIBED: {
      label: 'Connected and syncing',
      color: 'bg-emerald-500 dark:bg-emerald-600',
      pulseColor: 'bg-emerald-400 dark:bg-emerald-500',
    },
    ERROR: {
      label: 'Connection error',
      color: 'bg-red-500 dark:bg-red-600',
      pulseColor: 'bg-red-400 dark:bg-red-500',
    },
    DISCONNECTED: {
      label: 'Disconnected',
      color: 'bg-gray-400 dark:bg-gray-600',
      pulseColor: 'bg-gray-300 dark:bg-gray-500',
    },
    IDLE: {
      label: 'Waiting for connection',
      color: 'bg-gray-400 dark:bg-gray-600',
      pulseColor: 'bg-gray-300 dark:bg-gray-500',
    },
  }

  const config = statusConfig[status]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={cn('relative', className)}>
            {/* Static dot */}
            <div className={cn(
              'w-2.5 h-2.5 rounded-full',
              config.color,
              'shadow-lg',
            )}
            />

            {/* Animated pulse effect */}
            {status === 'SUBSCRIBED' && (
              <motion.div
                className={cn(
                  'absolute inset-0 rounded-full',
                  config.pulseColor,
                  'opacity-75',
                )}
                initial={{ scale: 1, opacity: 0.75 }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.75, 0, 0.75],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}

            {/* Connecting animation */}
            {status === 'CONNECTING' && (
              <motion.div
                className={cn(
                  'absolute inset-0 rounded-full',
                  config.pulseColor,
                )}
                animate={{
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}

            {/* Error animation */}
            {status === 'ERROR' && (
              <motion.div
                className={cn(
                  'absolute inset-0 rounded-full',
                  config.pulseColor,
                )}
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="text-xs">{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
