/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryIconName } from '@badaitech/chaingraph-nodes'
import type { CategoryMetadata } from '@badaitech/chaingraph-types'
import type { INode } from '@badaitech/chaingraph-types'
import { getCategoryIcon } from '@badaitech/chaingraph-nodes'
import { PortDirection } from '@badaitech/chaingraph-types'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTheme } from '@/components/theme'
import {
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ScrollArea,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { PortDocContent } from './ports/doc/PortDocContent'

interface NodeDocTooltipContentProps {
  node: INode
  categoryMetadata: CategoryMetadata
}

interface PortItemProps {
  port: any
  type: 'input' | 'output' | 'passthrough'
}

function PortItem({ port, type }: PortItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const config = port.getConfig()

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-2 text-left hover:bg-muted/30 rounded p-2 transition-colors">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <span className="text-xs font-medium">{config.title || config.id || config.key}</span>
          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 ml-auto">
            {config.type}
          </Badge>
          {(type === 'input' || type === 'passthrough') && config.required && (
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" title="Required"></div>
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-7 pr-2">
          <PortDocContent port={port} className="w-full" />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function NodeDocTooltipContent({
  node,
  categoryMetadata,
}: NodeDocTooltipContentProps) {
  const { theme } = useTheme()
  const [portsOpen, setPortsOpen] = useState(true)
  const [jsonOpen, setJsonOpen] = useState(false)

  const style = useMemo(() => (
    theme === 'dark'
      ? categoryMetadata.style.dark
      : categoryMetadata.style.light
  ), [theme, categoryMetadata])

  // Serialize node data lazily when needed
  const serializedData = useMemo(() => {
    try {
      const serialized = node.serialize()
      return JSON.stringify(serialized, null, 2)
    } catch (error) {
      return 'Error serializing node data'
    }
  }, [node])

  const Icon = useMemo(
    () => getCategoryIcon(categoryMetadata.icon as CategoryIconName),
    [categoryMetadata.icon],
  )

  // Get input and output ports
  const systemPorts = useMemo(() =>
    Array.from(node.ports.values())
      .filter(p => p.isSystem())
      .sort(), [node.ports])

  const inputs = useMemo(() =>
    Array.from(node.ports.values()).filter(
      port => port.getConfig().direction === PortDirection.Input && !port.isSystem(),
    ), [node.ports])

  const passthroughs = useMemo(() =>
    Array.from(node.ports.values()).filter(
      port => port.getConfig().direction === PortDirection.Passthrough && !port.isSystem(),
    ), [node.ports])

  const outputs = useMemo(() =>
    Array.from(node.ports.values()).filter(
      port => port.getConfig().direction === PortDirection.Output && !port.isSystem(),
    ), [node.ports])

  // Function to format description with proper line breaks
  const formatDescription = (description: string) => {
    return description.split('\n').map((line, index) => (
      <div
        key={`line-${index}`}
        className={cn(
          line.trim() === '' && 'h-2',
          'break-words',
        )}
      >
        {line}
      </div>
    ))
  }

  return (
    <div
      className={cn(
        'w-[90vw] max-w-[450px]',
        'h-[60vh]',
        'rounded-lg shadow-lg',
        'bg-card flex flex-col',
        'border-2',
      )}
      style={{
        borderColor: style.secondary,
      }}
    >
      {/* Fixed Header */}
      <div
        className="px-4 py-3 flex items-center justify-between shrink-0 rounded-t-lg"
        style={{
          background: style.primary,
          borderBottom: `1px solid ${style.secondary}`,
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className="w-6 h-6 rounded flex items-center justify-center shrink-0"
            style={{ background: `${style.text}20` }}
          >
            <Icon className="w-4 h-4" style={{ color: style.text }} />
          </div>
          <h3 className="font-medium text-sm truncate" style={{ color: style.text }}>
            {node.metadata.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {node.metadata.category}
          </Badge>
          {node.metadata.version && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              v
              {node.metadata.version}
            </Badge>
          )}
        </div>
      </div>

      {/* Scrollable Content Container */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="p-4 space-y-3">
            {/* Node ID */}
            {node.id && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Node ID</div>
                <div className="text-xs text-muted-foreground">{node.id}</div>
              </div>
            )}

            {/* Node Type */}
            {node.metadata.type && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Node Type</div>
                <div className="text-xs text-muted-foreground">{node.metadata.type}</div>
              </div>
            )}

            {/* Category */}
            {node.metadata.category && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Category</div>
                {/* badge and description on separate rows */}
                <div className="flex flex-col gap-1">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 w-fit">
                    {node.metadata.category}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {categoryMetadata.description}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {node.metadata.description && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Description</div>
                <div className="text-xs text-muted-foreground">
                  {formatDescription(node.metadata.description)}
                </div>
              </div>
            )}

            {/* Ports Section - Collapsible */}
            {(inputs.length > 0 || passthroughs.length > 0 || outputs.length > 0 || systemPorts.length > 0) && (
              <div className="border rounded-md">
                <Collapsible open={portsOpen} onOpenChange={setPortsOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full text-left hover:bg-muted/50 p-3">
                    <div className="flex items-center gap-2">
                      {portsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      <span className="text-xs font-medium">
                        Ports (
                        {inputs.length}
                        {' '}
                        inputs,
                        {' '}
                        {outputs.length}
                        {' '}
                        outputs)
                      </span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t p-3 space-y-3">
                      {/* Input Ports */}
                      {inputs.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">Input Ports</div>
                          <div className="space-y-2">
                            {inputs
                              .map(port => (
                                <PortItem key={port.getConfig().id!} port={port} type="input" />
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Passthrough Ports */}
                      {passthroughs.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">
                            Passthrough Ports
                          </div>
                          <div className="space-y-2">
                            {passthroughs
                              .map(port => (
                                <PortItem key={port.getConfig().key} port={port} type="passthrough" />
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Output Ports */}
                      {outputs.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">Output Ports</div>
                          <div className="space-y-2">
                            {outputs
                              .map(port => (
                                <PortItem key={port.getConfig().key} port={port} type="output" />
                              ))}
                          </div>
                        </div>
                      )}

                      {/* System Ports */}
                      {systemPorts.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">System ports</div>
                          <div className="space-y-2">
                            {systemPorts
                              .map(port => (
                                <PortItem key={port.getConfig().key} port={port} type="input" />
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* Serialized JSON - Collapsible */}
            <div className="border rounded-md">
              <Collapsible open={jsonOpen} onOpenChange={setJsonOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full text-left hover:bg-muted/50 p-3">
                  <div className="flex items-center gap-2">
                    {jsonOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    <span className="text-xs font-medium">Serialized Data</span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t p-3 overflow-hidden">
                    <div className={cn(
                      'text-[10px] p-2 bg-muted/50',
                      'rounded border border-border',
                      'max-h-[300px] overflow-auto',
                      'font-mono',
                    )}
                    >
                      <pre className="whitespace-pre-wrap break-all">{serializedData}</pre>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Tags */}
            {node.metadata.tags && node.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2 border-t">
                {node.metadata.tags.map(tag => (
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
    </div>
  )
}
