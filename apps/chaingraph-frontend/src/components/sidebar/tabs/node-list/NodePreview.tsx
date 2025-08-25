/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryIconName } from '@badaitech/chaingraph-nodes'
import type {
  ArrayPortConfig,
  CategoryMetadata,
  EnumPortConfig,
  IPortConfig,
  NodeMetadataWithPorts,
  ObjectPortConfig,
} from '@badaitech/chaingraph-types'
import { getPortTypeColor } from '@/components/flow/nodes/ChaingraphNode/ports/doc'
import { useTheme } from '@/components/theme/hooks/useTheme'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

import { cn } from '@/lib/utils'

import { getCategoryIcon } from '@badaitech/chaingraph-nodes'
import { PortDirection } from '@badaitech/chaingraph-types'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface NodePreviewProps {
  node: NodeMetadataWithPorts
  categoryMetadata: CategoryMetadata
}

interface PortPreviewProps {
  config: IPortConfig
  depth?: number
  isLast?: boolean
}

interface PortGroupProps {
  title: string
  ports: IPortConfig[]
  depth?: number
}

function RecursivePortPreview({ config, depth = 0, isLast = false }: PortPreviewProps) {
  const { theme } = useTheme()
  const [isExpanded, setIsExpanded] = useState(depth === 0)

  // const portColor = PORT_TYPE_COLORS[config.type] || PORT_TYPE_COLORS.any
  const portColor = getPortTypeColor(theme, {
    type: config.type,
    direction: config.direction,
  } as IPortConfig)
  const bgColor = config.ui?.bgColor ?? portColor.circleColor
  const borderColor = config.ui?.borderColor ?? portColor.borderColor

  // Format description with proper line breaks
  const formatDescription = (description: string) => {
    return description.split('\n').map((line, index) => (
      <div
        key={`line-${index}-${line.slice(0, 10)}`}
        className={cn(
          line.trim() === '' && 'h-1',
          'whitespace-pre-wrap',
        )}
      >
        {line}
      </div>
    ))
  }

  // Get child configurations from schema
  const childConfigs = useMemo(() => {
    if (config.type === 'object') {
      const objConfig = config as ObjectPortConfig
      return Object.entries(objConfig.schema?.properties || {}).map(([key, childConfig]) => ({
        ...childConfig,
        key: childConfig.key || key,
        title: childConfig.title || childConfig.key || key,
      }))
    }
    if (config.type === 'array') {
      const arrConfig = config as ArrayPortConfig
      if (arrConfig.itemConfig) {
        return [{
          ...arrConfig.itemConfig,
          key: 'item',
          title: arrConfig.itemConfig.title || 'Item',
        }]
      }
    }
    if (config.type === 'enum') {
      const enumConfig = config as EnumPortConfig
      return (enumConfig.options || []).map((option, index) => ({
        ...option,
        // key: option.key || `option-${index}`,
        // title: option.title || option.key || `Option ${index + 1}`,
        title: option.id || option.key || `Option ${index + 1}`,
      }))
    }
    return []
  }, [config])

  const hasChildren = childConfigs.length > 0

  return (
    <div className="w-full">
      <div
        className={cn(
          'group relative flex items-start gap-2 py-1.5 px-2 rounded transition-colors',
          'hover:bg-muted/30',
        )}
        style={{ marginLeft: depth > 0 ? `${depth * 24}px` : 0 }}
      >
        {/* Indentation guide */}
        {depth > 0 && (
          <div
            className={cn(
              'absolute left-0 top-0 bottom-0 w-px bg-border',
              isLast && 'h-6',
            )}
            style={{ left: '-12px' }}
          />
        )}
        {depth > 0 && (
          <div
            className="absolute top-6 w-3 h-px bg-border"
            style={{ left: '-12px' }}
          />
        )}

        {/* Port indicator */}
        <div
          className={cn(
            'w-3 h-3 rounded-full border-2 shadow-sm shrink-0',
            // hasChildren && 'ml-5',
          )}
          style={{
            backgroundColor: bgColor,
            borderColor,
            boxShadow: `0 1px 2px ${borderColor}40`,
            marginTop: '2px',
          }}
        />

        {/* Port content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-foreground">
              {config.title || config.key}
            </span>
            {config.required && (
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
              {config.type}
              {config.type === 'array' && childConfigs.length > 0 && `<${childConfigs[0].type}>`}
            </Badge>
          </div>
          {config.description && (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {/* {formatDescription(config.description)} */}

              <Markdown remarkPlugins={[remarkGfm]}>{config.description}</Markdown>
            </div>
          )}
        </div>

        {/* Expand/Collapse toggle */}
        {hasChildren && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-muted rounded transition-colors"
          >
            {isExpanded
              ? (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                )
              : (
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                )}
          </button>
        )}
      </div>

      {/* Render children */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {childConfigs.map((childConfig, index) => (
            <RecursivePortPreview
              key={childConfig.key || index}
              config={childConfig}
              depth={depth + 1}
              isLast={index === childConfigs.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PortGroup({ title, ports, depth = 0 }: PortGroupProps) {
  if (ports.length === 0) {
    return null
  }

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground px-2">
        {title}
      </div>
      <div className="space-y-0.5">
        {ports.map((port, index) => (
          <RecursivePortPreview
            key={port.key || port.id || index}
            config={port}
            depth={depth}
          />
        ))}
      </div>
    </div>
  )
}

export function NodePreview({ node, categoryMetadata }: NodePreviewProps) {
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState<number | null>(null)

  const style = useMemo(
    () => (theme === 'dark' ? categoryMetadata.style.dark : categoryMetadata.style.light),
    [theme, categoryMetadata],
  )

  // Group ports by direction
  const portGroups = useMemo(() => {
    const configs = Array.from(node.portsConfig?.values() || [])
      .filter(port => port.ui?.hidden !== true)

    return {
      inputs: configs.filter(port => port.direction === PortDirection.Input && port.metadata?.isSystemPort !== true),
      passthroughs: configs.filter(port => port.direction === PortDirection.Passthrough && port.metadata?.isSystemPort !== true),
      outputs: configs.filter(port => port.direction === PortDirection.Output && port.metadata?.isSystemPort !== true),
    }
  }, [node])

  // Calculate available height for component
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const viewportHeight = window.innerHeight
        const maxHeight = Math.round(viewportHeight * 0.9)
        setContainerHeight(maxHeight)
      }
    }

    updateHeight()
    const timeoutId = setTimeout(updateHeight, 0)
    window.addEventListener('resize', updateHeight)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  const Icon = useMemo(
    () => getCategoryIcon(categoryMetadata.icon as CategoryIconName),
    [categoryMetadata.icon],
  )

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-[360px] rounded-lg shadow-lg',
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
            style={{ background: `${style.text}20` }}
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
              <div className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
                {/* <Markdown remarkPlugins={[remarkGfm]}>{node.description}</Markdown> */}
                {node.description}
              </div>
            </div>
          )}

          {/* Ports */}
          <div className="space-y-3">
            <PortGroup title="Inputs" ports={portGroups.inputs} />
            <PortGroup title="Passthroughs" ports={portGroups.passthroughs} />
            <PortGroup title="Outputs" ports={portGroups.outputs} />
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
