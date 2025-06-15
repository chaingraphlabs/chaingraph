/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { cn } from '@/lib/utils'
import { ExecutionStatus } from '@/store/execution'
import {
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  PauseCircle,
  StopCircle,
  XCircle,
} from 'lucide-react'

interface ExecutionStatusIndicatorProps {
  status: ExecutionStatus
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function ExecutionStatusIndicator({
  status,
  size = 'sm',
  showLabel = false,
  className,
}: ExecutionStatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const getStatusConfig = () => {
    switch (status) {
      case ExecutionStatus.IDLE:
        return {
          icon: Circle,
          color: 'text-gray-400',
          label: 'Idle',
          pulse: false,
        }
      case ExecutionStatus.CREATING:
        return {
          icon: Loader2,
          color: 'text-purple-500',
          label: 'Creating',
          pulse: true,
        }
      case ExecutionStatus.CREATED:
        return {
          icon: Circle,
          color: 'text-muted-foreground',
          label: 'Created',
          pulse: false,
        }
      case ExecutionStatus.RUNNING:
        return {
          icon: Loader2,
          color: 'text-blue-500',
          label: 'Running',
          pulse: true,
        }
      case ExecutionStatus.PAUSED:
        return {
          icon: PauseCircle,
          color: 'text-orange-500',
          label: 'Paused',
          pulse: false,
        }
      case ExecutionStatus.COMPLETED:
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          label: 'Completed',
          pulse: false,
        }
      case ExecutionStatus.ERROR:
        return {
          icon: XCircle,
          color: 'text-red-500',
          label: 'Error',
          pulse: false,
        }
      case ExecutionStatus.STOPPED:
        return {
          icon: StopCircle,
          color: 'text-muted-foreground',
          label: 'Stopped',
          pulse: false,
        }
      default:
        return {
          icon: Clock,
          color: 'text-muted-foreground',
          label: 'Unknown',
          pulse: false,
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Icon
        className={cn(
          sizeClasses[size],
          config.color,
          config.pulse && 'animate-spin',
        )}
      />
      {showLabel && (
        <span className={cn(
          'text-xs font-medium',
          config.color,
        )}
        >
          {config.label}
        </span>
      )}
    </div>
  )
}
