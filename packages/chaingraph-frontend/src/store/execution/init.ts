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
  createExecution,
  pauseExecution,
  removeBreakpoint,
  resumeExecution,
  setExecutionError,
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
sample({
  clock: addBreakpoint,
  target: addBreakpointFx,
})

sample({
  clock: removeBreakpoint,
  target: removeBreakpointFx,
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
