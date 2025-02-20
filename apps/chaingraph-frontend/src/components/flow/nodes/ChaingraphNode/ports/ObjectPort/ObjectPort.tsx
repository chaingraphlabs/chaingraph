/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExtractValue, IPort, IPortConfig, ObjectPortConfig } from '@badaitech/chaingraph-types'
import type { PortProps } from '../../Port'
import type { PortOnChangeParam } from '../../types'
import { PortTitle } from '@/components/flow/nodes/ChaingraphNode/ports/ui/PortTitle.tsx'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { addFieldObjectPort, requestUpdatePortUI } from '@/store/ports'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { PortHandle } from '../ui/PortHandle'
import { AddPropPopover } from './AddPropPopover'

interface RenderPortParams<C extends IPortConfig> {
  className?: string
  portClassName?: string
  isOpen?: boolean
  portConfig: C
  value?: ExtractValue<C>
  isSchemaMutable: boolean
  onChange?: (param: PortOnChangeParam<C>) => void
  onDelete?: (port: IPort<C>) => void
  errorMessage?: string
}

export type ObjectPortProps = PortProps<ObjectPortConfig> & {
  renderPort: <C extends IPortConfig>(params: RenderPortParams<C>) => ReactNode
  isOpen?: boolean
  onDelete?: (port: IPort<ObjectPortConfig>) => void
}

const variants = {
  open: { opacity: 1, height: 'auto' },
  closed: { opacity: 0, height: 0 },
} as const

export function ObjectPort({
  port,
  renderPort,
  className,
  portClassName,
  isOpen: isOpenProp,
  onDelete,
  value,
  onChange,
  errorMessage,
}: ObjectPortProps) {
  const [isAddPropOpen, setIsAddPropOpen] = useState(false)
  const config = port.getConfig()
  const [isOpen, setIsOpen] = useState(Boolean(config.ui?.collapsible) || isOpenProp)
  const title = config.title || config.key
  const properties = Object.values(config.schema.properties)
  const isSchemaMutable = config.isSchemaMutable

  return (
    <div className={cn(
      'relative flex gap-2 group/port',
      className,
    )}
    >

      {onDelete && (
        <X
          onClick={onDelete}
          className={cn(
            'absolute top-2 size-3 cursor-pointer hover:brightness-125',
            config.direction === 'output' ? 'left-2' : 'right-2',
          )}
        />
      )}

      {config.direction === 'input' && <PortHandle className={portClassName} port={port} />}

      <div className="flex-1">
        {/* Header */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen)
            requestUpdatePortUI({
              id: port.id,
              ui: { collapsible: !isOpen },
            })
          }}
          className={cn(
            'flex items-center gap-2 w-full p-1 rounded-md',
            'bg-muted/40 hover:bg-muted/60 transition-colors',
            'text-sm font-medium',
            config.direction === 'input' ? 'justify-start' : 'justify-end',
            'truncate',
          )}
        >
          {config.direction === 'input'
          && (isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}

          <PortTitle className="font-semibold">{title}</PortTitle>

          {config.direction === 'output'
          && (isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />)}
        </button>

        <motion.div
          initial={isOpen ? 'open' : 'closed'}
          variants={variants}
          animate={isOpen ? 'open' : 'closed'}
          className={cn([
            config.direction === 'input'
              ? 'pl-[15px] border-l-2 border-muted/95 border-spacing-0 -ml-[6px]'
              : 'pr-[15px] border-r-2 border-muted/95 border-spacing-0 -mr-[6px]',
          ])}
        >

          {properties.map(config => (
            <div
              key={config.id}
              className={cn(
                'py-1',
                'before:absolute before:left-[-18px] before:top-1/2 before:w-3 before:h-px',
                'before:bg-muted/30',
              )}
            >
              {renderPort({
                portConfig: config,
                isOpen,
                isSchemaMutable: Boolean(isSchemaMutable),
              })}
            </div>
          ))}

          {isSchemaMutable && (
            <Popover open={isAddPropOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn('inline-flex bg-accent px-2 py-1 rounded text-sm', config.direction === 'input'
                    ? 'justify-start'
                    : 'justify-end', className)}
                  onClick={() => {
                    setIsAddPropOpen(true)
                  }}
                >
                  Add key
                </button>
              </PopoverTrigger>
              {isAddPropOpen && (
                <AddPropPopover
                  onClose={() => {
                    setIsAddPropOpen(false)
                  }}
                  onSubmit={(data) => {
                    config.schema.properties[data.key] = data.config
                    port.setConfig(config)
                    addFieldObjectPort({ id: port.id, ...data })
                    setIsAddPropOpen(false)
                  }}
                />
              )}
            </Popover>
          )}

        </motion.div>
      </div>

      {config.direction === 'output' && <PortHandle className={portClassName} port={port} />}
    </div>
  )
}
