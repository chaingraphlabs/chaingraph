/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MCPServerWithCapabilities } from '../store/types'
import { useUnit } from 'effector-react'
import { AlertCircle, FileText, Loader2, Package, Pencil, Server, TerminalSquare } from 'lucide-react'
import { useCallback } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { $expandedCapabilitySections, setExpandedCapabilitySections } from '../store'
import { MCPServerStatus } from '../store/types'
import { MCPPromptCard } from './MCPPromptCard'
import { MCPResourceCard } from './MCPResourceCard'
import { MCPToolCard } from './MCPToolCard'

// Skeleton components for loading state
function SkeletonToolCard() {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-sm">
      <Skeleton className="h-4 w-4 rounded" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-2 w-32 opacity-50" />
      </div>
      <Skeleton className="h-4 w-12 rounded" />
    </div>
  )
}

function SkeletonResourceCard() {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-sm">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-3 w-28" />
    </div>
  )
}

function SkeletonPromptCard() {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-sm">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

interface MCPServerItemProps {
  server: MCPServerWithCapabilities
  searchQuery?: string
  onEdit?: (server: MCPServerWithCapabilities) => void
}

export function MCPServerItem({ server, searchQuery, onEdit }: MCPServerItemProps) {
  // Get expanded state from store
  const expandedSections = useUnit($expandedCapabilitySections)
  const serverExpandedSections = expandedSections[server.id] ?? []

  // Handle section toggle
  const handleSectionChange = useCallback((sections: string[]) => {
    setExpandedCapabilitySections({ serverId: server.id, sections })
  }, [server.id])

  // Auto-expand when searching
  const effectiveExpanded = searchQuery
    ? ['tools', 'resources', 'prompts']
    : serverExpandedSections

  const toolsCount = server.tools?.length || 0
  const resourcesCount = server.resources?.length || 0
  const promptsCount = server.prompts?.length || 0

  const isLoading = server.status === MCPServerStatus.CONNECTING
    || server.loadingState?.tools
    || server.loadingState?.resources
    || server.loadingState?.prompts

  const hasError = server.status === MCPServerStatus.ERROR

  return (
    <AccordionItem
      value={server.id}
      className="border-0 overflow-hidden"
    >
      <div className="relative group overflow-hidden">
        <AccordionTrigger
          className={cn(
            'py-2 px-2 pr-10 rounded-sm hover:bg-accent/50',
            'hover:no-underline text-sm',
            'data-[state=open]:bg-accent/40',
          )}
        >
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            <div className="relative shrink-0">
              <Server className="h-4 w-4 text-muted-foreground" />
              {isLoading && (
                <Loader2 className="h-3 w-3 absolute -bottom-1 -right-1 animate-spin text-primary" />
              )}
              {hasError && (
                <AlertCircle className="h-3 w-3 absolute -bottom-1 -right-1 text-destructive" />
              )}
            </div>
            <div className="flex flex-col items-start flex-1 min-w-0 overflow-hidden">
              <div className="w-full truncate">
                <span className="font-medium">
                  {server.title}
                </span>
              </div>
              {/* <div className="w-full truncate"> */}
              {/*  <span className="text-xs text-muted-foreground"> */}
              {/*    {server.url} */}
              {/*  </span> */}
              {/* </div> */}
              {hasError && server.error && (
                <div className="w-full text-ellipsis">
                  <span className="text-xs text-destructive">
                    {server.error}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-1 items-center mr-6 shrink-0">
              {toolsCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {toolsCount}
                </Badge>
              )}
            </div>
          </div>
        </AccordionTrigger>
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onEdit(server)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>

      <AccordionContent className="pt-1 pb-2">
        <div className="pl-6">
          <Accordion
            type="multiple"
            value={effectiveExpanded}
            onValueChange={handleSectionChange}
            className="space-y-0.5"
          >
            {/* Tools Section */}
            {toolsCount > 0 && (
              <AccordionItem value="tools" className="border-0">
                <AccordionTrigger
                  className={cn(
                    'py-1 px-2 rounded-sm hover:bg-accent/30',
                    'hover:no-underline text-xs',
                    'data-[state=open]:bg-accent/20',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <TerminalSquare className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">Tools</span>
                    <span className="text-muted-foreground">
                      {toolsCount}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-1">
                  <div className="space-y-1 pl-4">
                    {server.tools?.map(tool => (
                      <MCPToolCard
                        key={tool.name}
                        server={server}
                        tool={tool}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Resources Section */}
            {resourcesCount > 0 && (
              <AccordionItem value="resources" className="border-0">
                <AccordionTrigger
                  className={cn(
                    'py-1 px-2 rounded-sm hover:bg-accent/30',
                    'hover:no-underline text-xs',
                    'data-[state=open]:bg-accent/20',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">Resources</span>
                    <span className="text-muted-foreground">
                      {resourcesCount}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-1">
                  <div className="space-y-1 pl-4">
                    {server.resources?.map(resource => (
                      <MCPResourceCard
                        key={resource.uri?.toString() || resource.uriTemplate?.toString() || ''}
                        resource={resource}
                        server={server}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Prompts Section */}
            {promptsCount > 0 && (
              <AccordionItem value="prompts" className="border-0">
                <AccordionTrigger
                  className={cn(
                    'py-1 px-2 rounded-sm hover:bg-accent/30',
                    'hover:no-underline text-xs',
                    'data-[state=open]:bg-accent/20',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">Prompts</span>
                    <span className="text-muted-foreground">
                      {promptsCount}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-1">
                  <div className="space-y-1 pl-4">
                    {server.prompts?.map(prompt => (
                      <MCPPromptCard key={prompt.name} prompt={prompt} server={server} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          {/* Loading state */}
          {isLoading && server.status === MCPServerStatus.CONNECTED && (
            <div className="space-y-2 py-2 px-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading capabilities...
              </div>
            </div>
          )}

          {/* Connection error state */}
          {hasError && (
            <div className="text-xs text-destructive py-2 px-2">
              Failed to connect:
              {' '}
              {server.error || 'Unknown error'}
            </div>
          )}

          {/* Empty state for servers with no capabilities */}
          {!isLoading && !hasError && toolsCount === 0 && resourcesCount === 0 && promptsCount === 0 && (
            <div className="text-xs text-muted-foreground py-2 px-2">
              No tools, resources, or prompts available
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
