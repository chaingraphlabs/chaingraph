/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  IPortConfig,
} from '@badaitech/chaingraph-types'
import { AnimatePresence, motion } from 'framer-motion'
import { memo, useCallback, useMemo, useState } from 'react'
import { PortTitle } from '@/components/flow/nodes/ChaingraphNode/ports/ui/PortTitle'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useExecutionID, usePortConfigWithExecution, usePortUIWithExecution, usePortValueWithExecution } from '@/store/execution'
import { usePortEdges } from '@/store/nodes/computed'
import {
  appendElementArrayPort,
  removeElementArrayPort,
  requestUpdatePortUI,
  requestUpdatePortValue,
  updateItemConfigArrayPort,
} from '@/store/ports'
import { useChildPorts, usePortConfig } from '@/store/ports-v2'
import { ArrayItemSchemaEditor } from '../../SchemaEditor/ArrayItemSchemaEditor'
import { CollapsedPortHandles } from '../ui/CollapsedPortHandles'
import { PortHandle } from '../ui/PortHandle'
import { isHideEditor } from '../utils/hide-editor'
import { AddElementPopover } from './AddElementPopover'
import { PortField } from './PortField'
import { PortHeader } from './PortHeader'

export interface ArrayPortProps {
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

function ArrayPortInner({ nodeId, portId }: ArrayPortProps) {
  const [isAddPropOpen, setIsAddPropOpen] = useState(false)
  const [isSchemaEditorOpen, setIsSchemaEditorOpen] = useState(false)

  // Granular subscriptions - ALWAYS use ports-v2
  const config = usePortConfigWithExecution(nodeId, portId)
  const ui = usePortUIWithExecution(nodeId, portId)
  const value = usePortValueWithExecution(nodeId, portId) as any[] | undefined
  const childPortIds = useChildPorts(nodeId, portId)

  // Granular edge subscription - only re-renders when THIS port's edges change
  const connectedEdges = usePortEdges(nodeId, portId)

  // Get first child config for newItemConfig (if exists)
  const firstChildPortId = childPortIds.length > 0 ? childPortIds[0] : null
  const firstChildConfig = usePortConfig(nodeId, firstChildPortId || '')

  const title = config?.title || config?.key || portId
  const isMutable = (config as any)?.isMutable
  const isOutput = config?.direction === 'output'
  const executionID = useExecutionID()

  // Use first child port config as itemConfig, otherwise use arrayPort's itemConfig
  const newItemConfig = useMemo(
    () => firstChildConfig || (config as any)?.itemConfig,
    [firstChildConfig, config],
  )

  const values = useMemo(() => value ?? [], [value])

  const needRenderEditor = useMemo(() => {
    if (!config)
      return false
    return !isHideEditor(config as any, connectedEdges) && Boolean(isMutable)
  }, [config, connectedEdges, isMutable])

  // Memoize callback functions
  const handleAddElement = useCallback(() => {
    // if type is not any you want immediately add element instead of choose type
    if (newItemConfig?.type === 'any') {
      setIsAddPropOpen(true)
    } else {
      // if type is not any you want immediately add element instead of choose type
      appendElementArrayPort({
        nodeId,
        portId,
        value: newItemConfig?.defaultValue,
      })
    }
  }, [newItemConfig, nodeId, portId])

  const handleClosePopover = useCallback(() => {
    setIsAddPropOpen(false)
  }, [])

  const handleSubmitPopover = useCallback((newItemConfig: IPortConfig) => {
    // Update array ports itemConfig
    updateItemConfigArrayPort({
      nodeId,
      portId,
      itemConfig: newItemConfig,
    })
    // Add new array element with the choosen type
    appendElementArrayPort({
      nodeId,
      portId,
      value: newItemConfig.defaultValue,
    })
    setIsAddPropOpen(false)
  }, [nodeId, portId])

  const handleToggleCollapsible = useCallback(() => {
    requestUpdatePortUI({
      nodeId,
      portId,
      ui: { collapsed: ui?.collapsed === undefined ? true : !ui.collapsed },
    })
  }, [nodeId, portId, ui?.collapsed])

  // Handle item config updates
  const handleItemConfigUpdate = useCallback((updatedConfig: any) => {
    // Update using events directly - this leverages the store's logic
    // for handling complex port updates
    // console.debug('Updating item config:', updatedConfig)
    requestUpdatePortUI({
      nodeId,
      portId,
      ui: { ...ui },
    })

    // Trigger a value update to ensure the itemConfig changes are processed
    requestUpdatePortValue({
      nodeId,
      portId,
      value, // Keep the same array values
    })
  }, [nodeId, portId, ui, value])

  // Handle saving from the schema editor
  const handleSchemaEditorSave = useCallback((newItemConfig: IPortConfig) => {
    // console.debug('Schema editor save:', newItemConfig)

    // First update the port configuration
    requestUpdatePortUI({
      nodeId,
      portId,
      ui: {
        ...ui,
      },
    })

    // Then update the itemConfig through the port value update
    setTimeout(() => {
      // Update the value to trigger a refresh
      requestUpdatePortValue({
        nodeId,
        portId,
        value, // Keep the same array values
      })
    }, 10)
    setIsSchemaEditorOpen(false)
  }, [nodeId, portId, ui, value])

  if (ui?.hidden)
    return null

  // Early return if config not loaded yet
  if (!config)
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

      {!needRenderEditor && (
        <div
          className={cn(
            'flex flex-col w-full',
            config.direction === 'output' ? 'items-end' : 'items-start',
            'truncate',
          )}
        >
          <PortTitle>
            {title}
          </PortTitle>
        </div>
      )}

      {needRenderEditor && (
        <div className="flex-1 min-w-0">
          <PortHeader
            title={title}
            isOutput={isOutput ?? false}
            rightElement={(
              <div className="flex items-center gap-1">
                {/* <Button */}
                {/*  variant="ghost" */}
                {/*  size="icon" */}
                {/*  className="h-5 w-5 rounded-sm" */}
                {/*  onClick={() => setIsSchemaEditorOpen(true)} */}
                {/*  title="Edit Array Item Schema" */}
                {/* > */}
                {/*  <Edit className="h-3 w-3" /> */}
                {/* </Button> */}
                {/* <EditItemConfigPopover */}
                {/*  portConfig={config} */}
                {/*  onSave={handleItemConfigUpdate} */}
                {/* /> */}
              </div>
            )}
            isCollapsible={Boolean(isMutable && values.length > 0)}
            onClick={handleToggleCollapsible}
            nodeId={nodeId}
            portId={portId}
          />

          <AnimatePresence initial={false}>
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
              {childPortIds.map((childPortId, index) => (
                <PortField
                  key={childPortId}
                  parentPortId={portId}
                  nodeId={nodeId}
                  portId={childPortId}
                  isOutput={isOutput ?? false}
                  isMutable={isMutable ?? false}
                  onDelete={() => {
                    removeElementArrayPort({
                      nodeId,
                      portId,
                      index,
                    })
                  }}
                />
              ))}

              {isMutable && needRenderEditor && (
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
                      onClick={handleAddElement}
                      disabled={!!executionID}
                    >
                      Add Element
                    </button>
                  </PopoverTrigger>
                  {isAddPropOpen && (
                    <AddElementPopover
                      nodeId={nodeId}
                      portId={portId}
                      onClose={handleClosePopover}
                      onSubmit={handleSubmitPopover}
                    />
                  )}
                </Popover>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {(config.direction === 'output' || config.direction === 'passthrough')
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
        )}

      {/* Schema Editor Dialog */}
      <ArrayItemSchemaEditor
        arrayPortConfig={config as any}
        onSave={handleSchemaEditorSave}
        open={isSchemaEditorOpen}
        onOpenChange={setIsSchemaEditorOpen}
      />
    </div>
  )
}

/**
 * Memoized ArrayPort - only re-renders when array elements or UI config changes
 */
export const ArrayPort = memo(ArrayPortInner)
