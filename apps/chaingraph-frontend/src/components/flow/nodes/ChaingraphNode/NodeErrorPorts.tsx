/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import type { PortContextValue } from './ports/context/PortContext'
import { PortComponent } from '@/components/flow/nodes/ChaingraphNode/PortComponent.tsx'
import { cn } from '@/lib/utils'
import { ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { memo, useMemo, useState } from 'react'

export interface NodeErrorPortsProps {
  node: INode
  context: PortContextValue
}

function NodeErrorPorts({
  node,
  context,
}: NodeErrorPortsProps) {
  // Filter error ports from default ports
  const errorPorts = useMemo(() => {
    return node.getDefaultPorts().filter((port) => {
      const metadata = port.getConfig().metadata
      return metadata?.isSystemPort === true && metadata?.portCategory === 'error'
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
  const [isExpanded, setIsExpanded] = useState(false)
  const { getEdgesForPort } = context

  // Only render if we have error ports
  if (!errorPort && !errorMessagePort) {
    return null
  }

  // Render port handle
  // const renderPortHandle = (port: IPort) => {
  //   const config = port.getConfig()
  //   const portId = port.id
  //   const edges = getEdgesForPort(portId)
  //   const isConnected = edges.length > 0
  //
  //   return (
  //     <Handle
  //       type="source"
  //       position={Position.Right}
  //       id={portId}
  //       style={{
  //         right: -5,
  //         background: config.ui?.bgColor || '#e53e3e',
  //         zIndex: 20,
  //       }}
  //       className={cn(
  //         'nodrag',
  //         'w-3 h-3 rounded-full',
  //         'border-2 border-background',
  //         'transition-shadow duration-200',
  //         'data-[connected=true]:shadow-port-connected',
  //       )}
  //       data-connected={isConnected}
  //     />
  //   )
  // }

  return (
    <div className="border-t border-background/20 mt-2">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => !hasConnections && setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between p-2',
          'text-xs text-foreground/70 transition-colors rounded-b',
          hasConnections && 'hover:bg-background/10',
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
