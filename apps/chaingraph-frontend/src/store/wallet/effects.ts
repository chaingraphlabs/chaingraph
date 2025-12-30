/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { ExecutionStatus } from '@badaitech/chaingraph-executor/types'
import { combine, createEvent, createStore, sample } from 'effector'
import { $executionState, clearExecutionState, createExecution, createExecutionFx, startExecution, stopExecution } from '../execution/stores'
import { chainChanged, getWalletContextForExecution, walletConnected, walletDisconnected } from './wallet.store'

// Events
export const enableAutoRecreate = createEvent()
export const disableAutoRecreate = createEvent()

// Store to track if we should auto-recreate executions on wallet change
export const $autoRecreateEnabled = createStore(true)
  .on(enableAutoRecreate, () => true)
  .on(disableAutoRecreate, () => false)

// Track if manual refresh was from running state
const setManualRefreshWasRunning = createEvent<boolean>()
const $manualRefreshWasRunning = createStore(false)
  .on(setManualRefreshWasRunning, (_, wasRunning) => wasRunning)

// Store last execution configuration when execution starts
export const $lastExecutionConfig = createStore<{
  flowId: string
  debugMode: boolean
  archAIIntegration?: any
  wasRunning?: boolean
} | null>(null)

// Capture execution config when creating
sample({
  clock: createExecution,
  source: $executionState,
  fn: (state, options) => {
    const wasRunning = state.status === ExecutionStatus.Running
    const config = {
      flowId: options.flowId,
      debugMode: state.debugMode,
      archAIIntegration: options.archAIIntegration,
      wasRunning,
    }
    return config
  },
  target: $lastExecutionConfig,
})

// Clear config when execution is stopped/completed
sample({
  clock: stopExecution,
  fn: () => null,
  target: $lastExecutionConfig,
})

// Helper to check if execution is active and needs recreation
function needsRecreation(status: ExecutionStatus): boolean {
  return status === ExecutionStatus.Running
    || status === ExecutionStatus.Paused
    || status === ExecutionStatus.Created
}

// When wallet disconnects, stop execution
sample({
  clock: walletDisconnected,
  source: $executionState,
  filter: state => state.executionId !== null && needsRecreation(state.status),
  fn: state => state.executionId!,
  target: stopExecution,
})

// When wallet reconnects, recreate execution if enabled
sample({
  clock: walletConnected,
  source: {
    execution: $executionState,
    config: $lastExecutionConfig,
    autoRecreate: $autoRecreateEnabled,
  },
  filter: ({ execution, config, autoRecreate }) =>
    autoRecreate
    && execution.executionId !== null
    && config !== null
    && needsRecreation(execution.status),
  fn: ({ execution, config }) => {
    // Stop current execution
    if (execution.executionId) {
      stopExecution(execution.executionId)
    }

    // Clear execution state to reset UI
    clearExecutionState()

    // Create new execution with updated wallet context
    const walletContext = getWalletContextForExecution()

    // Small delay to ensure UI updates
    setTimeout(() => {
      createExecution({
        ...config!,
        walletIntegration: walletContext,
      })
    }, 100)
  },
})

// When chain changes, handle based on auto-recreate setting
sample({
  clock: chainChanged,
  source: {
    execution: $executionState,
    config: $lastExecutionConfig,
    autoRecreate: $autoRecreateEnabled,
  },
  filter: ({ execution, config }) =>
    execution.executionId !== null
    && config !== null
    && needsRecreation(execution.status),
  fn: ({ execution, config, autoRecreate }) => {
    // Always stop current execution when chain changes
    if (execution.executionId) {
      stopExecution(execution.executionId)
    }

    // Clear execution state to reset UI
    clearExecutionState()

    // Only recreate if auto-recreate is enabled
    if (autoRecreate) {
      const walletContext = getWalletContextForExecution()

      // Small delay to ensure UI updates
      setTimeout(() => {
        createExecution({
          ...config!,
          walletIntegration: walletContext,
        })
      }, 100)
    }
  },
})

// Auto-start execution after creation if it was running before
sample({
  clock: createExecutionFx.doneData,
  source: combine($lastExecutionConfig, $manualRefreshWasRunning),
  filter: ([config, manualWasRunning]) => (config !== null && config.wasRunning === true) || manualWasRunning,
  fn: ([config, manualWasRunning], executionId) => {
    // Reset manual refresh flag
    if (manualWasRunning) {
      setManualRefreshWasRunning(false)
    }
    return executionId
  },
  target: startExecution,
})

// Export a way to manually trigger recreation
export const recreateExecutionWithCurrentWallet = createEvent()

sample({
  clock: recreateExecutionWithCurrentWallet,
  source: {
    execution: $executionState,
    config: $lastExecutionConfig,
  },
  filter: ({ config }) => config !== null,
  fn: ({ execution, config }) => {
    if (execution.executionId) {
      stopExecution(execution.executionId)
    }

    // Clear execution state to reset UI
    clearExecutionState()

    const walletContext = getWalletContextForExecution()
    const wasRunning = execution.status === ExecutionStatus.Running

    // Track if it was running for auto-start
    setManualRefreshWasRunning(wasRunning)

    // Small delay to ensure UI updates
    setTimeout(() => {
      createExecution({
        flowId: config!.flowId,
        debug: config!.debugMode,
        archAIIntegration: config!.archAIIntegration,
        walletIntegration: walletContext,
      })
    }, 100)
  },
})

/**
 * Export marker to prevent tree-shaking of this side-effect module.
 * This ensures the Effector sample() wiring above is registered in lib builds.
 */
export const WALLET_EFFECTS_INITIALIZED = true
