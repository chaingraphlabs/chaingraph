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
import type { INode, IPort, ObjectPortConfig } from '@badaitech/chaingraph-types'
import { PortTitle } from '@/components/flow/nodes/ChaingraphNode/ports/ui/PortTitle'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useExecutionID } from '@/store/execution'
import { $activeFlowId } from '@/store/flow'
import { requestUpdatePortUI } from '@/store/ports'
import { filterPorts } from '@badaitech/chaingraph-types'
import { useUnit } from 'effector-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Fragment, memo, useCallback, useMemo, useRef, useState } from 'react'
import { PortHandle } from '../ui/PortHandle'
import { isHideEditor } from '../utils/hide-editor'
import { AddPropPopover } from './components/AddPropPopover'
import PortField from './components/PortField'
import { PortHeader } from './components/PortHeader'
import { useNodeSchemaDrop } from './hooks'

export interface ObjectPortProps {
  node: INode
  port: IPort<ObjectPortConfig>
  context: PortContextValue
}

const variants = {
  open: {
    opacity: 1,
    height: 'auto',
    pointerEvents: 'auto' as const,
    transition: { duration: 0.2 },
    overflow: 'visible' as const,
  },
  closed: {
    opacity: 0,
    height: 0,
    pointerEvents: 'none' as const,
    overflow: 'hidden' as const,
    transition: { duration: 0.1 },
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
            isConnectable={false}
          />
          <ChildrenHiddenHandles node={node} port={childPort} />
        </Fragment>
      ))}
    </>
  )
})

export function ObjectPort({ node, port, context }: ObjectPortProps) {
  const [isAddPropOpen, setIsAddPropOpen] = useState(false)
  const {
    updatePortUI,
    addFieldObjectPort,
    removeFieldObjectPort,
    getEdgesForPort,
  } = context

  const activeFlowId = useUnit($activeFlowId)
  const config = port.getConfig()
  const title = config.title || config.key || port.id
  const isSchemaMutable = config.isSchemaMutable
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

  // Use the new node schema drop hook
  const {
    isNodeSchemaCaptureEnabled,
    previewNode,
    capturedNode,
    isShowingDropZone,
    handleClearSchema,
  } = useNodeSchemaDrop({ node, port, context })

  // Determine which node to display: preview during drag, captured after drop
  const displayNode = useMemo(() => {
    if (previewNode)
      return previewNode // Show preview during drag
    if (capturedNode)
      return capturedNode // Show captured node after drop
    return undefined // Show placeholder
  }, [previewNode, capturedNode])

  const needRenderObject = useMemo(() => {
    return (
      connectedEdges.filter(edge => edge.targetPortId === config.id).length === 0
      || config.direction === 'output'
    )
    && !isNodeSchemaCaptureEnabled
    && !config.ui?.hideInternalProperties
  }, [config, connectedEdges, isNodeSchemaCaptureEnabled])

  const dropNodeZoneRef = useRef<HTMLDivElement>(null)

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

          {isNodeSchemaCaptureEnabled && (
            <motion.div
              className="w-full rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence mode="wait">
                {isShowingDropZone
                  ? (
                      <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 25,
                        }}
                        className={cn(
                          'border-2 border-dashed rounded-lg p-6',
                          'flex flex-col items-center justify-center min-h-[150px]',
                          'bg-muted/5 hover:bg-muted/10 transition-colors duration-300',
                          'border-muted-foreground/30',
                        )}
                      >
                        <motion.div
                          animate={{
                            y: [0, -5, 0],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 2.5,
                            ease: 'easeInOut',
                          }}
                          className="mb-3 text-muted-foreground/60"
                        >
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                        </motion.div>
                        <motion.div
                          className="text-sm font-medium text-muted-foreground text-center w-full px-4"
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{
                            repeat: Infinity,
                            duration: 3,
                            ease: 'easeInOut',
                          }}
                        >
                          <p className="break-words whitespace-normal">
                            Drag and drop a node here to use its schema
                            {' '}
                            {previewNode ? ' NODE PREVIEW' : ''}
                          </p>
                        </motion.div>
                      </motion.div>
                    )
                  : (
                      <div
                        style={{
                        // take actual width of the node from the displayNode
                          width: '100%',
                          height: displayNode ? `${(displayNode.metadata.ui?.dimensions?.height || 200) + 10}px` : '100%',
                        }}
                        ref={dropNodeZoneRef}
                      >
                      </div>
                    )}
              </AnimatePresence>
            </motion.div>
          )}
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
                // isOutput
                //   ? 'pr-[15px] border-r-2 border-muted/95 -mr-[6px]'
                //   : 'pl-[15px] border-l-2 border-muted/95 -ml-[6px]',

                config.direction === 'output'
                  ? 'pr-[15px] -mr-[6px] border-r-2 border-muted/95'
                  : config.direction === 'input'
                    ? 'pl-[15px] -ml-[6px] border-l-2 border-muted/95'
                    : config.direction === 'passthrough'
                      ? 'pl-[15px] pr-[31px] border-r-2  border-l-2 border-muted/95'
                      : '',
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

              {!isNodeSchemaCaptureEnabled && isSchemaMutable && needRenderEditor && (
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
