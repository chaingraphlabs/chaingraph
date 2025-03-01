/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, IPort, ObjectPortConfig } from '@badaitech/chaingraph-types'
import { PortTitle } from '@/components/flow/nodes/ChaingraphNode/ports/ui/PortTitle.tsx'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { filterPorts } from '@badaitech/chaingraph-types'
import { AnimatePresence, motion } from 'framer-motion'
import { Fragment, useMemo, useState } from 'react'
import { usePortContext } from '../context/PortContext'
import { PortHandle } from '../ui/PortHandle'
import { isHideEditor } from '../utils/hide-editor'
import { AddPropPopover } from './components/AddPropPopover'
import { PortField } from './components/PortField'
import { PortHeader } from './components/PortHeader'

export interface ObjectPortProps {
  node: INode
  port: IPort<ObjectPortConfig>
}

const variants = {
  open: { opacity: 1, height: 'auto' },
  closed: { opacity: 0, height: 0 },
} as const

function renderChildrenHiddenHandles(node: INode, port: IPort) {
  return filterPorts(
    node,
    p => p.getConfig().parentId === port.getConfig().id,
  )
    .map(childPort => (
      <Fragment key={childPort.id}>
        <PortHandle
          key={childPort.id}
          port={childPort}
          className={cn('opacity-0')}
        />
        {renderChildrenHiddenHandles(node, childPort)}
      </Fragment>
    ))
}

export function ObjectPort({ node, port }: ObjectPortProps) {
  const [isAddPropOpen, setIsAddPropOpen] = useState(false)
  const {
    updatePortUI,
    addFieldObjectPort,
    removeFieldObjectPort,
    getEdgesForPort,
  } = usePortContext()

  const config = port.getConfig()
  const title = config.title || config.key || port.id
  const isSchemaMutable = config.isSchemaMutable
  const isOutput = config.direction === 'output'
  const ui = config.ui

  const connectedEdges = getEdgesForPort(port.id)
  const needRenderEditor = useMemo(() => {
    return !isHideEditor(config, connectedEdges)
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
      {!config.ui?.collapsible && renderChildrenHiddenHandles(node, port as IPort)}

      {!isOutput && <PortHandle port={port} />}

      {!needRenderEditor && (
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

      {needRenderEditor && (
        <div className="flex-1 min-w-0">
          <PortHeader
            title={title}
            isOutput={isOutput}
            isCollapsible={!!config.ui?.collapsible}
            onClick={() => {
              updatePortUI({
                nodeId: node.id,
                portId: port.id,
                ui: { collapsible: config.ui?.collapsible === undefined ? true : !config.ui.collapsible },
              })
            }}
          />

          <AnimatePresence initial={false}>
            <motion.div
              initial={config.ui?.collapsible ? 'open' : 'closed'}
              variants={variants}
              animate={config.ui?.collapsible ? 'open' : 'closed'}
              exit={config.ui?.collapsible ? 'closed' : 'open'}
              className={cn(
                'relative w-full',
                isOutput
                  ? 'pr-[15px] border-r-2 border-muted/95 -mr-[6px]'
                  : 'pl-[15px] border-l-2 border-muted/95 -ml-[6px]',
              )}
            >
              {Array.from(node.ports.values())
                .filter(p => p.getConfig().parentId === config.id)
                .map(childPort => (
                  <PortField
                    key={childPort.id}
                    node={node}
                    parentPort={port}
                    port={childPort}
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
                      )}
                      onClick={() => setIsAddPropOpen(true)}
                    >
                      Add field
                    </button>
                  </PopoverTrigger>
                  {isAddPropOpen && (
                    <AddPropPopover
                      onClose={() => setIsAddPropOpen(false)}
                      onSubmit={(data) => {
                        addFieldObjectPort({ nodeId: node.id, portId: port.id, ...data })
                        setIsAddPropOpen(false)
                      }}
                    />
                  )}
                </Popover>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {isOutput && <PortHandle port={port} />}
    </div>
  )
}
