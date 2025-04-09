/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventImpl } from '@badaitech/chaingraph-types'
import { ExecutionEventEnum } from '@badaitech/chaingraph-types'
import { useUnit } from 'effector-react'
import { useEffect, useMemo, useState } from 'react'
import { $executionEvents } from 'store/execution'

interface UseExecutionEventsOptions {
  selectedEventTypes?: Set<ExecutionEventEnum>
  bufferTimeMs?: number
  maxEvents?: number
  newestFirst?: boolean
}

export function useExecutionEvents({
  selectedEventTypes = new Set(Object.values(ExecutionEventEnum)),
  bufferTimeMs = 150,
  maxEvents = 1000,
  newestFirst = true,
}: UseExecutionEventsOptions = {}) {
  // Get raw events from the store
  const rawEvents = useUnit($executionEvents)

  // State for buffered events
  const [bufferedEvents, setBufferedEvents] = useState<ExecutionEventImpl[]>([])

  // Set up throttled updates with an interval
  useEffect(() => {
    // Update immediately on first render or when rawEvents change source
    setBufferedEvents(rawEvents)

    // Set up interval for updates
    const intervalId = setInterval(() => {
      setBufferedEvents((current) => {
        // Only update if there are new events
        if (current.length !== rawEvents.length) {
          return rawEvents
        }
        return current
      })
    }, bufferTimeMs)

    return () => clearInterval(intervalId)
  }, [rawEvents, bufferTimeMs])

  // Process events (filter, limit, sort) - only when necessary
  return useMemo(() => {
    // Filter events by selected types
    const filtered = selectedEventTypes.size === Object.values(ExecutionEventEnum).length
      ? bufferedEvents // No filtering needed if all types are selected
      : bufferedEvents.filter(event => selectedEventTypes.has(event.type))

    // Apply limit if needed (keep most recent events)
    let result = filtered.length > maxEvents
      ? filtered.slice(-maxEvents)
      : filtered

    // Apply ordering if requested
    if (newestFirst) {
      result = [...result].reverse()
    }

    return result
  }, [bufferedEvents, selectedEventTypes, maxEvents, newestFirst])
}
