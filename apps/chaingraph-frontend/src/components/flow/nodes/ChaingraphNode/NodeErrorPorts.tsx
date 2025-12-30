/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { useUnit } from 'effector-react'
import { memo, useCallback, useMemo, useRef } from 'react'
import { PortComponent } from '@/components/flow/nodes/ChaingraphNode/PortComponent'
import { trace } from '@/lib/perf-trace'
import { cn } from '@/lib/utils'
import { $activeFlowId } from '@/store/flow'
import { updateNodeUI } from '@/store/nodes'
import { usePortEdges } from '@/store/nodes/computed'
import { useXYFlowNodeErrorPorts } from '@/store/xyflow'

export interface NodeErrorPortsProps {
  nodeId: string
}

function NodeErrorPorts({ nodeId }: NodeErrorPortsProps) {
  // Trace render (synchronous - measures render function time)
  const renderCountRef = useRef(0)
  const traceSpanId = useRef<string | null>(null)
  if (trace.isEnabled()) {
    renderCountRef.current++
    traceSpanId.current = trace.start('render.NodeErrorPorts', {
      category: 'render',
      tags: { nodeId, renderCount: renderCountRef.current },
    })
  }

  // Granular subscription - only 4 fields (errorPortId, errorMessagePortId, isErrorPortCollapsed, version)
  // Component only re-renders when these specific fields change
  const portData = useXYFlowNodeErrorPorts(nodeId)

  const activeFlowId = useUnit($activeFlowId)

  const { errorPortId, errorMessagePortId, isErrorPortCollapsed, version } = portData

  // Use granular edge hooks
  const errorEdges = usePortEdges(nodeId, errorPortId || '')
  const errorMessageEdges = usePortEdges(nodeId, errorMessagePortId || '')

  const errorConnections = useMemo(() => {
    return errorPortId && errorEdges.length > 0
  }, [errorPortId, errorEdges])

  const errorMessageConnections = useMemo(() => {
    return errorMessagePortId && errorMessageEdges.length > 0
  }, [errorMessagePortId, errorMessageEdges])

  const hasConnections = useMemo(
    () => errorConnections || errorMessageConnections,
    [errorConnections, errorMessageConnections],
  )

  // isExpanded: true when NOT collapsed
  const isExpanded = !isErrorPortCollapsed

  const onToggle = useCallback(() => {
    if (!activeFlowId) {
      return
    }

    updateNodeUI({
      flowId: activeFlowId,
      nodeId,
      ui: {
        state: {
          isErrorPortCollapsed: isExpanded,
        },
      },
      version: (version || 0) + 1,
    })
  }, [activeFlowId, nodeId, isExpanded, version])

  // Only render if we have error ports
  if (!errorPortId && !errorMessagePortId) {
    if (traceSpanId.current)
      trace.end(traceSpanId.current)
    return null
  }

  // End trace BEFORE return (synchronous measurement)
  if (traceSpanId.current)
    trace.end(traceSpanId.current)

  return (
    <div className="border-t border-background/20">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => !hasConnections && onToggle()}
        className={cn(
          'w-full flex items-center justify-between p-2',
          'text-xs text-foreground/70 transition-colors rounded-b',
          hasConnections && 'hover:bg-background/10',
          'nodrag',
        )}
      >
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="text-red-500 w-3.5 h-3.5" />
          <span>Error Handling</span>
        </div>
        {!hasConnections && (
          isExpanded
            ? (
                <ChevronUpIcon className="w-3.5 h-3.5" />
              )
            : (
                <ChevronDownIcon className="w-3.5 h-3.5" />
              )
        )}
      </button>

      {/* Expandable Content */}
      {(isExpanded || hasConnections) && (
        <div className="px-3 py-2 space-y-3 bg-background/5 rounded-b">
          {/* Error Port */}
          {errorPortId && (
            <PortComponent
              key={errorPortId}
              nodeId={nodeId}
              portId={errorPortId}
            />
          )}

          {/* Error Message Port */}
          {errorMessagePortId && (
            <PortComponent
              key={errorMessagePortId}
              nodeId={nodeId}
              portId={errorMessagePortId}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default memo(NodeErrorPorts)
