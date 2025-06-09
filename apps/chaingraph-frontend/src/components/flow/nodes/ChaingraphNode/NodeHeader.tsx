/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryIconName } from '@badaitech/chaingraph-nodes'
import type { CategoryStyle, INode, NodeStatus } from '@badaitech/chaingraph-types'
import type { PortContextValue } from './ports/context/PortContext'
import { cn } from '@/lib/utils'
import { getCategoryIcon } from '@badaitech/chaingraph-nodes'
import { Cross1Icon } from '@radix-ui/react-icons'
import { useCallback, useState } from 'react'
import NodeFlowPorts from './NodeFlowPorts'
import NodeStatusBadge from './NodeStatusBadge'

interface NodeHeaderProps {
  node: INode
  icon: CategoryIconName | (string & {}) // FIXME: extract CategoryIconName to prevent import cycle
  style: CategoryStyle['light'] | CategoryStyle['dark']
  onDelete?: () => void
  context: PortContextValue
  debugMode: boolean
  isBreakpointSet: boolean
  onBreakpointToggle: () => void
}

export function NodeHeader({
  node,
  icon,
  style,
  onDelete,
  context,
  debugMode,
  isBreakpointSet,
  onBreakpointToggle,
}: NodeHeaderProps) {
  const Icon = getCategoryIcon(icon)
  const [prevStatus, setPrevStatus] = useState<NodeStatus | null>(null)
  const [showStatusBadge, setShowStatusBadge] = useState(false)

  // Callback to handle status badge visibility and state
  const handleStatusChange = useCallback((show: boolean, status: NodeStatus | null) => {
    setShowStatusBadge(show)
    if (status) {
      setPrevStatus(status)
    }
  }, [])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
  }, [onDelete])

  return (
    <div
      className={cn(
        'px-3 py-2 flex items-center justify-between',
        'border-b rounded-t-lg',
      )}
      style={{
        background: style.primary,
        borderBottom: `1px solid ${style.secondary}`,
      }}
    >
      <NodeFlowPorts node={node} context={context} />

      <div className="flex items-center gap-2 min-w-0 relative">
        <div
          className="w-6 min-w-6 h-6 rounded flex items-center justify-center"
          style={{
            background: `${style.text}20`,
          }}
        >
          <Icon
            className="w-4 h-4"
            style={{ color: style.text }}
          />
        </div>

        <h3
          className="font-medium text-sm truncate"
          style={{ color: style.text }}
        >
          {node.metadata.title}
        </h3>

        {/* Use the extracted and optimized NodeStatusBadge component */}
        <NodeStatusBadge
          status={node.status}
          prevStatus={prevStatus}
          showBadge={showStatusBadge}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors nodrag"
          style={{ color: style.text }}
          onClick={handleDelete}
          title="Delete"
          type="button"
        >
          <Cross1Icon className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
