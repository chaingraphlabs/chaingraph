import type { ExecutionEvent } from '@chaingraph/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { $activeFlowMetadata } from '@/store'
import { nodeRegistry } from '@chaingraph/nodes'
import { Edge, ExecutionContext, ExecutionEventEnum, Flow } from '@chaingraph/types'
import { useUnit } from 'effector-react'
import { useState } from 'react'
import { ExecutionTimeline } from './ExecutionTimeline'
import { FilterBar } from './FilterBar'

export function DebugPanel() {
  const activeFlow = useUnit($activeFlowMetadata)

  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<ExecutionEventEnum>>(
    new Set(Object.values(ExecutionEventEnum)),
  )

  if (!activeFlow) {
    return
  }

  const context = new ExecutionContext(activeFlow?.id ?? '', new AbortController())

  const node1 = nodeRegistry.createNode('BranchNode', 'node-1')
  const node2 = nodeRegistry.createNode('BranchNode', 'node-2')
  const edge1 = new Edge(
    'edge-1',
    node1,
    node1.getOutputs()[0],
    node2,
    node2.getInputs()[0],
    {},
  )

  // Mock events for demonstration
  const mockEvents: ExecutionEvent[] = [
    {
      index: 1,
      type: ExecutionEventEnum.FLOW_STARTED,
      timestamp: new Date(Date.now() - 5000),
      context,
      data: {
        flow: new Flow(activeFlow!),
      },
    },
    {
      index: 2,
      type: ExecutionEventEnum.NODE_STARTED,
      timestamp: new Date(Date.now() - 4000),
      context,
      data: {
        node: node1,
      },
    },
    {
      index: 3,
      type: ExecutionEventEnum.NODE_COMPLETED,
      timestamp: new Date(Date.now() - 3800),
      context,
      data: {
        node: node2,
        executionTime: 200,
      },
    },
    {
      index: 4,
      type: ExecutionEventEnum.EDGE_TRANSFER_STARTED,
      timestamp: new Date(Date.now() - 3700),
      context,
      data: {
        edge: edge1,
      },
    },
    {
      index: 5,
      type: ExecutionEventEnum.EDGE_TRANSFER_STARTED,
      timestamp: new Date(Date.now() - 3700),
      context,
      data: {
        edge: edge1,
      },
    },
    {
      index: 6,
      type: ExecutionEventEnum.EDGE_TRANSFER_COMPLETED,
      timestamp: new Date(Date.now() - 3600),
      context,
      data: {
        edge: edge1,
        transferTime: 100,
      },
    },
    {
      index: 7,
      type: ExecutionEventEnum.NODE_STARTED,
      timestamp: new Date(Date.now() - 3500),
      context,
      data: {
        node: node1,
      },
    },
    {
      index: 8,
      type: ExecutionEventEnum.DEBUG_BREAKPOINT_HIT,
      timestamp: new Date(Date.now() - 3400),
      context,
      data: {
        node: node2,
      },
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-4">Execution Log</h2>
        <FilterBar
          selectedTypes={selectedEventTypes}
          onSelectionChange={setSelectedEventTypes}
        />
      </div>

      <ScrollArea className="flex-1 p-4">
        <ExecutionTimeline
          events={mockEvents}
          selectedEventTypes={selectedEventTypes}
        />
      </ScrollArea>
    </div>
  )
}
