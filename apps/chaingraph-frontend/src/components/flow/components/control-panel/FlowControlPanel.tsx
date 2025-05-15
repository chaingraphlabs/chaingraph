/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { FlowControlPanelProps } from './types'
import { StatusIndicator } from '@/components/flow/components/control-panel/StatusIndicator'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { $archaiConfig } from '@/store'
import {
  $executionState,
  $executionSubscriptionState,
  clearExecutionState,
  createExecution,
  ExecutionStatus,
  isTerminalStatus,
  pauseExecution,
  resumeExecution,
  startExecution,
  stopExecution,
  toggleDebugMode,
} from '@/store/execution'
import { $activeFlowMetadata } from '@/store/flow'
import { PlayIcon, ReloadIcon, StopIcon } from '@radix-ui/react-icons'
import { useUnit } from 'effector-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bug } from 'lucide-react'
import { useCallback } from 'react'
import { DebugControls } from './DebugControls'

const MotionButton = motion(Button)

export function FlowControlPanel({ className }: FlowControlPanelProps) {
  // Get states from stores
  const { status: executionStatus, executionId, debugMode } = useUnit($executionState)
  const { isSubscribed } = useUnit($executionSubscriptionState)
  const activeFlow = useUnit($activeFlowMetadata)
  const archAIConfig = useUnit($archaiConfig)

  // Handlers for execution control
  const handlePlay = useCallback(() => {
    if (!activeFlow?.id)
      return

    if (!executionId || executionStatus === ExecutionStatus.IDLE || isTerminalStatus(executionStatus)) {
      const archAIIntegration = archAIConfig
        ? {
            agentID: archAIConfig.agentID,
            agentSession: archAIConfig.agentSession,
            chatID: archAIConfig.chatID,
            messageID: archAIConfig.messageID,
          }
        : undefined

      // Create new execution
      createExecution({
        flowId: activeFlow.id,
        debug: debugMode,
        archAIIntegration,
      })
    } else if (executionStatus === ExecutionStatus.CREATED) {
      // Start newly created execution
      startExecution(executionId)
    } else if (executionStatus === ExecutionStatus.PAUSED) {
      // Resume execution
      resumeExecution(executionId)
    }
  }, [activeFlow?.id, executionId, executionStatus, debugMode, archAIConfig])

  const handlePause = useCallback(() => {
    if (executionId && executionStatus === ExecutionStatus.RUNNING) {
      pauseExecution(executionId)
    }
  }, [executionId, executionStatus])

  const handleStop = useCallback(() => {
    if (executionId) {
      stopExecution(executionId)
    }
  }, [executionId])

  const handleReset = useCallback(() => {
    clearExecutionState()
  }, [])

  const handleDebugToggle = useCallback(() => {
    toggleDebugMode(!debugMode)
  }, [debugMode])

  const canControl = isSubscribed && !!executionId
  // const canPause = executionStatus === ExecutionStatus.RUNNING
  // const canPlay = !isTerminalStatus(executionStatus)
  //   && (executionStatus === ExecutionStatus.CREATED
  //     || executionStatus === ExecutionStatus.PAUSED)

  return (
    <motion.div
      className={cn(
        'absolute top-4 left-1/2 -translate-x-1/2 z-50',
        'inline-flex items-center justify-center',
        className,
      )}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', duration: 0.5 }}
    >
      <TooltipProvider delayDuration={700}>
        <div className="relative flex items-center justify-center">
          {/* Status Panel (Left Side) */}
          <AnimatePresence>
            {executionStatus !== ExecutionStatus.IDLE && (
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
                <StatusIndicator
                  status={executionStatus}
                  debugMode={debugMode}
                />
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
            {/* Play Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <MotionButton
                  variant="ghost"
                  size="icon"
                  onClick={handlePlay}
                  disabled={!activeFlow?.id || executionStatus === ExecutionStatus.RUNNING}
                  className={cn(
                    'relative rounded-full',
                    executionStatus === ExecutionStatus.RUNNING && 'text-primary',
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="play"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <PlayIcon className="w-4 h-4" />
                    </motion.div>
                  </AnimatePresence>

                  {/* Play button glow effect */}
                  {executionStatus === ExecutionStatus.RUNNING && (
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
                {executionStatus === ExecutionStatus.PAUSED
                  ? 'Resume Flow'
                  : 'Start Flow'}
              </TooltipContent>
            </Tooltip>

            {/* Additional Controls (Visible when running) */}
            <AnimatePresence>
              {executionId && (
                <motion.div
                  className="flex items-center gap-1"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Stop Button */}
                  {executionStatus === ExecutionStatus.RUNNING && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <MotionButton
                          variant="ghost"
                          size="icon"
                          onClick={handleStop}
                          disabled={!canControl}
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
                  )}

                  {/* Reset Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <MotionButton
                        variant="ghost"
                        size="icon"
                        onClick={handleReset}
                        // disabled={!canControl}
                        className="rounded-full"
                        whileHover={{ rotate: 180 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <ReloadIcon className="w-4 h-4" />
                      </MotionButton>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Reset Execution
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Debug Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <MotionButton
                  variant={debugMode ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={handleDebugToggle}
                  disabled={!activeFlow?.id}
                  className={cn(
                    'rounded-full',
                    debugMode && 'text-yellow-500 dark:text-yellow-400',
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Bug className="w-4 h-4" />
                </MotionButton>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {debugMode ? 'Disable Debug Mode' : 'Enable Debug Mode'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Debug Controls (Right Side) */}
          <AnimatePresence>
            {debugMode
              && executionId
              && executionStatus !== ExecutionStatus.COMPLETED
              && executionStatus !== ExecutionStatus.ERROR && (
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
                  executionId={executionId}
                  canControl={canControl}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </TooltipProvider>
    </motion.div>
  )
}
