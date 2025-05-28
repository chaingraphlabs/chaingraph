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
import { useDraggingNodeObjects, useNode } from '@/store/nodes/hooks/useNode'
import { getCategoryIcon } from '@badaitech/chaingraph-nodes'
import { filterPorts } from '@badaitech/chaingraph-types'
import { Cross1Icon } from '@radix-ui/react-icons'
import { AnimatePresence, motion } from 'framer-motion'
import { Fragment, memo, useCallback, useMemo, useState } from 'react'
import NodeBody from '../../NodeBody'
import { PortHandle } from '../ui/PortHandle'
import { isHideEditor } from '../utils/hide-editor'
import { AddPropPopover } from './components/AddPropPopover'
import PortField from './components/PortField'
import { PortHeader } from './components/PortHeader'

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

  const needRenderObject = useMemo(() => {
    return connectedEdges.length === 0 || config.direction === 'output'
  }, [config, connectedEdges])

  // Memoize child ports to prevent recalculation
  const childPorts = useMemo(() => {
    return Array.from(node.ports.values())
      .filter(p => p.getConfig().parentId === config.id)
  }, [node.ports, config.id])

  // Memoize callback functions
  const handleToggleCollapsible = useCallback(() => {
    updatePortUI({
      nodeId: node.id,
      portId: port.id,
      ui: { collapsed: config.ui?.collapsed === undefined ? true : !config.ui.collapsed },
    })
  }, [node.id, port.id, config.ui?.collapsed, updatePortUI])

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

  const nodeSchemaMode = useMemo(() => {
    return config?.metadata?.node_schema_mode === true
  }, [config.metadata])

  const rootNode = useNode(config.nodeId!)

  const draggingNodes = useDraggingNodeObjects()
  const nodeToCopySchema = useMemo(() => {
    if (Object.keys(draggingNodes).length !== 1) {
      console.log('draggingNodes.length != 1')
      return undefined
    }

    const draggingNode = Object.values(draggingNodes)[0]
    if (rootNode && draggingNode.id === rootNode.id) {
      console.log('draggingNode.id === rootNode.id')
      return undefined
    }

    // check if the node within the current nodes rectangle:
    const rootNodeUI = rootNode?.metadata.ui
    const draggingNodeUI = draggingNode.metadata.ui

    // Return undefined if either node doesn't have position or dimensions
    if (!rootNodeUI || !rootNodeUI?.position || !rootNodeUI?.dimensions
      || !draggingNodeUI?.position || !draggingNodeUI?.dimensions) {
      console.log('noooo dimensions or position')
      return undefined
    }

    // Calculate overlapping area
    const overlapX = Math.max(0, Math.min(
      rootNodeUI.position.x + rootNodeUI.dimensions.width,
      draggingNodeUI.position.x + draggingNodeUI.dimensions.width,
    ) - Math.max(rootNodeUI.position.x, draggingNodeUI.position.x))

    const overlapY = Math.max(0, Math.min(
      rootNodeUI.position.y + rootNodeUI.dimensions.height,
      draggingNodeUI.position.y + draggingNodeUI.dimensions.height,
    ) - Math.max(rootNodeUI.position.y, draggingNodeUI.position.y))

    const overlapArea = overlapX * overlapY
    const draggingNodeArea = draggingNodeUI.dimensions.width * draggingNodeUI.dimensions.height

    // Check if overlap is more than 50%
    if (overlapArea / draggingNodeArea > 0.2) {
      console.log('overlap area!!!!')
      return draggingNode
    }

    console.log('in not fit!')
    return undefined
  }, [draggingNodes, rootNode])

  const defaultCategoryMetadata = {
    id: 'other',
    label: 'Other',
    description: 'Other nodes',
    icon: 'Package',
    style: {
      light: {
        primary: '#F5F5F5', // Soft gray
        secondary: '#FAFAFA',
        background: '#FFFFFF',
        text: '#616161', // Darker gray
      },
      dark: {
        primary: '#2C2C2C',
        secondary: '#1F1F1F',
        background: '#1C1C1C',
        text: '#BDBDBD',
      },
    },
    order: 7,
  }

  const style = defaultCategoryMetadata.style
  const Icon = getCategoryIcon(defaultCategoryMetadata.icon)

  // Memoize the entire context value to prevent unnecessary renders
  const portContextValue = useMemo(() => {
    return {
      updatePortValue: () => {
      },
      updatePortUI: () => {
      },
      addFieldObjectPort: () => {
      },
      removeFieldObjectPort: () => {
      },
      appendElementArrayPort: () => {
      },
      removeElementArrayPort: () => {
      },
      getEdgesForPort: () => [],
    }
  }, [])

  // console.log(`Dragging nodes: ${JSON.stringify(draggingNodes)}`)

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

      {!isOutput && <PortHandle port={port} />}

      {!needRenderObject && (
        <div
          className={cn(
            'flex flex-col w-full',
            config.direction === 'output' ? 'items-end' : 'items-start',
            'truncate',
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
            isCollapsible={!!config.ui?.collapsed}
            onClick={handleToggleCollapsible}
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

              {!nodeSchemaMode && isSchemaMutable && needRenderEditor && (
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
                    />
                  )}
                </Popover>
              )}

              {nodeSchemaMode && (
                <motion.div
                  className="w-full rounded-lg overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >

                  <AnimatePresence mode="wait">
                    {!nodeToCopySchema
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
                            className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center justify-center min-h-[120px] bg-muted/5 hover:bg-muted/10 transition-colors duration-300"
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
                            <motion.span
                              className="text-sm font-medium text-muted-foreground text-center"
                              animate={{ opacity: [0.7, 1, 0.7] }}
                              transition={{
                                repeat: Infinity,
                                duration: 3,
                                ease: 'easeInOut',
                              }}
                            >
                              Drag and drop a node here to use its schema
                            </motion.span>
                            <motion.span
                              className="text-xs text-muted-foreground/60 mt-2"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 }}
                            >
                              Make sure the node overlaps at least 50% with this area
                            </motion.span>
                          </motion.div>
                        )
                      : (
                          <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{
                              type: 'spring',
                              stiffness: 500,
                              damping: 30,
                            }}
                            className="rounded-lg overflow-hidden border border-muted shadow-lg"
                          >
                            <motion.div
                              className={cn(
                                'px-3 py-2 flex items-center justify-between',
                                'border-b rounded-t-lg',
                              )}
                              style={{
                                background: style.dark.primary,
                                borderBottom: `1px solid ${style.dark.secondary}`,
                              }}
                              whileHover={{
                                backgroundColor: style.dark.secondary,
                              }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="flex items-center gap-2 min-w-0 relative">
                                <motion.div
                                  className="w-6 min-w-6 h-6 rounded flex items-center justify-center"
                                  style={{
                                    background: `${style.dark.text}20`,
                                  }}
                                  whileHover={{ scale: 1.1 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                                >
                                  <Icon
                                    className="w-4 h-4"
                                    style={{ color: style.dark.text }}
                                  />
                                </motion.div>

                                <motion.h3
                                  className="font-medium text-sm truncate"
                                  style={{ color: style.dark.text }}
                                  initial={{ x: -5, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: 0.1 }}
                                >
                                  {nodeToCopySchema.metadata.title || node.metadata.title}
                                </motion.h3>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center gap-1">
                                <motion.button
                                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors nodrag"
                                  style={{ color: style.dark.text }}
                                  onClick={() => {
                                  }}
                                  title="Remove schema"
                                  type="button"
                                  whileHover={{ scale: 1.1, rotate: 90 }}
                                  whileTap={{ scale: 0.9 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                >
                                  <Cross1Icon className="w-3 h-3" />
                                </motion.button>
                              </div>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              transition={{ delay: 0.2, duration: 0.3 }}
                            >
                              <NodeBody
                                node={nodeToCopySchema}
                                context={portContextValue}
                              />
                            </motion.div>
                          </motion.div>
                        )}
                  </AnimatePresence>
                </motion.div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {
        isOutput && <PortHandle port={port} />
      }
    </div>
  )
}
