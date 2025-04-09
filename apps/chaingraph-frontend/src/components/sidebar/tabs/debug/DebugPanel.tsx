/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { ScrollArea } from '@/components/ui/scroll-area'
import { useExecutionEvents } from '@/store/execution/hooks/useExecutionEvents'
import { ExecutionEventEnum } from '@badaitech/chaingraph-types'
import { useUnit } from 'effector-react'
import { useState } from 'react'
import { $activeFlowMetadata } from 'store'
import { $executionState } from 'store/execution'
import { ExecutionTimeline } from './ExecutionTimeline'
import { FilterBar } from './FilterBar'

export function DebugPanel() {
  const activeFlow = useUnit($activeFlowMetadata)
  const { executionId } = useUnit($executionState)
  // const executionEvents = useUnit($executionEvents)

  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<ExecutionEventEnum>>(
    new Set(Object.values(ExecutionEventEnum)),
  )

  const executionEvents = useExecutionEvents({
    selectedEventTypes,
    bufferTimeMs: 250,
    maxEvents: 1000,
    newestFirst: true,
  })

  if (!activeFlow) {
    return
  }

  return (
    <div className="flex flex-col h-full w-full">
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

      <div className="flex items-center mb-2  w-full">
        <ScrollArea className="flex-1 p-4">
          <ExecutionTimeline
            events={executionEvents}
            selectedEventTypes={selectedEventTypes}
          />
        </ScrollArea>
      </div>
    </div>
  )
}
