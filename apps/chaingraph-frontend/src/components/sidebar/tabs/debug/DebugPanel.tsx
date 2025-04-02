/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { ScrollArea } from '@/components/ui/scroll-area'
import { $activeFlowMetadata } from '@/store'
import { $executionState, $highlightedEdgeId } from '@/store/execution'
import { ExecutionEventEnum } from '@badaitech/chaingraph-types'
import { useUnit } from 'effector-react'
import { useState } from 'react'
import { ExecutionTimeline } from './ExecutionTimeline'
import { FilterBar } from './FilterBar'

export function DebugPanel() {
  const activeFlow = useUnit($activeFlowMetadata)
  const highlightedEdgeId = useUnit($highlightedEdgeId)
  const { executionId, events: executionEvents } = useUnit($executionState)

  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<ExecutionEventEnum>>(
    new Set(Object.values(ExecutionEventEnum)),
  )

  if (!activeFlow) {
    return
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-4">Execution Log</h2>
        {/* execution id title: */}
        {executionId && (
          <div className="flex items-center mb-2">
            <span className="text-sm text-gray-500 mr-1">Execution ID: </span>
            <span className="text-sm font-semibold">{executionId}</span>
          </div>
        )}
        <FilterBar
          selectedTypes={selectedEventTypes}
          onSelectionChange={setSelectedEventTypes}
        />
      </div>

      <ScrollArea className="flex-1 p-4">
        <ExecutionTimeline
          events={executionEvents}
          selectedEventTypes={selectedEventTypes}
        />
      </ScrollArea>
    </div>
  )
}
