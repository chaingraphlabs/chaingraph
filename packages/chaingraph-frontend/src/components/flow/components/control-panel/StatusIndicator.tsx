import { cn } from '@/lib/utils'
import { ExecutionStatus } from '@/store/execution'
import { motion } from 'framer-motion'

interface StatusIndicatorProps {
  status: ExecutionStatus
  debugMode: boolean
}

export function StatusIndicator({ status, debugMode }: StatusIndicatorProps) {
  const statusConfig = {
    [ExecutionStatus.IDLE]: {
      label: 'Idle',
      color: 'bg-gray-400 dark:bg-gray-500',
    },
    [ExecutionStatus.CREATING]: {
      label: 'Creating',
      color: 'bg-blue-500',
    },
    [ExecutionStatus.CREATED]: {
      label: 'Created',
      color: 'bg-emerald-500',
    },
    [ExecutionStatus.RUNNING]: {
      label: 'Running',
      color: 'bg-emerald-500',
    },
    [ExecutionStatus.PAUSED]: {
      label: debugMode ? 'Debug Paused' : 'Paused',
      color: debugMode ? 'bg-yellow-500' : 'bg-blue-500',
    },
    [ExecutionStatus.STOPPED]: {
      label: 'Stopped',
      color: 'bg-gray-400 dark:bg-gray-500',
    },
    [ExecutionStatus.COMPLETED]: {
      label: 'Completed',
      color: 'bg-emerald-500',
    },
    [ExecutionStatus.ERROR]: {
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

        {status === ExecutionStatus.RUNNING && (
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
