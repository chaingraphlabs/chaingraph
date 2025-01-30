import { $autoStartConditions, $executionState, $startAttempted } from '@/store/execution/stores.ts'
import {
  ExecutionStatus,
  ExecutionSubscriptionStatus,
  isTerminalStatus,
} from '@/store/execution/types.ts'
import { sample } from 'effector'
import {
  addBreakpointFx,
  createExecutionFx,
  pauseExecutionFx,
  removeBreakpointFx,
  resumeExecutionFx,
  startExecutionFx,
  stepExecutionFx,
  stopExecutionFx,
} from './effects'
import {
  addBreakpoint,
  clearExecutionState,
  createExecution,
  markStartAttempted,
  pauseExecution,
  removeBreakpoint,
  resetAutoStart,
  resumeExecution,
  setExecutionError,
  setExecutionSubscriptionStatus,
  startExecution,
  stepExecution,
  stopExecution,
} from './events'

// Handle execution creation
sample({
  clock: createExecution,
  target: createExecutionFx,
})

// Handle execution control
sample({
  clock: startExecution,
  target: startExecutionFx,
})

sample({
  clock: pauseExecution,
  target: pauseExecutionFx,
})

sample({
  clock: resumeExecution,
  target: resumeExecutionFx,
})

sample({
  clock: stopExecution,
  target: stopExecutionFx,
})

// Handle debug operations
// sample({
//   clock: addBreakpoint,
//   target: addBreakpointFx,
// })
//
// sample({
//   clock: removeBreakpoint,
//   target: removeBreakpointFx,
// })

$executionState
  .on(addBreakpoint, (state, { nodeId }) => ({
    ...state,
    breakpoints: new Set([...state.breakpoints, nodeId]),
  }))
  .on(removeBreakpoint, (state, { nodeId }) => {
    const newBreakpoints = new Set(state.breakpoints)
    newBreakpoints.delete(nodeId)
    return {
      ...state,
      breakpoints: newBreakpoints,
    }
  })

sample({
  clock: stepExecution,
  target: stepExecutionFx,
})

// Handle errors
sample({
  clock: [
    createExecutionFx.failData,
    startExecutionFx.failData,
    pauseExecutionFx.failData,
    resumeExecutionFx.failData,
    stopExecutionFx.failData,
    addBreakpointFx.failData,
    removeBreakpointFx.failData,
    stepExecutionFx.failData,
  ],
  fn: error => ({
    message: error.message,
    timestamp: new Date(),
  }),
  target: setExecutionError,
})

// Handle terminal status
// sample({
//   clock: [
//     // Update status events from execution
//     $executionState.updates.map(state => state.status),
//   ],
//   filter: (status): status is ExecutionStatus =>
//     status !== undefined && isTerminalStatus(status),
//   target: clearExecutionState,
// })

// Add cleanup on subscription end
// sample({
//   clock: setExecutionSubscriptionStatus,
//   filter: status => status === ExecutionSubscriptionStatus.DISCONNECTED,
//   target: clearExecutionState,
// })

// Handle start attempt tracking
$startAttempted
  .on(markStartAttempted, () => true)
  .reset([
    resetAutoStart,
    createExecution,
    // Reset on terminal states
    sample({
      clock: $executionState,
      filter: state => isTerminalStatus(state.status),
    }),
  ])

// Auto-start logic
sample({
  clock: $autoStartConditions,
  source: $startAttempted,
  filter: (attempted, conditions) => {
    return (
      !attempted
      && conditions.executionStatus === ExecutionStatus.CREATED
      && conditions.subscriptionStatus === ExecutionSubscriptionStatus.SUBSCRIBED
      && !conditions.hasError
      && conditions.executionId !== null
    )
  },
  fn: (_, conditions) => conditions.executionId!,
  target: [
    startExecution,
    markStartAttempted,
  ],
})

// Reset auto-start when needed
sample({
  clock: [
    createExecution,
    clearExecutionState,
    // Add reset when subscription disconnects
    sample({
      clock: setExecutionSubscriptionStatus,
      filter: status => status === ExecutionSubscriptionStatus.DISCONNECTED,
    }),
  ],
  target: resetAutoStart,
})
