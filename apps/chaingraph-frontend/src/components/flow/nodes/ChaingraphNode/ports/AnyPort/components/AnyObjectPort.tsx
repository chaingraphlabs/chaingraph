/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { Fragment, memo, useCallback, useMemo, useState } from 'react'
import { PortTitle } from '@/components/flow/nodes/ChaingraphNode/ports/ui/PortTitle'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useExecutionID } from '@/store/execution'
import { addFieldObjectPort, removeFieldObjectPort, requestUpdatePortUI } from '@/store/ports'
import { useChildPorts, usePortConfig, usePortUI } from '@/store/ports-v2'
import { PortHandle } from '../../ui/PortHandle'
import { isHideEditor } from '../../utils/hide-editor'
import { AddPropPopover } from './AddPropPopover'
import PortField from './PortField'
import { PortHeader } from './PortHeader'

export interface AnyPortProps {
  nodeId: string
  portId: string
}

const variants = {
  open: {
    opacity: 1,
    height: 'auto',
    pointerEvents: 'auto' as const,
    transition: { duration: 0 },
    overflow: 'visible' as const,
  },
  closed: {
    opacity: 0,
    height: 0,
    pointerEvents: 'none' as const,
    overflow: 'hidden' as const,
    transition: { duration: 0 },
  },
} as const

// Extracted this to a memoizable component
const ChildrenHiddenHandles = memo(({ nodeId, portId, childPortIds }: { nodeId: string, portId: string, childPortIds: string[] }) => {
  return (
    <>
      {childPortIds.map(childPortId => (
        <Fragment key={childPortId}>
          <PortHandle
            key={childPortId}
            nodeId={nodeId}
            portId={childPortId}
            className={cn('opacity-0')}
          />
        </Fragment>
      ))}
    </>
  )
})

function AnyObjectPortInner({ nodeId, portId }: AnyPortProps) {
  // ========================================
  // SECTION 1: ALL HOOKS (React requirement!)
  // ========================================
  const [isAddPropOpen, setIsAddPropOpen] = useState(false)

  // Granular subscriptions - ALWAYS use ports-v2
  const config = usePortConfig(nodeId, portId)
  const ui = usePortUI(nodeId, portId)
  const childPortIds = useChildPorts(nodeId, portId)

  const executionID = useExecutionID()

  // Memoized values
  const title = useMemo(() => config?.title || config?.key || portId, [config, portId])
  const isSchemaMutable = useMemo(() =>
    (config as any)?.underlyingType?.type === 'object' && (config as any).underlyingType?.isSchemaMutable, [config])
  const isOutput = useMemo(() => config?.direction === 'output', [config])

  // Memoize edges - always empty array for now (AnyPort doesn't typically have edges)
  const connectedEdges: any[] = []

  const needRenderEditor = useMemo(() => {
    if (!config)
      return false
    return !isHideEditor(config as any, connectedEdges)
  }, [config, connectedEdges])

  const needRenderObject = useMemo(() => {
    return (connectedEdges.length === 0 || config?.direction === 'output')
  }, [config, connectedEdges])

  // Memoize callback functions
  const handleToggleCollapsible = useCallback(() => {
    requestUpdatePortUI({
      nodeId,
      portId,
      ui: { collapsed: ui?.collapsed === undefined ? true : !ui.collapsed },
    })
  }, [nodeId, portId, ui?.collapsed])

  const handleOpenPopover = useCallback(() => {
    setIsAddPropOpen(true)
  }, [])

  const handleClosePopover = useCallback(() => {
    setIsAddPropOpen(false)
  }, [])

  const handleSubmitPopover = useCallback((data: any) => {
    addFieldObjectPort({
      nodeId,
      portId,
      ...data,
    })
    setIsAddPropOpen(false)
  }, [nodeId, portId])

  // ========================================
  // SECTION 2: EARLY RETURNS (after all hooks)
  // ========================================
  if (!config)
    return null
  if (ui?.hidden)
    return null

  return (
    <div
      className={cn(
        'relative flex gap-2 group/port w-full',
        config.direction === 'output' ? 'justify-end' : 'justify-start',
      )}
    >
      {!ui?.collapsed && <ChildrenHiddenHandles nodeId={nodeId} portId={portId} childPortIds={childPortIds} />}

      {(config.direction === 'input' || config.direction === 'passthrough')
        && <PortHandle nodeId={nodeId} portId={portId} forceDirection="input" />}

      {!needRenderObject && (
        <div
          className={cn(
            'flex flex-col w-full',
            config.direction === 'output' ? 'items-end' : 'items-start',
          )}
        >
          <PortTitle>{title}</PortTitle>
        </div>
      )}

      {needRenderObject && (
        <div className="flex-1 min-w-0">
          <PortHeader
            title={title}
            isOutput={isOutput ?? false}
            isCollapsed={!!ui?.collapsed}
            onClick={handleToggleCollapsible}
            nodeId={nodeId}
            portId={portId}
          />

          <AnimatePresence initial={false} mode="wait">
            <motion.div
              initial={ui?.collapsed ? 'open' : 'closed'}
              variants={variants}
              animate={ui?.collapsed ? 'open' : 'closed'}
              exit={ui?.collapsed ? 'closed' : 'open'}
              className={cn(
                'relative w-full',
                isOutput
                  ? 'pr-[15px] border-r-2 border-muted/95 -mr-[6px]'
                  : 'pl-[15px] border-l-2 border-muted/95 -ml-[6px]',
              )}
            >

              {childPortIds.map((childPortId) => {
                // Extract key from child port ID (format: 'parentPort.key')
                const key = childPortId.split('.').pop() || ''
                return (
                  <PortField
                    key={childPortId}
                    nodeId={nodeId}
                    parentPortId={portId}
                    portId={childPortId}
                    isOutput={isOutput ?? false}
                    isSchemaMutable={isSchemaMutable ?? false}
                    onDelete={() => {
                      removeFieldObjectPort({
                        nodeId,
                        portId,
                        key,
                      })
                    }}
                  />
                )
              })}

              {isSchemaMutable && needRenderEditor && (
                <Popover open={isAddPropOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'px-2 py-1 mt-1 rounded text-sm bg-accent nodrag',
                        'hover:bg-accent/80 transition-colors',
                        'w-fit flex',
                        isOutput ? 'flex-row-reverse' : 'flex-row',
                        !!executionID && 'cursor-not-allowed opacity-50',
                      )}
                      onClick={handleOpenPopover}
                      disabled={!!executionID}
                    >
                      Add field
                    </button>
                  </PopoverTrigger>
                  {isAddPropOpen && (
                    <AddPropPopover
                      onClose={handleClosePopover}
                      onSubmit={handleSubmitPopover}
                      nextOrder={childPortIds.length + 1}
                      nodeId={nodeId}
                      portId={portId}
                    />
                  )}
                </Popover>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {
        (config.direction === 'output' || config.direction === 'passthrough')
        && (
          <PortHandle
            nodeId={nodeId}
            portId={portId}
            forceDirection="output"
            className={cn(
              config.parentId !== undefined
              && config.direction === 'passthrough'
              && '-right-8',
            )}
          />
        )
      }
    </div>
  )
}

/**
 * Memoized AnyObjectPort - prevents unnecessary re-renders
 */
export const AnyObjectPort = memo(AnyObjectPortInner)
