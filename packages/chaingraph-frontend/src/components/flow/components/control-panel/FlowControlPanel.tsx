import type { ExecutionStatus } from './types'
import { StatusIndicator } from '@/components/flow/components/control-panel/StatusIndicator.tsx'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  PauseIcon,
  PlayIcon,
  ReloadIcon,
  StopIcon,
} from '@radix-ui/react-icons'
import { AnimatePresence, motion } from 'framer-motion'
import { Bug } from 'lucide-react'
import { useCallback, useState } from 'react'
import { DebugControls } from './DebugControls'

const MotionButton = motion(Button)

export function FlowControlPanel() {
  const [status, setStatus] = useState<ExecutionStatus>('stopped')
  const [isDebugMode, setIsDebugMode] = useState(false)
  const [breakpointHit, setBreakpointHit] = useState(false)

  const handlePlay = useCallback(() => {
    if (status === 'stopped' || status === 'paused') {
      setStatus('running')
      setBreakpointHit(false)
    }
  }, [status])

  const handlePause = useCallback(() => {
    if (status === 'running') {
      setStatus('paused')
    }
  }, [status])

  const handleStop = useCallback(() => {
    setStatus('stopped')
    setBreakpointHit(false)
  }, [])

  const handleDebugToggle = useCallback(() => {
    setIsDebugMode(!isDebugMode)
  }, [isDebugMode])

  const simulateBreakpointHit = useCallback(() => {
    setStatus('paused')
    setBreakpointHit(true)
  }, [])

  return (
    <motion.div
      className={cn(
        'absolute top-4 left-1/2 -translate-x-1/2 z-50',
        'inline-flex items-center justify-center',
      )}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', duration: 0.5 }}
    >
      <TooltipProvider delayDuration={700}>
        <div className="relative flex items-center justify-center">
          {/* Status Panel (Left Side) */}
          <AnimatePresence>
            {status !== 'stopped' && (
              <motion.div
                className={cn(
                  'absolute right-full mr-2',
                  'bg-background/80 dark:bg-card/80 backdrop-blur-sm',
                  'border border-border rounded-full shadow-lg',
                  'dark:border-border/30 px-2',
                )}
                initial={{ x: 20, opacity: 0, scale: 0.8 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: 20, opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', duration: 0.4 }}
              >
                <StatusIndicator status={status} breakpointHit={breakpointHit} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Control Panel */}
          <div
            className={cn(
              'bg-background/80 dark:bg-card/80 backdrop-blur-sm',
              'border border-border rounded-full shadow-lg',
              'dark:border-border/30',
              'p-1 flex items-center gap-1',
            )}
          >
            {/* Play/Pause Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <MotionButton
                  variant="ghost"
                  size="icon"
                  onClick={status === 'running' ? handlePause : handlePlay}
                  className={cn(
                    'relative rounded-full',
                    status === 'running' && 'text-primary',
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={status === 'running' ? 'pause' : 'play'}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {status === 'running'
                        ? <PauseIcon className="w-4 h-4" />
                        : <PlayIcon className="w-4 h-4" />}
                    </motion.div>
                  </AnimatePresence>

                  {/* Play button glow effect */}
                  {status === 'running' && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/20"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0.2, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                </MotionButton>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {status === 'running' ? 'Pause Flow' : 'Start Flow'}
              </TooltipContent>
            </Tooltip>

            {/* Additional Controls (Visible when running) */}
            <AnimatePresence>
              {status !== 'stopped' && (
                <motion.div
                  className="flex items-center gap-1"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Stop Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <MotionButton
                        variant="ghost"
                        size="icon"
                        onClick={handleStop}
                        className="rounded-full"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <StopIcon className="w-4 h-4" />
                      </MotionButton>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Stop Flow
                    </TooltipContent>
                  </Tooltip>

                  {/* Reset Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <MotionButton
                        variant="ghost"
                        size="icon"
                        onClick={handleStop}
                        className="rounded-full"
                        whileHover={{ rotate: 180 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <ReloadIcon className="w-4 h-4" />
                      </MotionButton>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Reset Flow State
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Debug Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <MotionButton
                  variant={isDebugMode ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={handleDebugToggle}
                  className={cn(
                    'rounded-full',
                    isDebugMode && 'text-yellow-500 dark:text-yellow-400',
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Bug className="w-4 h-4" />
                </MotionButton>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {isDebugMode ? 'Disable Debug Mode' : 'Enable Debug Mode'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Debug Controls (Right Side) */}
          <AnimatePresence>
            {isDebugMode && (
              <motion.div
                className={cn(
                  'absolute left-full ml-2',
                  'bg-background/80 dark:bg-card/80 backdrop-blur-sm',
                  'border border-border rounded-full shadow-lg',
                  'dark:border-border/30 p-1',
                )}
                initial={{ x: -20, opacity: 0, scale: 0.8 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -20, opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', duration: 0.4 }}
              >
                <DebugControls
                  status={status}
                  breakpointHit={breakpointHit}
                  onStepOver={() => {
                    console.log('Step over')
                    simulateBreakpointHit()
                  }}
                  onStepInto={() => {
                    console.log('Step into')
                    simulateBreakpointHit()
                  }}
                  onStepOut={() => {
                    console.log('Step out')
                    simulateBreakpointHit()
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </TooltipProvider>
    </motion.div>
  )
}
