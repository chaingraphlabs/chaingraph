/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { requestUpdatePortUI } from '@/store/ports'
import { usePortConfig, usePortUI } from '@/store/ports-v2'
import { PortTitle } from '../ui/PortTitle'

interface PortHeaderProps {
  title: string
  isOutput: boolean
  isCollapsible?: boolean
  onClick: () => void
  rightElement?: ReactNode

  nodeId: string
  portId: string
}

export function PortHeader({
  title,
  isOutput,
  isCollapsible,
  onClick,
  rightElement,
  nodeId,
  portId,
}: PortHeaderProps) {
  const config = usePortConfig(nodeId, portId)
  const ui = usePortUI(nodeId, portId)
  // const value = usePortValue(nodeId, portId) as any[] | undefined

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
              config?.required
              // && (value === undefined || value === null || value.length === 0)
              && (config.direction === 'input' || config.direction === 'passthrough')
              && 'underline decoration-red-500 decoration-2',
            )}

            onClick={() => {
              requestUpdatePortUI({
                nodeId,
                portId,
                ui: {
                  hideEditor: ui?.hideEditor === undefined ? true : !ui?.hideEditor,
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
