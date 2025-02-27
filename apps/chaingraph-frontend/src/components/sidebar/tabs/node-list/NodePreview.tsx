/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryIconName } from '@badaitech/chaingraph-nodes'
import type {
  CategoryMetadata,
  NodeMetadataWithPorts,
} from '@badaitech/chaingraph-types'
import { useTheme } from '@/components/theme/hooks/useTheme'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useCategories } from '@/store/categories'
import { getCategoryIcon } from '@badaitech/chaingraph-nodes'
import {
  PortDirection,
  PortFactory,
} from '@badaitech/chaingraph-types'
import { useEffect, useMemo, useRef, useState } from 'react'

interface NodePreviewProps {
  node: NodeMetadataWithPorts
  categoryMetadata: CategoryMetadata
}

export function NodePreview({ node, categoryMetadata }: NodePreviewProps) {
  const { theme } = useTheme()
  const { getCategoryMetadata } = useCategories()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState<number | null>(null)

  const style = useMemo(() => (
    theme === 'dark'
      ? categoryMetadata.style.dark
      : categoryMetadata.style.light
  ), [theme, categoryMetadata])

  const [inputs, setInputs] = useState(
    Array.from(node.portsConfig?.values() || []).filter(
      port => port.direction === PortDirection.Input,
    ),
  )
  const [outputs, setOutputs] = useState(
    Array.from(node.portsConfig?.values() || []).filter(
      port => port.direction === PortDirection.Output,
    ),
  )

  useEffect(() => {
    setInputs(
      Array.from(node.portsConfig?.values() || []).filter(
        config => config.direction === PortDirection.Input,
      ).map((config) => {
        return PortFactory.create(config).getConfig()
      }),
    )
    setOutputs(
      Array.from(node.portsConfig?.values() || []).filter(
        config => config.direction === PortDirection.Output,
      ).map((config) => {
        return PortFactory.create(config).getConfig()
      }),
    )
  }, [node])

  // Calculate available height for component
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        // Get available viewport height
        const viewportHeight = window.innerHeight
        // Set max height to 80% of viewport
        const maxHeight = Math.round(viewportHeight * 0.9)
        setContainerHeight(maxHeight)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  const Icon = useMemo(
    () => getCategoryIcon(categoryMetadata.icon as CategoryIconName),
    [categoryMetadata.icon],
  )

  // Function to format description with proper line breaks
  const formatDescription = (description: string) => {
    return description.split('\n').map((line, index) => (
      <div
        key={index}
        className={cn(
          line.trim() === '' && 'h-2', // Add spacing for empty lines
          'whitespace-pre-wrap',
        )}
      >
        {line}
      </div>
    ))
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-[280px] rounded-lg shadow-lg',
        'border border-border',
        'bg-card flex flex-col',
      )}
      style={{ maxHeight: containerHeight ? `${containerHeight}px` : 'auto' }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between shrink-0"
        style={{
          background: style.primary,
          borderBottom: `1px solid ${style.secondary}`,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ background: `${style.text}20` }} // Using text color with 20% opacity
          >
            <Icon className="w-4 h-4" style={{ color: style.text }} />
          </div>
          <h3 className="font-medium text-sm" style={{ color: style.text }}>
            {node.title}
          </h3>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-grow overflow-auto">
        <div className="p-3 space-y-4">
          {/* Description */}
          {node.description && (
            <div className="space-y-1">
              {/* <div className="text-xs font-medium text-muted-foreground">Description</div> */}
              <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                {formatDescription(node.description)}
              </div>
            </div>
          )}

          {/* Ports */}
          <div className="space-y-3">
            {/* Input Ports */}
            {inputs.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Inputs</div>
                {inputs.map(port => (
                  <div
                    key={port.key}
                    className="group relative pl-5 hover:bg-muted/30 rounded p-1 transition-colors"
                  >
                    {/* Port Circle */}
                    <div
                      className={cn(
                        'absolute left-0 top-[7px]',
                        'w-3 h-3 rounded-full border-2',
                        'shadow-sm',
                      )}
                      style={{
                        backgroundColor: port.ui?.bgColor ?? 'white',
                        borderColor: port.ui?.borderColor ?? style.background,
                        boxShadow: `0 1px 2px ${style.background}80`,
                      }}
                    />

                    {/* Port Content */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className="text-xs font-medium text-foreground">
                          {port.title}
                        </div>
                        {port.required && (
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        )}
                      </div>
                      {port.description && (
                        <div className="text-[10px] text-muted-foreground">
                          {formatDescription(port.description)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Output Ports */}
            {outputs.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground text-right">Outputs</div>
                {outputs.map(port => (
                  <div
                    key={port.key}
                    className="group relative pr-5 text-right hover:bg-muted/30 rounded p-1 transition-colors"
                  >
                    {/* Port Content */}
                    <div className="min-w-0">
                      <div className="flex items-center justify-end gap-1.5 mb-0.5">
                        <div className="text-xs font-medium text-foreground">
                          {port.title}
                        </div>
                      </div>
                      {port.description && (
                        <div className="text-[10px] text-muted-foreground">
                          {formatDescription(port.description)}
                        </div>
                      )}
                    </div>

                    {/* Port Circle */}
                    <div
                      className={cn(
                        'absolute right-0 top-[7px]',
                        'w-3 h-3 rounded-full border-2',
                        'shadow-sm',
                      )}
                      style={{
                        backgroundColor: port.ui?.bgColor ?? 'white',
                        borderColor: port.ui?.borderColor ?? style.background,
                        boxShadow: `0 1px 2px ${style.background}80`,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          {node.tags && node.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2 border-t">
              {node.tags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
