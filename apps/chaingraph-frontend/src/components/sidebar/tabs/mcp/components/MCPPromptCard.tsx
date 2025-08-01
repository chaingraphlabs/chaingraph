/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MCPServerWithCapabilities } from '@/components/sidebar/tabs/mcp/store'
import type { Prompt } from '@modelcontextprotocol/sdk/types.js'
import { NodePreview } from '@/components/sidebar'
import { buildNodeMetadataWithPorts } from '@/components/sidebar/tabs/mcp/utils/node'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useCategoryMetadata } from '@/store/categories/useCategories'
import { useDraggable } from '@dnd-kit/core'
import { useUnit } from 'effector-react'
import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import { useMemo } from 'react'
import { $mcpServersWithNodes } from '../store'

interface MCPPromptCardProps {
  prompt: Prompt
  server: MCPServerWithCapabilities
}

export function MCPPromptCard({ prompt, server }: MCPPromptCardProps) {
  const servers = useUnit($mcpServersWithNodes)
  const serverWithNodes = servers.find(s => s.id === server.id)

  const argCount = prompt.arguments?.length || 0

  const node = useMemo(() => {
    if (!serverWithNodes?.nodes)
      return null

    // Find the specific prompt node by checking the promptName port value
    const promptNode = serverWithNodes.nodes.prompts.find((n) => {
      // The backend stores the prompt name in a port with key 'promptName'
      const promptNamePort = n.findPort(
        p => p.getConfig().key === 'promptName' && !p.getConfig().parentId,
      )
      if (promptNamePort) {
        const promptNameValue = promptNamePort.getValue()
        return promptNameValue === prompt.name
      }

      // Fallback to metadata matching if port not found
      return n.metadata.title === prompt.name
    })

    if (!promptNode) {
      console.warn(`[MCPPromptCard] Could not find pre-built node for prompt: ${prompt.name}`)
      return null
    }

    return buildNodeMetadataWithPorts(promptNode)
  }, [serverWithNodes, prompt])

  const categoryMetadata = useCategoryMetadata('mcp')

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `mcp-prompt-${prompt.name}`,
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
        <MessageSquare className="h-3 w-3 text-muted-foreground animate-pulse" />
        <span className="text-xs">Loading...</span>
      </div>
    )
  }

  // Show error state if node couldn't be found
  if (!node) {
    return (
      <div className="flex items-center gap-2 py-1 px-2 opacity-50">
        <MessageSquare className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs line-through">
          {prompt.name}
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
            {/* Prompt Icon and Name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs truncate font-medium">
                  {prompt.name}
                </span>
              </div>
            </div>

            {/* Argument Count */}
            {argCount > 0 && (
              <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                {argCount}
                {' '}
                args
              </Badge>
            )}
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
