import { createEffect, sample } from 'effector'
import {
  createFlowFx,
  deleteFlowFx,
  editFlowFx,
  loadFlowsListFx,
} from './effects'
import {
  clearActiveFlow,
  createFlow,
  deleteFlow,
  loadFlowsList,
  resetFlowSubscription,
  setActiveFlowId,
  setFlowMetadata,
  setFlowsList,
  setFlowSubscriptionError,
  setFlowSubscriptionStatus,
  updateFlow,
} from './events'
import {
  $activeFlowId,
  $flowSubscriptionError,
  $flowSubscriptionStatus,
} from './stores'

export const initializeFlowsFx = createEffect(async () => {
  const flows = await loadFlowsListFx()
  return flows
})

// Flow List operations
sample({
  clock: loadFlowsList,
  target: loadFlowsListFx,
})
sample({
  clock: loadFlowsListFx.doneData,
  target: setFlowsList,
})

// Flow Create operations
sample({
  clock: createFlow,
  target: createFlowFx,
})
sample({
  clock: createFlowFx.doneData,
  fn: response => response.metadata,
  target: setFlowMetadata,
})

// Flow Update operations
sample({
  clock: updateFlow,
  target: editFlowFx,
})
sample({
  clock: editFlowFx.doneData,
  fn: response => response.metadata,
  target: setFlowMetadata,
})

// Flow Delete operations
sample({
  clock: deleteFlow,
  target: [
    deleteFlowFx,
    // If we need to clear active flow after deletion
    sample({
      clock: deleteFlow,
      source: $activeFlowId,
      filter: (activeId, deletedId) => activeId === deletedId,
      target: clearActiveFlow,
    }),
  ],
})

// Handle active flow
$activeFlowId
  .on(setActiveFlowId, (_, id) => id)
  .reset(clearActiveFlow)

// Handle subscription state
$flowSubscriptionStatus
  .on(setFlowSubscriptionStatus, (_, status) => status)
  .reset(resetFlowSubscription)
  // Reset subscription when active flow changes
  .reset(clearActiveFlow)

$flowSubscriptionError
  .on(setFlowSubscriptionError, (_, error) => error)
  .reset(resetFlowSubscription)
  .reset(clearActiveFlow)
