/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MCPServerWithCapabilities } from '@/components/sidebar/tabs/mcp/store'
import type { MCPPromptGetNode } from '@badaitech/chaingraph-nodes'
import type {
  IPortConfig,
  NodeMetadataWithPorts,
  ObjectPort,
  StringPort,
} from '@badaitech/chaingraph-types'
import type { Prompt } from '@modelcontextprotocol/sdk/types.js'
import { NodePreview } from '@/components/sidebar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useCategoryMetadata } from '@/store/categories/useCategories'
import { MCPConnectionData } from '@badaitech/chaingraph-nodes'
import {
  jsonSchemaToPortConfig,
} from '@badaitech/chaingraph-types'
import {
  NodeRegistry,
} from '@badaitech/chaingraph-types'
import { useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'
import { useCallback, useMemo } from 'react'

interface MCPPromptCardProps {
  prompt: Prompt
  server: MCPServerWithCapabilities
}

export function MCPPromptCard({ prompt, server }: MCPPromptCardProps) {
  const argCount = prompt.arguments?.length || 0

  const preparePromptTemplateNode = useCallback((prompt: Prompt): MCPPromptGetNode => {
    const promptGetNode = NodeRegistry.getInstance().createNode('MCPPromptGetNode', 'MCPPromptGet-temp') as MCPPromptGetNode
    if (!promptGetNode) {
      throw new Error('Failed to create promptGetNode')
    }

    promptGetNode.initialize()

    if (prompt.title || prompt.name) {
      // mcpToolNode.metadata.title = `${serverName}: ${(tool.title || tool.name)}`
      promptGetNode.metadata.title = prompt.title || prompt.name
    }

    if (prompt.description) {
      promptGetNode.metadata.description = prompt.description
    }

    /// ///////////////////////////////// connection ////////////////////////////////////
    // Configure the connection with server info
    const connectionPort = promptGetNode.findPort(
      port => port.getConfig().key === 'connection' && !port.getConfig().parentId,
    ) as ObjectPort
    if (!connectionPort) {
      throw new Error('Connection port not found in MCPToolCallNode')
    }

    const connectionPortValue = new MCPConnectionData()
    connectionPortValue.serverUrl = server.url
    connectionPortValue.headers = []

    connectionPort?.setConfig({
      ...connectionPort.getConfig(),
      schema: {
        ...connectionPort.getConfig().schema,
        properties: {
          ...connectionPort.getConfig().schema.properties,
          serverUrl: {
            ...connectionPort.getConfig().schema.properties.serverUrl,
            type: 'string',
            defaultValue: server.url,
          },
          headers: {
            ...connectionPort.getConfig().schema.properties.headers,
            type: 'array',
            defaultValue: server.authHeaders || [],
            itemConfig: {
              ...(connectionPort.getConfig().schema.properties as any).headers.itemConfig,
              type: 'object',
            },
          },
        },
      },
      defaultValue: connectionPortValue,
      ui: {
        ...connectionPort.getConfig().ui,
        hidden: true, // Hide the connection port in the UI
      },
    })
    connectionPort?.setValue(connectionPortValue)

    /// ///////////////////////////////// promptName ////////////////////////////////////
    // Set the prompt name
    const promptNamePort = promptGetNode.findPort(
      port => port.getConfig().key === 'promptName' && !port.getConfig().parentId,
    ) as StringPort

    if (!promptNamePort) {
      throw new Error('Prompt name port not found in MCPPromptGetNode')
    }

    promptNamePort?.setConfig({
      ...promptNamePort.getConfig(),
      defaultValue: prompt.name,
      ui: {
        ...promptNamePort.getConfig().ui,
        hidden: true, // Hide the tool name port in the UI
      },
    })
    promptNamePort?.setValue(prompt.name)

    /// ////////////////////////////////// arguments /////////////////////////////////////
    // Prepare the prompt template node with arguments
    if (prompt.arguments && prompt.arguments.length > 0) {
      const argumentsPort = promptGetNode.findPort(
        port => port.getConfig().key === 'arguments' && !port.getConfig().parentId,
      ) as ObjectPort

      if (!argumentsPort) {
        throw new Error('Arguments port not found in MCPPromptGetNode')
      }

      const argumentsConfig: IPortConfig = {
        ...argumentsPort.getConfig(),
        defaultValue: prompt.arguments.reduce((acc, arg) => {
          acc[arg.name] = arg.defaultValue || ''
          return acc
        }, {} as Record<string, any>),
        isSchemaMutable: false,
        ui: {
          ...argumentsPort.getConfig().ui,
          collapsed: true,
        },
        schema: {
          type: 'object',
          properties: Object.fromEntries(
            prompt.arguments.map((arg, index) => [
              arg.name,

              jsonSchemaToPortConfig(
                arg.name,
                arg,
                arg.required ? [arg.name] : undefined,
                index,
              ),
            ]),
          ),
        },
      }

      argumentsPort.setConfig(argumentsConfig)
      argumentsPort.setValue(argumentsConfig.defaultValue)
    }

    return promptGetNode
  }, [server])

  const node = useMemo(() => {
    const promptTemplateNode = preparePromptTemplateNode(prompt)
    if (!promptTemplateNode) {
      throw new Error('Failed to create MCPPromptTemplateNode')
    }

    const portsConfig = new Map<string, IPortConfig>()

    // use mcpToolNode.ports to fill portsConfig
    promptTemplateNode.ports.forEach((port) => {
      if (!port.isSystem() && !port.getConfig().parentId) {
        portsConfig.set(port.key, port.getConfig())
      }
    })

    const nodeMetadataWithPorts: NodeMetadataWithPorts = {
      ...promptTemplateNode.metadata,
      portsConfig,
    }

    return nodeMetadataWithPorts
  }, [prompt, preparePromptTemplateNode])

  const categoryMetadata = useCategoryMetadata('mcp')

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `mcp-prompt-${prompt.name}`,
    data: {
      node,
      categoryMetadata,
    },
  })

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
