import type { Event } from 'effector'
import { createEvent, createStore, sample } from 'effector'

/**
 * Configuration for accumulateAndSample operator
 * @template T Type of the value being processed
 * @property timeout Time in milliseconds between emissions
 * @property getKey Function to get a unique key for grouping events
 * @property source Source event to sample from
 */
interface AccumulateAndSampleConfig<T> {
  timeout: number
  getKey: (payload: T) => string
  source: Event<T>
}

/**
 * Creates an operator that accumulates the latest values for each key and emits them
 * at a controlled rate. This is useful for high-frequency events like mouse movements
 * where you want to:
 * 1. Limit the rate of updates (e.g., to 60fps)
 * 2. Always use the latest value when emitting
 * 3. Handle multiple independent streams (grouped by key)
 *
 * Unlike regular throttle:
 * - Guarantees that the latest value is used
 * - Supports multiple independent streams via keys
 * - Only emits when new values arrive
 *
 * @example
 * ```typescript
 * // Handle mouse movements at 60fps
 * const throttledMove = accumulateAndSample({
 *   source: mouseMoveEvent,
 *   timeout: 1000 / 60, // 60fps
 *   getKey: () => 'mouse'
 * })
 *
 * // Handle multiple elements' positions
 * const throttledPositions = accumulateAndSample({
 *   source: elementMoveEvent,
 *   timeout: 16,
 *   getKey: (payload) => payload.elementId
 * })
 * ```
 */
export function accumulateAndSample<T>({
  timeout,
  getKey,
  source,
}: AccumulateAndSampleConfig<T>): Event<T> {
  // Create events for result emission and store reset
  const result = createEvent<T>()
  const resetStores = createEvent()

  /**
   * Store containing the latest state for each key:
   * - value: The latest value received
   * - lastEmitted: Timestamp of last emission
   * - hasNewValue: Flag indicating if new data arrived since last emission
   */
  const $values = createStore<Map<string, {
    value: T
    lastEmitted: number
    hasNewValue: boolean
  }>>(new Map())

  // Update values store when new events arrive
  $values.on(source, (state, payload) => {
    const newState = new Map(state)
    const key = getKey(payload)
    const existing = newState.get(key)

    newState.set(key, {
      value: payload, // Store the new value
      lastEmitted: existing?.lastEmitted ?? 0, // Preserve or initialize last emission time
      hasNewValue: true, // Mark that we have new data to emit
    })

    return newState
  })

  // Reset store when cleanup is called
  $values.reset(resetStores)

  /**
   * Main update loop that checks for values that need to be emitted.
   * Uses requestAnimationFrame for better performance and browser throttling.
   *
   * For each key:
   * 1. Checks if enough time has passed since last emission
   * 2. Checks if there's new data to emit
   * 3. Emits value and updates state if conditions are met
   */
  const checkUpdates = () => {
    const values = $values.getState()
    const now = Date.now()

    values.forEach((data, key) => {
      // Emit only if we have new data and enough time has passed
      if (data.hasNewValue && now - data.lastEmitted >= timeout) {
        result(data.value)
        data.lastEmitted = now
        data.hasNewValue = false
      }
    })

    // Continue the update loop
    requestAnimationFrame(checkUpdates)
  }

  // Control flag to prevent multiple RAF loops
  let isRunning = false

  // Start the update loop when first value arrives
  sample({
    clock: source,
    fn: () => {
      if (!isRunning) {
        isRunning = true
        requestAnimationFrame(checkUpdates)
      }
      return null
    },
    filter: Boolean,
  })

  /**
   * Cleanup function that stops the update loop and resets state.
   * Should be called when the operator is no longer needed to prevent memory leaks.
   */
  function cleanup(): void {
    isRunning = false
    resetStores()
  }

  // Attach cleanup method to the resulting event
  (result as any).cleanup = cleanup

  return result
}
