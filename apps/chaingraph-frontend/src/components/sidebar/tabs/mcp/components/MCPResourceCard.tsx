/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MCPServerWithCapabilities } from '@/components/sidebar/tabs/mcp/store'
import type { Resource, ResourceTemplate } from '@modelcontextprotocol/sdk/types.js'
import { NodePreview } from '@/components/sidebar'
import { useMCPServerWithNodes } from '@/components/sidebar/tabs/mcp/store/useMCPServerWithNodes'
import { buildNodeMetadataWithPorts } from '@/components/sidebar/tabs/mcp/utils/node'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useCategoryMetadata } from '@/store/categories/useCategories'
import { useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { File, FileBox, FileImage, FileJson, FileText } from 'lucide-react'
import { useMemo } from 'react'

interface MCPResourceCardProps {
  resource: Resource | ResourceTemplate
  server: MCPServerWithCapabilities
}

export function MCPResourceCard({ resource, server }: MCPResourceCardProps) {
  const serverWithNodes = useMCPServerWithNodes(server.id)

  // Select icon based on resource type
  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'text/plain':
        return FileText
      case 'application/json':
        return FileJson
      case 'application/octet-stream':
      case 'application/pdf':
      case 'application/zip':
      case 'application/x-tar':
      case 'application/gzip':
        return FileBox
      case 'image/png':
      case 'image/jpeg':
      case 'image/gif':
      case 'image/webp':
      case 'image/svg+xml':
        return FileImage
      default:
        return File
    }
  }

  const Icon = getResourceIcon(resource.mimeType || 'text/plain')

  const node = useMemo(() => {
    if (!serverWithNodes?.nodes)
      return null

    // Find the specific resource node by matching the resource URI
    const resourceNode = serverWithNodes.nodes.resources.find((n) => {
      // Match by URI which is the unique identifier for resources
      const uriPort = n.findPort(
        p => p.getConfig().key === 'uri' && !p.getConfig().parentId,
      )
      if (uriPort) {
        const uriValue = uriPort.getValue()
        const resourceUri = (resource.uri || resource.uriTemplate || '').toString()
        return uriValue === resourceUri
      }

      // Fallback to matching by name if URI is not available
      return undefined
    })

    if (!resourceNode) {
      console.warn(`[MCPResourceCard] Could not find pre-built node for resource: ${resource.name}`)
      return null
    }

    return buildNodeMetadataWithPorts(resourceNode)
  }, [serverWithNodes, resource])

  const categoryMetadata = useCategoryMetadata('mcp')

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `mcp-resource-${resource.name}`,
    data: {
      node,
      categoryMetadata,
    },
    disabled: !node, // Disable dragging if node isn't ready
  })

  // Show loading state if nodes aren't loaded yet
  if (serverWithNodes?.nodesLoadingState?.isLoading) {
    return (
      <div className="flex items-center gap-2 py-1 px-2 opacity-50">
        <Icon className="h-3 w-3 text-muted-foreground animate-pulse" />
        <span className="text-xs">Loading...</span>
      </div>
    )
  }

  // Show error state if node couldn't be found
  if (!node) {
    return (
      <div className="flex items-center gap-2 py-1 px-2 opacity-50">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs line-through">
          {resource.name || resource.title || resource.uri?.toString() || resource.uriTemplate?.toString() || 'Untitled Resource'}
        </span>
      </div>
    )
  }

  return (
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
            {/* Resource Icon and Name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs truncate font-medium">
                  {resource.name || resource.title || resource.uri?.toString() || resource.uriTemplate?.toString() || 'Untitled Resource'}
                </span>
              </div>
            </div>

            {/* Resource Type Badge */}
            <Badge variant="outline" className="text-xs px-1 py-0 h-4">
              {resource.mimeType}
            </Badge>
          </div>
        </TooltipTrigger>

        {/* Tooltip with Details */}
        <TooltipContent
          side="right"
          sideOffset={10}
          className="max-w-xs p-0 m-0 bg-card"
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <div
            className="pointer-events-auto flex flex-col gap-1"
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
  )
}
