/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import { ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { useUnit } from 'effector-react'
import { memo, useCallback, useMemo, useRef } from 'react'
import { PortComponent } from '@/components/flow/nodes/ChaingraphNode/PortComponent'
import { trace } from '@/lib/perf-trace'
import { cn } from '@/lib/utils'
import { usePortEdges } from '@/store/nodes/computed'
import { $activeFlowId } from '@/store/flow'
import { updateNodeUI } from '@/store/nodes'

export interface NodeErrorPortsProps {
  node: INode
}

function NodeErrorPorts({
  node,
}: NodeErrorPortsProps) {
  // Trace render (synchronous - measures render function time)
  const renderCountRef = useRef(0)
  const traceSpanId = useRef<string | null>(null)
  if (trace.isEnabled()) {
    renderCountRef.current++
    traceSpanId.current = trace.start('render.NodeErrorPorts', {
      category: 'render',
      tags: { nodeId: node.id, renderCount: renderCountRef.current },
    })
  }

  const activeFlowId = useUnit($activeFlowId)

  // Filter error ports from default ports
  const errorPorts = useMemo(() => {
    return node.getDefaultPorts().filter((port) => {
      return port.isSystemError()
    })
  }, [node])

  // Get specific error ports
  const errorPort = useMemo(() =>
    errorPorts.find(port => port.getConfig().key === '__error'), [errorPorts])

  const errorMessagePort = useMemo(() =>
    errorPorts.find(port => port.getConfig().key === '__errorMessage'), [errorPorts])

  // Use granular edge hooks
  const errorEdges = usePortEdges(node.id, errorPort?.id || '')
  const errorMessageEdges = usePortEdges(node.id, errorMessagePort?.id || '')

  const errorConnections = useMemo(() => {
    return errorPort && errorEdges.length > 0
  }, [errorPort, errorEdges])

  const errorMessageConnections = useMemo(() => {
    return errorMessagePort && errorMessageEdges.length > 0
  }, [errorMessagePort, errorMessageEdges])

  const hasConnections = useMemo(
    () => errorConnections || errorMessageConnections,
    [errorConnections, errorMessageConnections],
  )

  const isExpanded = useMemo(() => {
    return node.metadata.ui?.state?.isErrorPortCollapsed !== undefined
      && !node.metadata.ui?.state?.isErrorPortCollapsed
  }, [node.metadata.ui?.state?.isErrorPortCollapsed])

  const onToggle = useCallback(() => {
    if (!activeFlowId) {
      return
    }

    updateNodeUI({
      flowId: activeFlowId,
      nodeId: node.id,
      ui: {
        state: {
          isErrorPortCollapsed: isExpanded,
        },
      },
      version: node.getVersion() + 1,
    })
  }, [activeFlowId, node, isExpanded])

  // Only render if we have error ports
  if (!errorPort && !errorMessagePort) {
    if (traceSpanId.current) trace.end(traceSpanId.current)
    return null
  }

  // End trace BEFORE return (synchronous measurement)
  if (traceSpanId.current) trace.end(traceSpanId.current)

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
          {errorPort && (
            <PortComponent
              key={errorPort.id}
              nodeId={node.id}
              portId={errorPort.id}
            />
          )}

          {/* Error Message Port */}
          {errorMessagePort && (
            <PortComponent
              key={errorMessagePort.id}
              nodeId={node.id}
              portId={errorMessagePort.id}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default memo(NodeErrorPorts)
