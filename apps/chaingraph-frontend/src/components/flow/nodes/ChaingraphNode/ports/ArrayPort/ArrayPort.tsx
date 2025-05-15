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
import type {
  ArrayPortConfig,
  ArrayPort as ArrayPortType,
  INode,
  IPort,
  IPortConfig,
} from '@badaitech/chaingraph-types'
import { PortTitle } from '@/components/flow/nodes/ChaingraphNode/ports/ui/PortTitle'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useExecutionID } from '@/store/execution'
import { filterPorts } from '@badaitech/chaingraph-types'
import { AnimatePresence, motion } from 'framer-motion'
import { Fragment, memo, useCallback, useMemo, useState } from 'react'
import { ArrayItemSchemaEditor } from '../../SchemaEditor/ArrayItemSchemaEditor'
import { PortHandle } from '../ui/PortHandle'
import { isHideEditor } from '../utils/hide-editor'
import { AddElementPopover } from './AddElementPopover'
import { PortField } from './PortField'
import { PortHeader } from './PortHeader'

export interface ArrayPortProps {
  node: INode
  port: IPort<ArrayPortConfig>
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
// Extracted to a memoizable component
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

export function ArrayPort({ node, port, context }: ArrayPortProps) {
  const [isAddPropOpen, setIsAddPropOpen] = useState(false)
  const [isSchemaEditorOpen, setIsSchemaEditorOpen] = useState(false)
  const {
    updatePortUI,
    appendElementArrayPort,
    removeElementArrayPort,
    updatePortValue,
    getEdgesForPort,
  } = context

  const config = port.getConfig()
  const title = config.title || config.key || port.id
  const isMutable = config.isMutable
  const isOutput = config.direction === 'output'
  const ui = config.ui
  const executionID = useExecutionID()

  // Memoize edges
  const connectedEdges = useMemo(() => {
    return getEdgesForPort(port.id)
  }, [getEdgesForPort, port.id])

  const values = useMemo(() => port.getValue() ?? [], [port])

  const needRenderEditor = useMemo(() => {
    return !isHideEditor(config, connectedEdges) && Boolean(isMutable)
  }, [config, connectedEdges, isMutable])

  // Memoize callback functions
  const handleAddElement = useCallback(() => {
    setIsAddPropOpen(true)
  }, [])

  const handleClosePopover = useCallback(() => {
    setIsAddPropOpen(false)
  }, [])

  const handleSubmitPopover = useCallback(() => {
    appendElementArrayPort({
      nodeId: node.id,
      portId: port.id,
      value: config.itemConfig.defaultValue,
    })
    setIsAddPropOpen(false)
  }, [node.id, port.id, config.itemConfig.defaultValue, appendElementArrayPort])

  const handleToggleCollapsible = useCallback(() => {
    updatePortUI({
      nodeId: node.id,
      portId: port.id,
      ui: { collapsed: config.ui?.collapsed === undefined ? true : !config.ui.collapsed },
    })
  }, [node.id, port.id, config.ui?.collapsed, updatePortUI])

  // Handle item config updates
  const handleItemConfigUpdate = useCallback((updatedConfig: ArrayPortConfig) => {
    // Update using context events - this leverages the store's logic
    // for handling complex port updates
    console.debug('Updating item config:', updatedConfig)
    updatePortUI({
      nodeId: node.id,
      portId: port.id,
      ui: { ...config.ui },
    })

    // Trigger a value update to ensure the itemConfig changes are processed
    updatePortValue({
      nodeId: node.id,
      portId: port.id,
      value: port.getValue(), // Keep the same array values
    })
  }, [node.id, config.ui, port, updatePortUI, updatePortValue])

  // Handle saving from the schema editor
  const handleSchemaEditorSave = useCallback((newItemConfig: IPortConfig) => {
    console.debug('Schema editor save:', newItemConfig)

    // First update the port configuration
    updatePortUI({
      nodeId: node.id,
      portId: port.id,
      ui: {
        ...config.ui,
      },
    })

    // Then update the itemConfig through the port value update
    setTimeout(() => {
      const updatedPortConfig = {
        ...port.getConfig(),
        itemConfig: newItemConfig,
      } as ArrayPortConfig

      // Use direct value update to refresh the port
      port.setConfig(updatedPortConfig)

      // Update the value to trigger a refresh
      updatePortValue({
        nodeId: node.id,
        portId: port.id,
        value: port.getValue(), // Keep the same array values
      })
    }, 10)
    setIsSchemaEditorOpen(false)
  }, [node.id, port, config.ui, updatePortUI, updatePortValue])

  // Memoize child ports to prevent recalculation
  const childPorts = useMemo(() => {
    return Array.from(node.ports.values())
      .filter(p => p.getConfig().parentId === config.id)
  }, [node.ports, config.id])

  if (ui?.hide)
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
            isOutput={isOutput}
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
          />

          <AnimatePresence initial={false}>
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
              {childPorts.map((childPort, index) => (
                <PortField
                  key={childPort.id}
                  parentPort={port}
                  node={node}
                  port={childPort as IPort}
                  context={context}
                  isOutput={isOutput}
                  isMutable={isMutable ?? false}
                  onDelete={() => {
                    removeElementArrayPort({
                      nodeId: node.id,
                      portId: port.id,
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
                      port={port as ArrayPortType}
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

      {isOutput && <PortHandle port={port} />}

      {/* Schema Editor Dialog */}
      <ArrayItemSchemaEditor
        arrayPortConfig={config}
        onSave={handleSchemaEditorSave}
        open={isSchemaEditorOpen}
        onOpenChange={setIsSchemaEditorOpen}
      />
    </div>
  )
}
