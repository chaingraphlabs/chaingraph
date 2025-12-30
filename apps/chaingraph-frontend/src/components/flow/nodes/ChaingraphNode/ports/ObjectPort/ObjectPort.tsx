/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useUnit } from 'effector-react'
import { AnimatePresence, motion } from 'framer-motion'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { PortTitle } from '@/components/flow/nodes/ChaingraphNode/ports/ui/PortTitle'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useExecutionID, usePortConfigWithExecution, usePortUIWithExecution } from '@/store/execution'
import { $activeFlowId } from '@/store/flow'
import { usePortEdges } from '@/store/nodes/computed'
import { addFieldObjectPort, removeFieldObjectPort, requestUpdatePortUI } from '@/store/ports'
import { useChildPorts } from '@/store/ports-v2'
import { CollapsedPortHandles } from '../ui/CollapsedPortHandles'
import { PortHandle } from '../ui/PortHandle'
import { isHideEditor } from '../utils/hide-editor'
import { LazyAddPropPopover } from './components/LazyAddPropPopover'
import PortField from './components/PortField'
import { PortHeader } from './components/PortHeader'
import { useNodeSchemaDrop } from './hooks'

export interface ObjectPortProps {
  nodeId: string
  portId: string
}

function ObjectPortInner({ nodeId, portId }: ObjectPortProps) {
  // ========================================
  // SECTION 1: ALL HOOKS (React requirement!)
  // ========================================
  const [isAddPropOpen, setIsAddPropOpen] = useState(false)

  const activeFlowId = useUnit($activeFlowId)
  const executionID = useExecutionID()

  // Granular subscriptions - ALWAYS use ports-v2 (no node subscription!)
  const config = usePortConfigWithExecution(nodeId, portId)
  const ui = usePortUIWithExecution(nodeId, portId)
  const childPortIds = useChildPorts(nodeId, portId)

  // Granular edge subscription - only re-renders when THIS port's edges change
  const connectedEdges = usePortEdges(nodeId, portId)

  const needRenderEditor = useMemo(() => {
    if (!config)
      return false
    return !isHideEditor(config as any, connectedEdges)
  }, [config, connectedEdges])

  // Use the node schema drop hook (reads from granular $portUI store, no subscriptions!)
  const {
    isNodeSchemaCaptureEnabled,
    capturedNodeMetadata,
    isShowingDropZone,
    handleClearSchema,
  } = useNodeSchemaDrop({ nodeId, portId })

  const needRenderObject = useMemo(() => {
    if (!config)
      return false
    return (
      connectedEdges.filter(edge => edge.targetPortId === config.id).length === 0
      || config.direction === 'output'
    )
    && !isNodeSchemaCaptureEnabled
    && !ui?.hideInternalProperties
  }, [config, connectedEdges, isNodeSchemaCaptureEnabled, ui])

  const dropNodeZoneRef = useRef<HTMLDivElement>(null)

  // Memoized values (can be computed early)
  const title = useMemo(() => config?.title || config?.key || portId, [config, portId])
  const isSchemaMutable = useMemo(() => (config as any)?.isSchemaMutable, [config])
  const isOutput = useMemo(() => config?.direction === 'output', [config])

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
      {/* Render hidden handles for ALL descendants when port is collapsed */}
      {!ui?.collapsed ? <CollapsedPortHandles nodeId={nodeId} parentPortId={portId} /> : null}

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
                          </p>
                        </motion.div>
                      </motion.div>
                    )
                  : (
                      <div
                        style={{
                        // take actual width of the node from the displayNode
                        // width: '100%',
                          width: capturedNodeMetadata ? `${(capturedNodeMetadata.ui?.dimensions?.width || 200) + 10}px` : '100%',
                          height: capturedNodeMetadata ? `${(capturedNodeMetadata.ui?.dimensions?.height || 200) + 10}px` : '100%',
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
            isOutput={isOutput ?? false}
            isCollapsed={!!ui?.collapsed}
            onClick={handleToggleCollapsible}
            nodeId={nodeId}
            portId={portId}
          />

          {!!ui?.collapsed && (
            <div
              className={cn(
                'relative w-full',
                config.direction === 'output'
                  ? 'pr-[15px] -mr-[6px] border-r-2 border-muted/95'
                  : config.direction === 'input'
                    ? 'pl-[15px] -ml-[6px] border-l-2 border-muted/95'
                    : config.direction === 'passthrough'
                      ? 'pl-[15px] pr-[31px] border-r-2  border-l-2 border-muted/95'
                      : '',
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
                  <LazyAddPropPopover
                    isOpen={isAddPropOpen}
                    onClose={handleClosePopover}
                    onSubmit={handleSubmitPopover}
                    nextOrder={childPortIds.length + 1}
                    nodeId={nodeId}
                    portId={portId}
                  />
                </Popover>
              )}
            </div>
          )}
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
 * Memoized ObjectPort - only re-renders when port structure or collapse state changes
 */
export const ObjectPort = memo(ObjectPortInner)
