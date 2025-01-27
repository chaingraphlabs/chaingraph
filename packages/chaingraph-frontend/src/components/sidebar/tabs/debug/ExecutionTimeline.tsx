import type { ExecutionEvent, ExecutionEventEnum } from '@chaingraph/types'
import { AnimatePresence, motion } from 'framer-motion'
import { TimelineEvent } from './TimelineEvent'

interface ExecutionTimelineProps {
  events: ExecutionEvent[]
  selectedEventTypes: Set<ExecutionEventEnum>
}

export function ExecutionTimeline({
  events,
  selectedEventTypes,
}: ExecutionTimelineProps) {
  const filteredEvents = events.filter(event =>
    selectedEventTypes.has(event.type),
  )

  // Group events by minute for better organization
  const groupedEvents = groupEventsByTime(filteredEvents)

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

      {/* Events */}
      <AnimatePresence mode="popLayout">
        {Object.entries(groupedEvents).map(([timestamp, timeEvents]) => (
          <div key={timestamp} className="mb-4">
            {/* Time Group Header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-10 mb-2 text-xs text-muted-foreground"
            >
              {new Date(Number.parseInt(timestamp)).toLocaleTimeString()}
            </motion.div>

            {/* Events in this time group */}
            {timeEvents.map((event, index) => (
              <motion.div
                key={event.index}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="relative pl-10 pb-1"
              >
                <TimelineEvent
                  event={event}
                  isGrouped={index !== 0}
                />
              </motion.div>
            ))}
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function groupEventsByTime(events: ExecutionEvent[]): Record<string, ExecutionEvent[]> {
  const groups: Record<string, ExecutionEvent[]> = {}

  events.forEach((event) => {
    // Group by minute
    const timestamp = new Date(event.timestamp)
    timestamp.setSeconds(0)
    timestamp.setMilliseconds(0)

    const key = timestamp.getTime().toString()
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(event)
  })

  return groups
}
