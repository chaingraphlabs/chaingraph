/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  PortContextValue,
} from '@/components/flow/nodes/ChaingraphNode/ports/context/PortContext'
import type { AnyPortConfig, INode, IPort } from '@badaitech/chaingraph-types'
import { PortTitle } from '@/components/flow/nodes/ChaingraphNode/ports/ui/PortTitle'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useExecutionID } from '@/store/execution'
import { requestUpdatePortUI } from '@/store/ports'
import { filterPorts } from '@badaitech/chaingraph-types'
import { AnimatePresence, motion } from 'framer-motion'
import { Fragment, memo, useCallback, useMemo, useState } from 'react'
import { PortHandle } from '../../ui/PortHandle'
import { isHideEditor } from '../../utils/hide-editor'
import { AddPropPopover } from './AddPropPopover'
import PortField from './PortField'
import { PortHeader } from './PortHeader'

export interface AnyPortProps {
  node: INode
  port: IPort<AnyPortConfig>
  context: PortContextValue
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
const ChildrenHiddenHandles = memo(({ node, port }: { node: INode, port: IPort }) => {
  const childPorts = useMemo(() => {
    return filterPorts(
      node,
      p => p.getConfig().parentId === port.getConfig().id,
    )
  }, [node, port])

  return (
    <>
      {childPorts.map(childPort => (
        <Fragment key={childPort.id}>
          <PortHandle
            key={childPort.id}
            port={childPort}
            className={cn('opacity-0')}
          />
          <ChildrenHiddenHandles node={node} port={childPort} />
        </Fragment>
      ))}
    </>
  )
})

export function AnyObjectPort({ node, port, context }: AnyPortProps) {
  const [isAddPropOpen, setIsAddPropOpen] = useState(false)
  const {
    updatePortUI,
    addFieldObjectPort,
    removeFieldObjectPort,
    getEdgesForPort,
  } = context

  const config = port.getConfig()
  const title = config.title || config.key || port.id
  const isSchemaMutable = config.underlyingType?.type === 'object' && config.underlyingType?.isSchemaMutable
  const isOutput = config.direction === 'output'
  const ui = config.ui
  const executionID = useExecutionID()

  // Memoize edges
  const connectedEdges = useMemo(() => {
    return getEdgesForPort(port.id)
  }, [getEdgesForPort, port.id])

  const needRenderEditor = useMemo(() => {
    return !isHideEditor(config, connectedEdges)
  }, [config, connectedEdges])

  // Memoize child ports to prevent recalculation
  const childPorts = useMemo(() => {
    return Array.from(node.ports.values())
      .filter(p => p.getConfig().parentId === config.id)
  }, [node.ports, config.id])

  // Memoize callback functions
  const handleToggleCollapsible = useCallback(() => {
    requestUpdatePortUI({
      nodeId: node.id,
      portId: port.id,
      ui: { collapsed: config.ui?.collapsed === undefined ? true : !config.ui.collapsed },
    })
  }, [node.id, port.id, config.ui?.collapsed])

  const handleOpenPopover = useCallback(() => {
    setIsAddPropOpen(true)
  }, [])

  const handleClosePopover = useCallback(() => {
    setIsAddPropOpen(false)
  }, [])

  const handleSubmitPopover = useCallback((data: any) => {
    addFieldObjectPort({
      nodeId: node.id,
      portId: port.id,
      ...data,
    })
    setIsAddPropOpen(false)
  }, [node.id, port.id, addFieldObjectPort])

  const needRenderObject = useMemo(() => {
    return (connectedEdges.length === 0 || config.direction === 'output')
  }, [config, connectedEdges])

  if (ui?.hidden)
    return null

  return (
    <div
      className={cn(
        'relative flex gap-2 group/port w-full',
        config.direction === 'output' ? 'justify-end' : 'justify-start',
      )}
    >
      {!config.ui?.collapsed && <ChildrenHiddenHandles node={node} port={port as IPort} />}

      {(config.direction === 'input' || config.direction === 'passthrough')
        && <PortHandle port={port} forceDirection="input" />}

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
            isOutput={isOutput}
            isCollapsed={!!config.ui?.collapsed}
            onClick={handleToggleCollapsible}
            node={node}
            port={port as IPort}
          />

          <AnimatePresence initial={false} mode="wait">
            <motion.div
              initial={config.ui?.collapsed ? 'open' : 'closed'}
              variants={variants}
              animate={config.ui?.collapsed ? 'open' : 'closed'}
              exit={config.ui?.collapsed ? 'closed' : 'open'}
              className={cn(
                'relative w-full',
                isOutput
                  ? 'pr-[15px] border-r-2 border-muted/95 -mr-[6px]'
                  : 'pl-[15px] border-l-2 border-muted/95 -ml-[6px]',
              )}
            >

              {childPorts.map(childPort => (
                <PortField
                  key={childPort.id}
                  node={node}
                  parentPort={port}
                  port={childPort}
                  context={context}
                  isOutput={isOutput}
                  isSchemaMutable={isSchemaMutable ?? false}
                  onDelete={() => {
                    removeFieldObjectPort({
                      nodeId: node.id!,
                      portId: port.id!,
                      key: childPort.getConfig().key!,
                    })
                  }}
                />
              ))}

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
                      nextOrder={childPorts.length + 1}
                      port={port}
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
            port={port}
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
