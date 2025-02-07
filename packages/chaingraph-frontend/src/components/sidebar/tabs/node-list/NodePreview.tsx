/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryIconName } from '@badaitech/chaingraph-nodes/categories/icons'
import type { CategoryMetadata, NodeMetadata } from '@badaitech/chaingraph-types'
import { useTheme } from '@/components/theme/hooks/useTheme'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useCategories } from '@/store/categories'
import { getCategoryIcon } from '@badaitech/chaingraph-nodes/categories/icons'
import { PortDirection } from '@badaitech/chaingraph-types/port/base'
import { useEffect, useMemo, useState } from 'react'

interface NodePreviewProps {
  node: NodeMetadata
  categoryMetadata: CategoryMetadata
}

export function NodePreview({ node, categoryMetadata }: NodePreviewProps) {
  const { theme } = useTheme()
  const { getCategoryMetadata } = useCategories()

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
        port => port.direction === PortDirection.Input,
      ),
    )
    setOutputs(
      Array.from(node.portsConfig?.values() || []).filter(
        port => port.direction === PortDirection.Output,
      ),
    )
  }, [node])

  const Icon = useMemo(
    () => getCategoryIcon(categoryMetadata.icon as CategoryIconName),
    [categoryMetadata.icon],
  )

  return (
    <div className={cn(
      'w-[280px] rounded-lg overflow-hidden shadow-lg',
      'border border-border',
      'bg-card',
    )}
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between"
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

      {/* Content */}
      <div
        className="p-3 space-y-4"
        // style={{ background: style.background }}
      >
        {/* Description */}
        {node.description && (
          <p className="text-xs text-muted-foreground">
            {node.description}
          </p>
        )}

        {/* Ports */}
        <div className="space-y-3">
          {/* Input Ports */}
          {inputs.length > 0 && (
            <div className="space-y-2">
              {inputs.map(port => (
                <div
                  key={port.key}
                  className="group relative pl-3 flex items-start"
                >
                  {/* Port Circle */}
                  <div
                    className={cn(
                      'absolute left-0 top-[3px] -translate-x-1/2',
                      'w-3 h-3 rounded-full border-2',
                      'shadow-sm',
                    )}
                    style={{
                      backgroundColor: 'rgb(59 130 246)', // Keep solid color for ports
                      borderColor: style.background,
                      boxShadow: `0 1px 2px ${style.background}80`,
                    }}
                  />

                  {/* Port Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground">
                      {port.title}
                    </div>
                    {port.description && (
                      <div className="text-[10px] text-muted-foreground line-clamp-2">
                        {port.description}
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
              {outputs.map(port => (
                <div
                  key={port.key}
                  className="group relative pr-3 flex items-start justify-end text-right"
                >
                  {/* Port Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground">
                      {port.title}
                    </div>
                    {port.description && (
                      <div className="text-[10px] text-muted-foreground line-clamp-2">
                        {port.description}
                      </div>
                    )}
                  </div>

                  {/* Port Circle */}
                  <div
                    className={cn(
                      'absolute right-0 top-[3px] translate-x-1/2',
                      'w-3 h-3 rounded-full border-2',
                      'shadow-sm',
                    )}
                    style={{
                      backgroundColor: 'rgb(59 130 246)', // Keep solid color for ports
                      borderColor: style.background,
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
    </div>
  )
}
