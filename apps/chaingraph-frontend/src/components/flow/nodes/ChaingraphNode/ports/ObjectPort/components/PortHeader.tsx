/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, IPort } from '@badaitech/chaingraph-types'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { requestUpdatePortUI } from '@/store/ports'
import { PortTitle } from '../../ui/PortTitle'

interface PortHeaderProps {
  title: string
  isOutput: boolean
  isCollapsed: boolean
  onClick: () => void
  node: INode
  port: IPort
}

export function PortHeader({ title, isOutput, isCollapsed, onClick, node, port }: PortHeaderProps) {
  return (
    <div className={cn(
      'flex items-center gap-1',
      isOutput ? 'flex-row-reverse' : 'flex-row',
      'nodrag',
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
          {isCollapsed
            ? <ChevronDown className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />}
        </div>

        <PortTitle
          className={cn(
            // 'cursor-pointer',
            'font-semibold min-w-0 flex-1',
            isOutput ? 'text-right' : 'text-left',
          )}
          onClick={() => {
            requestUpdatePortUI({
              nodeId: node.id,
              portId: port.id,
              ui: {
                hideEditor: !port.getConfig().ui?.hideEditor,
              },
            })
          }}
        >
          {title}
        </PortTitle>
      </button>
    </div>
  )
}
