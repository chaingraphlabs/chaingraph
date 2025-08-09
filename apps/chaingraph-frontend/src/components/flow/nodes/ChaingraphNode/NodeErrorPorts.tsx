/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import type { PortContextValue } from './ports/context/PortContext'
import { PortComponent } from '@/components/flow/nodes/ChaingraphNode/PortComponent'
import { cn } from '@/lib/utils'
import { $activeFlowId } from '@/store/flow'
import { updateNodeUI } from '@/store/nodes'
import { ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { useUnit } from 'effector-react'
import { memo, useCallback, useMemo } from 'react'

export interface NodeErrorPortsProps {
  node: INode
  context: PortContextValue
}

function NodeErrorPorts({
  node,
  context,
}: NodeErrorPortsProps) {
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

  const errorConnections = useMemo(() => {
    return errorPort && context.getEdgesForPort(errorPort.id).length > 0
  }, [context, errorPort])

  const errorMessageConnections = useMemo(() => {
    return errorMessagePort && context.getEdgesForPort(errorMessagePort.id).length > 0
  }, [context, errorMessagePort])

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
    return null
  }

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
              node={node}
              port={errorPort}
              context={context}
            />
          )}

          {/* Error Message Port */}
          {errorMessagePort && (
            <PortComponent
              key={errorMessagePort.id}
              node={node}
              port={errorMessagePort}
              context={context}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default memo(NodeErrorPorts)
