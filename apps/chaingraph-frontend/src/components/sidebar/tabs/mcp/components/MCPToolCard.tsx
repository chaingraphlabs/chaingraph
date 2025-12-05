/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { MCPServerWithCapabilities } from '@/components/sidebar/tabs/mcp/store'
import { useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { Code2 } from 'lucide-react'
import { useMemo } from 'react'
import { NodePreview } from '@/components/sidebar'
import { useMCPServerWithNodes } from '@/components/sidebar/tabs/mcp/store/useMCPServerWithNodes'
import { buildNodeMetadataWithPorts } from '@/components/sidebar/tabs/mcp/utils/node'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useCategoryMetadata } from '@/store/categories/useCategories'
import { countTemplateVariables } from '../utils'

interface MCPToolCardProps {
  tool: Tool
  server: MCPServerWithCapabilities
}

export function MCPToolCard({ tool, server }: MCPToolCardProps) {
  const serverWithNodes = useMCPServerWithNodes(server.id)

  const paramCount = Object.keys(tool.inputSchema?.properties || {}).length || 0

  // Count template variables from server authHeaders
  const templateVarCount = useMemo(
    () => countTemplateVariables(server.authHeaders),
    [server.authHeaders],
  )

  const node = useMemo(() => {
    if (!serverWithNodes?.nodes)
      return null

    // Find the specific tool node by checking the toolName port value
    const toolNode = serverWithNodes.nodes.tools.find((n) => {
      // The backend stores the tool name in a port with key 'toolName'
      const toolNamePort = n.findPort(
        p => p.getConfig().key === 'toolName' && !p.getConfig().parentId,
      )
      if (toolNamePort) {
        const toolNameValue = toolNamePort.getValue()
        return toolNameValue === tool.name
      }

      // Fallback to metadata matching if port not found
      return n.metadata.title === tool.name
    })

    if (!toolNode) {
      console.warn(`[MCPToolCard] Could not find pre-built node for tool: ${tool.name}`)
      return null
    }

    return buildNodeMetadataWithPorts(toolNode)
  }, [serverWithNodes, tool])

  const categoryMetadata = useCategoryMetadata('mcp')

  // Setup draggable
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `mcp-tool-${tool.name}`,
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
        <Code2 className="h-3 w-3 text-muted-foreground animate-pulse" />
        <span className="text-xs">Loading...</span>
      </div>
    )
  }

  // Show error state if node couldn't be found
  if (!node) {
    return (
      <div className="flex items-center gap-2 py-1 px-2 opacity-50">
        <Code2 className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs line-through">
          {tool.title || tool.annotations?.title || tool.name}
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
            {/* Tool Icon and Name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Code2 className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs truncate font-medium">
                  {tool.title || tool.annotations?.title || tool.name}
                </span>
              </div>
            </div>

            {/* Parameter Count */}
            {paramCount > 0 && (
              <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                {paramCount}
                {' '}
                params
              </Badge>
            )}

            {/* Template Variable Count */}
            {templateVarCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                {templateVarCount}
                {' '}
                vars
              </Badge>
            )}
          </div>
        </TooltipTrigger>

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
  )
}
