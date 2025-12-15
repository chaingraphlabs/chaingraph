/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryIconName } from '@badaitech/chaingraph-nodes'
import type { CategoryMetadata, CategoryStyle, INode, NodeStatus } from '@badaitech/chaingraph-types'
import type { PortContextValue } from './ports/context/PortContext'
import { getCategoryIcon } from '@badaitech/chaingraph-nodes'
import { CheckIcon, Cross1Icon } from '@radix-ui/react-icons'
import { useUnit } from 'effector-react'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { $activeFlowMetadata } from '@/store/flow'
import { updateNodeTitle, useNode } from '@/store/nodes'
import { EditableNodeTitle } from './EditableNodeTitle'
import { LazyNodeDocTooltip } from './LazyNodeDocTooltip'
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
  categoryMetadata?: CategoryMetadata
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
  categoryMetadata,
}: NodeHeaderProps) {
  const Icon = getCategoryIcon(icon)
  const [prevStatus, setPrevStatus] = useState<NodeStatus | null>(null)
  const [showStatusBadge, setShowStatusBadge] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const activeFlow = useUnit($activeFlowMetadata)

  const parentNode = useNode(node.metadata.parentNodeId || '')

  // Callback to handle status badge visibility and state
  const handleStatusChange = useCallback((show: boolean, status: NodeStatus | null) => {
    setShowStatusBadge(show)
    if (status) {
      setPrevStatus(status)
    }
  }, [])

  const handleToggleDeleteConfirm = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteConfirm(prev => !prev)
  }, [])

  const handleConfirmDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
    setShowDeleteConfirm(false)
  }, [onDelete])

  const handleTitleChange = useCallback((title: string) => {
    if (!activeFlow?.id || !node.id)
      return

    updateNodeTitle({
      flowId: activeFlow.id,
      nodeId: node.id,
      title,
      version: node.getVersion(),
    })
  }, [activeFlow, node])

  // Hide delete confirmation when clicking outside
  useEffect(() => {
    if (!showDeleteConfirm)
      return

    const handleClickOutside = () => {
      setShowDeleteConfirm(false)
    }

    // Small delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showDeleteConfirm])

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
      {(!parentNode || parentNode.metadata.category === 'group') && (
        <NodeFlowPorts node={node} context={context} />
      )}

      <div className="flex items-center gap-2 min-w-0 relative">
        {categoryMetadata
          ? (
              <LazyNodeDocTooltip
                node={node}
                categoryMetadata={categoryMetadata}
                className="cursor-pointer"
              >
                <div
                  className="w-6 min-w-6 h-6 rounded flex items-center justify-center hover:opacity-80 transition-opacity"
                  style={{
                    background: `${style.text}20`,
                  }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: style.text }}
                  />
                </div>
              </LazyNodeDocTooltip>
            )
          : (
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
            )}

        <EditableNodeTitle
          value={node.metadata.title || node.id}
          onChange={handleTitleChange}
          className="min-w-0 flex-1"
          style={{ color: style.text }}
        />

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
        {showDeleteConfirm && (
          <button
            className="p-1 rounded hover:bg-red-500/20 bg-red-500/10 text-red-500 transition-colors nodrag"
            onClick={handleConfirmDelete}
            title="Confirm Delete"
            type="button"
          >
            <CheckIcon className="w-3 h-3" />
          </button>
        )}
        <button
          className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors nodrag"
          style={{ color: style.text }}
          onClick={handleToggleDeleteConfirm}
          title={showDeleteConfirm ? 'Cancel Delete' : 'Delete Node'}
          type="button"
        >
          <Cross1Icon className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
