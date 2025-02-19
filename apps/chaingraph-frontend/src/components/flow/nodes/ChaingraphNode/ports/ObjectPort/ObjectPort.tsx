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
import { cn } from '@/lib/utils'
import { requestUpdatePortUI } from '@/store/ports'
import { ChevronDown, X } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { PortHandle } from '../ui/PortHandle'
import { PortTitle } from '../ui/PortTitle'
import { AddFieldDialog } from './AddFieldDialog'

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

export function ObjectPort({ port, renderPort, className, isOpen: isOpenProp, onDelete, value, onChange, errorMessage }: ObjectPortProps) {
  const config = port.getConfig()

  const [isOpen, setIsOpen] = useState(Boolean(config.ui?.collapsible) || isOpenProp)

  const title = config.title || config.key

  const properties = Object.values(config.schema.properties)

  const isSchemaMutable = config.isSchemaMutable

  return (
    <div className={cn('relative flex gap-2 flex-col text-xs group/port bg-secondary rounded p-2 border border-foreground/50 mt-3', !isOpen && 'gap-0', className)}>
      {onDelete && (
        <X
          onClick={() => onDelete(port)}
          className={cn('absolute top-1 size-3 cursor-pointer hover:brightness-125', config.direction === 'output' ? 'left-1' : 'right-1')}
        />
      )}

      {config.direction === 'input' && <PortHandle port={port} />}
      <button
        type="button"
        className="flex items-center gap-x-2 font-semibold"
        onClick={() => {
          setIsOpen(!isOpen)
          requestUpdatePortUI({
            id: port.id,
            ui: {
              collapsible: !isOpen,
            },
          })
        }}
      >
        <PortTitle className="font-semibold">{title}</PortTitle>
        <ChevronDown className="size-3" />
      </button>

      <div className={cn('flex flex-col gap-y-2 mt-3 px-2', !isOpen && 'invisible h-0')}>
        {properties.map((config) => {
          return (
            <div key={config.id} className="inline-flex flex-col pb-2 border-b border-white/15 last:border-b-0">
              {renderPort({ portConfig: config, isOpen, isSchemaMutable: Boolean(isSchemaMutable) })}
            </div>
          )
        })}
      </div>

      <AddFieldDialog title={`Add property for ${config.title || config.key}`} />

      {config.direction === 'output' && <PortHandle port={port} />}
    </div>
  )
}
