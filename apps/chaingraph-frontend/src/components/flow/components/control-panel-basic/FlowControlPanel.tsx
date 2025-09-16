/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionStatus } from './types'
import {
  PauseIcon,
  PlayIcon,
  ReloadIcon,
  StopIcon,
} from '@radix-ui/react-icons'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bug,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { DebugControls } from './DebugControls'
import { StatusIndicator } from './StatusIndicator'

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

  // Mock function to simulate breakpoint hit
  const simulateBreakpointHit = useCallback(() => {
    setStatus('paused')
    setBreakpointHit(true)
  }, [])

  return (
    <motion.div
      className={cn(
        'absolute top-4 left-1/3 -translate-x-1/2 z-50',
        'flex items-center gap-2 p-1',
        'bg-background/80 dark:bg-card/80 backdrop-blur-sm',
        'border border-border rounded-lg shadow-lg',
        'dark:border-border/30',
      )}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', duration: 0.5 }}
    >
      {/* Main Controls */}
      <div className="flex items-center gap-1">
        <StatusIndicator status={status} breakpointHit={breakpointHit} />

        <Separator orientation="vertical" className="h-8" />

        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={status === 'running' ? handlePause : handlePlay}
          className={cn(
            'relative',
            status === 'running' && 'text-primary',
          )}
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
                ? (
                    <PauseIcon className="w-4 h-4" />
                  )
                : (
                    <PlayIcon className="w-4 h-4" />
                  )}
            </motion.div>
          </AnimatePresence>

          {/* Play button glow effect */}
          {status === 'running' && (
            <motion.div
              className="absolute inset-0 rounded-md bg-primary/20"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </Button>

        {/* Stop Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleStop}
          disabled={status === 'stopped'}
        >
          <StopIcon className="w-4 h-4" />
        </Button>

        {/* Reset Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleStop}
          disabled={status === 'stopped'}
        >
          <ReloadIcon className="w-4 h-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Debug Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant={isDebugMode ? 'secondary' : 'ghost'}
          size="icon"
          onClick={handleDebugToggle}
          className={cn(
            isDebugMode && 'text-yellow-500 dark:text-yellow-400',
          )}
        >
          {/* <DebugIcon className="w-4 h-4" /> */}
          <Bug className="w-4 h-4" />
        </Button>

        <AnimatePresence>
          {isDebugMode && (
            <DebugControls
              status={status}
              breakpointHit={breakpointHit}
              onStepOver={() => {
                simulateBreakpointHit()
              }}
              onStepInto={() => {
                simulateBreakpointHit()
              }}
              onStepOut={() => {
                simulateBreakpointHit()
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
