/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MCPServerWithCapabilities } from '@/components/sidebar/tabs/mcp/store'
import type { MCPToolCallNode } from '@badaitech/chaingraph-nodes'
import type {
  IPort,
  IPortConfig,
  NodeMetadataWithPorts,
  ObjectPort,
  StringPort,
} from '@badaitech/chaingraph-types'
import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { NodePreview } from '@/components/sidebar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useCategoryMetadata } from '@/store/categories/useCategories'
import { MCPConnectionData } from '@badaitech/chaingraph-nodes'
import { jsonSchemaToPortConfig } from '@badaitech/chaingraph-types'

import { NodeRegistry } from '@badaitech/chaingraph-types'
import { useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { Code2 } from 'lucide-react'
import { useCallback, useMemo } from 'react'

interface MCPToolCardProps {
  tool: Tool
  server: MCPServerWithCapabilities
}

//
// TODO: Very experimental component for MCP tools, such logic must be on the backend side
//
export function MCPToolCard({ tool, server }: MCPToolCardProps) {
  const paramCount = Object.keys(tool.inputSchema?.properties || {}).length || 0

  const prepareToolCallNode = useCallback((tool: Tool): MCPToolCallNode => {
    const mcpToolNode = NodeRegistry.getInstance().createNode('MCPToolCallNode', 'temp') as MCPToolCallNode
    if (!mcpToolNode) {
      throw new Error('Failed to create MCPToolCallNode')
    }

    mcpToolNode.initialize()

    if (tool.title || tool.name) {
      // mcpToolNode.metadata.title = `${serverName}: ${(tool.title || tool.name)}`
      mcpToolNode.metadata.title = tool.title || tool.annotations?.title || tool.name
    }

    if (tool.description) {
      mcpToolNode.metadata.description = tool.description
    }

    /// ///////////////////////////////// connection ////////////////////////////////////
    // Configure the connection with server info
    const connectionPort = mcpToolNode.findPort(
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

    console.log(`[MCPToolCard] Connection port set for ${tool.name}:`, connectionPort.serialize())

    // mcpToolNode.connection.serverUrl = server.url
    // mcpToolNode.connection.headers = authHeaders.reduce((acc, header) => {
    //   if (header.key && header.value) {
    //     acc[header.key] = header.value
    //   }
    //   return acc
    // }, {} as Record<string, string>)

    /// ///////////////////////////////// toolName ////////////////////////////////////
    // Set the tool name
    const toolNamePort = mcpToolNode.findPort(
      port => port.getConfig().key === 'toolName' && !port.getConfig().parentId,
    ) as StringPort

    if (!toolNamePort) {
      throw new Error('Tool name port not found in MCPToolCallNode')
    }

    toolNamePort?.setConfig({
      ...toolNamePort.getConfig(),
      defaultValue: tool.name,
      ui: {
        ...toolNamePort.getConfig().ui,
        hidden: true, // Hide the tool name port in the UI
      },
    })
    toolNamePort?.setValue(tool.name)

    /// ///////////////////////////////// arguments ////////////////////////////////////
    const argumentsPort = mcpToolNode.findPort(
      port => port.getConfig().key === 'arguments' && !port.getConfig().parentId,
    ) as ObjectPort

    if (!argumentsPort) {
      throw new Error('Arguments port not found in MCPToolCallNode')
    }

    argumentsPort.setConfig({
      ...argumentsPort.getConfig(),
      ui: {
        ...argumentsPort.getConfig().ui,
        collapsed: false,
      },
    })

    if (tool.inputSchema) {
      const properties: IPortConfig[] = []

      for (const [key, value] of Object.entries(tool.inputSchema.properties || {})) {
        console.log(`[MCPToolCard] Adding argument port for ${key}:`, value)
        const portConfig = jsonSchemaToPortConfig(
          key,
          value,
          tool.inputSchema.required,
          properties.length,
        )
        // Ensure description includes tool name if not already set
        if (!portConfig.description || portConfig.description === '') {
          portConfig.description = `Argument for ${tool.name}`
        }
        properties.push(portConfig)
      }

      if (properties.length > 0) {
        mcpToolNode.addObjectProperties(argumentsPort as IPort, properties)
      }

      argumentsPort.setConfig({
        ...argumentsPort.getConfig(),
        isSchemaMutable: false, // Prevent schema changes because MCP tools have fixed schemas
        ui: {
          ...argumentsPort.getConfig().ui,
          collapsed: true,
          hidden: properties.length === 0, // Hide the arguments port if no properties are defined
        },
      })
    } else {
      argumentsPort.setConfig({
        ...argumentsPort.getConfig(),
        ui: {
          ...argumentsPort.getConfig().ui,
          hidden: true, // Hide the arguments port in the UI if no input schema is defined
        },
      })
    }

    /// ///////////////////////////////// outputSchema ////////////////////////////////////
    const outputSchemaPort = mcpToolNode.findPort(
      port => port.getConfig().key === 'outputSchema' && !port.getConfig().parentId,
    ) as ObjectPort

    const structuredContentPort = mcpToolNode.findPort(
      port => port.getConfig().key === 'structuredContent' && !port.getConfig().parentId,
    )

    if (!outputSchemaPort || !structuredContentPort) {
      throw new Error('Output schema port not found in MCPToolCallNode')
    }

    if (tool.outputSchema) {
      const properties: IPortConfig[] = []

      for (const [key, value] of Object.entries(tool.outputSchema.properties || {})) {
        console.log(`[MCPToolCard] Adding output schema port for ${key}:`, value)

        const portConfig = jsonSchemaToPortConfig(
          key,
          value,
          tool.outputSchema?.required,
          properties.length,
        )
        // Ensure description includes tool name if not already set
        if (!portConfig.description || portConfig.description === '') {
          portConfig.description = `Output for ${tool.name}`
        }
        // Set UI properties specific to output schema
        portConfig.ui = {
          ...portConfig.ui,
          hideEditor: true,
          keyDeletable: true,
        }
        properties.push(portConfig)
      }

      mcpToolNode.addObjectProperties(outputSchemaPort as IPort, properties)

      outputSchemaPort.setConfig({
        ...outputSchemaPort.getConfig(),
        isSchemaMutable: false, // Prevent schema changes because MCP tools have fixed schemas
        ui: {
          ...outputSchemaPort.getConfig().ui,
          collapsed: true,
          hidden: true, // Hide the output schema port in the UI
        },
      })
    } else {
      // If no output schema is defined, hide the outputSchema port
      outputSchemaPort.setConfig({
        ...outputSchemaPort.getConfig(),
        ui: {
          ...outputSchemaPort.getConfig().ui,
          hidden: true, // Hide the output schema port in the UI
        },
      })

      structuredContentPort.setConfig({
        ...structuredContentPort.getConfig(),
        ui: {
          ...structuredContentPort.getConfig().ui,
          hidden: true, // Hide the structured content port in the UI
        },
      })
    }

    // await mcpToolNode.updatePorts([
    //   connectionPort as IPort,
    //   toolNamePort as IPort,
    // ])

    return mcpToolNode
  }, [server])

  const node = useMemo(() => {
    const mcpToolNode = prepareToolCallNode(tool)
    if (!mcpToolNode) {
      throw new Error('Failed to prepare MCPToolCallNode')
    }

    const portsConfig = new Map<string, IPortConfig>()

    // use mcpToolNode.ports to fill portsConfig
    mcpToolNode.ports.forEach((port) => {
      if (!port.isSystem() && !port.getConfig().parentId) {
        portsConfig.set(port.key, port.getConfig())
      }
    })

    console.log(`[MCPToolCard] Ports config for ${tool.name}:`, portsConfig)

    const nodeMetadataWithPorts: NodeMetadataWithPorts = {
      ...mcpToolNode.metadata,
      portsConfig,
    }

    return nodeMetadataWithPorts
  }, [prepareToolCallNode, tool])

  const categoryMetadata = useCategoryMetadata('mcp')

  // Setup draggable
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `mcp-tool-${tool.name}`,
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
