/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryMetadata, NodeMetadataWithPorts } from '@badaitech/chaingraph-types'
import { useTheme } from '@/components/theme/hooks/useTheme'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { PortDirection } from '@badaitech/chaingraph-types'
import { useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { ArrowRightIcon } from 'lucide-react'
import { useMemo } from 'react'
import { NodePreview } from './NodePreview'

interface NodeCardProps {
  node: NodeMetadataWithPorts
  categoryMetadata: CategoryMetadata
}

export function NodeCard({ node, categoryMetadata }: NodeCardProps) {
  const { theme } = useTheme()

  const style = useMemo(() => (
    theme === 'dark'
      ? categoryMetadata.style.dark
      : categoryMetadata.style.light
  ), [theme, categoryMetadata])

  // Setup draggable
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: node.type ?? '',
    data: {
      node,
      categoryMetadata,
    },
  })

  const inputsLength = useMemo(() =>
    Array.from(node.portsConfig?.values() ?? [])?.filter(
      port => port.direction === PortDirection.Input || port.direction === PortDirection.Passthrough,
    ).length, [node])

  const outputsLength = useMemo(() =>
    Array.from(node.portsConfig?.values() ?? [])?.filter(
      port => port.direction === PortDirection.Output,
    ).length, [node])

  return (
    <div className="relative">
      {/* Draggable Card */}
      <motion.div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'group relative rounded-sm cursor-grab active:cursor-grabbing',
                'hover:bg-accent/50 transition-colors duration-200',
                'flex items-center gap-2 py-1 px-2',
                isDragging && 'ring-1 ring-primary bg-accent',
              )}
            >
              {/* Node Title & Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full shrink-0',
                      'ring-[1.5px] ring-background',
                      'shadow-sm',
                    )}
                    style={{
                      backgroundColor: style.text,
                      boxShadow: `0 1px 3px ${style.text}80`,
                    }}
                  />
                  <span className="text-sm text-ellipsis">
                    {node.title}
                  </span>
                </div>
              </div>

              {/* Ports Indicator */}
              <div
                className={cn(
                  'flex items-center gap-1 text-xs',
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                )}
                style={{ color: style.text }}
              >
                <span>{inputsLength}</span>
                <ArrowRightIcon className="w-3 h-3" />
                <span>{outputsLength}</span>
              </div>
            </div>
          </TooltipTrigger>

          {/* Preview Tooltip */}
          <TooltipContent
            side="right"
            sideOffset={10}
            className="p-0 border-0 bg-transparent shadow-none select-text"
            onPointerDown={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          >
            <div
              className="pointer-events-auto"
              onPointerDown={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
            >
              <NodePreview
                key={node.type}
                node={node}
                categoryMetadata={categoryMetadata}
              />
            </div>
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </div>
  )
}
