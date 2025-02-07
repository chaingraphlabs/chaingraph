import type { ExecutionEventEnum, ExecutionEventImpl } from '@badaitech/chaingraph-types'
import { EventCard } from './EventCard'

interface ExecutionTimelineProps {
  events: ExecutionEventImpl[]
  selectedEventTypes: Set<ExecutionEventEnum>
}

export function ExecutionTimeline({
  events,
  selectedEventTypes,
}: ExecutionTimelineProps) {
  const filteredEvents = events.filter(event =>
    selectedEventTypes.has(event.type),
  )

  return (
    <div className="space-y-1">
      {filteredEvents.map((event, index) => (
        <EventCard
          key={event.index}
          event={event}
          index={index}
        />
      ))}
    </div>
  )
}
