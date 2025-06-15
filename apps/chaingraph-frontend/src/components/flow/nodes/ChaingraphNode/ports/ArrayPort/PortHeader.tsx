/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, IPort } from '@badaitech/chaingraph-types'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { requestUpdatePortUI } from '@/store/ports'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { PortTitle } from '../ui/PortTitle'

interface PortHeaderProps {
  title: string
  isOutput: boolean
  isCollapsible: boolean
  onClick: () => void
  rightElement?: ReactNode

  node: INode
  port: IPort
}

export function PortHeader({
  title,
  isOutput,
  isCollapsible,
  onClick,
  rightElement,
  node,
  port,
}: PortHeaderProps) {
  const config = port.getConfig()

  return (
    <div className="space-y-1">
      <div className={cn(
        'flex items-center gap-1',
        isOutput ? 'flex-row-reverse' : 'flex-row',
      )}
      >
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'flex items-center flex-1 min-w-0',
            'p-1 rounded-md gap-2',
            'bg-muted/40 hover:bg-muted/60 transition-colors',
            'text-sm font-medium nodrag',
            isOutput ? 'justify-end' : 'justify-start',
            'truncate',
          )}
        >
          <div className={cn(
            'flex-shrink-0',
            isOutput ? 'order-last' : 'order-first',
          )}
          >
            {isCollapsible
              ? <ChevronDown className="w-4 h-4" />
              : <ChevronRight className="w-4 h-4" />}
          </div>

          <PortTitle
            className={cn(
              'cursor-pointer',
              'font-semibold min-w-0 flex-1',
              isOutput ? 'text-right' : 'text-left',
              // if port required and the value is empty, add a red underline
              config.required
              && (port.getValue() === undefined || port.getValue() === null || port.getValue().length === 0 || !port.validate())
              && config.direction === 'input'
              && (config.connections?.length || 0) === 0
              && 'underline decoration-red-500 decoration-2',
            )}

            onClick={() => {
              requestUpdatePortUI({
                nodeId: node.id,
                portId: port.id,
                ui: {
                  hideEditor: config.ui?.hideEditor === undefined ? true : !config.ui?.hideEditor,
                },
              })
            }}
          >
            {title}
          </PortTitle>
        </button>
        {rightElement && (
          <div className={cn(
            'flex',
            isOutput ? 'justify-end' : 'justify-start',
          )}
          >
            {rightElement}
          </div>
        )}
      </div>
    </div>
  )
}
