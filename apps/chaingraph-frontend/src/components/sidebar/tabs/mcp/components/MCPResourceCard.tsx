/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MCPServerWithCapabilities } from '@/components/sidebar/tabs/mcp/store'
import type { MCPResourceReadNode } from '@badaitech/chaingraph-nodes'
import type {
  IPortConfig,
  NodeMetadataWithPorts,
  ObjectPort,
  StringPort,
} from '@badaitech/chaingraph-types'
import type { Resource, ResourceTemplate } from '@modelcontextprotocol/sdk/types.js'

import { NodePreview } from '@/components/sidebar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useCategoryMetadata } from '@/store/categories/useCategories'
import { MCPConnectionData } from '@badaitech/chaingraph-nodes'

import {

  NodeRegistry,

} from '@badaitech/chaingraph-types'
import { useDraggable } from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { File, FileBox, FileImage, FileJson, FileText } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { parse } from 'uri-template'

interface MCPResourceCardProps {
  resource: Resource | ResourceTemplate
  server: MCPServerWithCapabilities
}

export function MCPResourceCard({ resource, server }: MCPResourceCardProps) {
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

  const prepareResourceNode = useCallback((resource: Resource | ResourceTemplate): MCPResourceReadNode => {
    const resourceReadNode = NodeRegistry.getInstance().createNode('MCPResourceReadNode', 'MCPResourceReadNode-temp') as MCPResourceReadNode
    if (!resourceReadNode) {
      throw new Error('Failed to create MCPResourceReadNode')
    }

    resourceReadNode.initialize()

    const resourceUri = (resource.uri || resource.uriTemplate || 'undefined').toString()

    if (resource.title || resource.name) {
      // mcpToolNode.metadata.title = `${serverName}: ${(tool.title || tool.name)}`
      resourceReadNode.metadata.title = resource.title || resource.name
    }

    if (resource.description) {
      resourceReadNode.metadata.description = `${resource.description}\n\n**URI:** ${resourceUri}\n**Mime:** ${resource.mimeType}`
    } else {
      resourceReadNode.metadata.description = `**URI:** ${resourceUri}\n**Mime:** ${resource.mimeType}`
    }

    /// ///////////////////////////////// connection ////////////////////////////////////
    // Configure the connection with server info
    const connectionPort = resourceReadNode.findPort(
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

    /// ///////////////////////////////// uri ////////////////////////////////////
    const resourceURI = resourceReadNode.findPort(
      port => port.getConfig().key === 'uri' && !port.getConfig().parentId,
    ) as StringPort

    if (!resourceURI) {
      throw new Error('URI port not found in MCPResourceReadNode')
    }

    resourceURI?.setConfig({
      ...resourceURI.getConfig(),
      defaultValue: resourceUri,
      ui: {
        ...resourceURI.getConfig().ui,
        disabled: true,
        // hidden: true, // Hide the tool name port in the UI
      },
    })
    resourceURI?.setValue(resourceUri)

    /// ///////////////////////////////// arguments ////////////////////////////////////
    const argumentsPort = resourceReadNode.findPort(
      port => port.getConfig().key === 'arguments' && !port.getConfig().parentId,
    ) as ObjectPort

    if (!argumentsPort) {
      throw new Error('Arguments port not found in MCPResourceReadNode')
    }

    // Set the arguments port with an empty object if no arguments are provided

    function getResourceArguments(resource: ResourceTemplate): Record<string, IPortConfig> {
      const variables: Record<string, IPortConfig> = {}

      // A URI template (according to RFC 6570) that can be used to construct resource URIs.
      const parsedTemplate = parse(resource.uriTemplate)
      parsedTemplate.ast.parts.forEach((part) => {
        console.log(`[MCPResourceCard] URI Template Part:`, part)

        if (part.type === 'expression') {
          part.variables.forEach((variable) => {
            if (!variable.name) {
              return
            }

            variables[variable.name] = {
              type: 'string',
              title: variable.name,
              description: `Variable for ${variable.name} in URI template`,
              defaultValue: '',
              required: true,
            } as IPortConfig
          })
        }
      })

      return variables
    }

    if ('uriTemplate' in resource && resource.uriTemplate) {
      const resourceArguments = getResourceArguments(resource as ResourceTemplate)
      if (Object.keys(resourceArguments).length > 0) {
        const argumentsConfig: IPortConfig = {
          ...argumentsPort.getConfig(),
          defaultValue: Object.fromEntries(
            Object.entries(resourceArguments).map(([key, value]) => [key, value.defaultValue || '']),
          ),
          isSchemaMutable: false,
          ui: {
            ...argumentsPort.getConfig().ui,
            collapsed: true,
          },
          schema: {
            type: 'object',
            properties: resourceArguments,
          },
        }

        argumentsPort.setConfig(argumentsConfig)
        argumentsPort.setValue(argumentsConfig.defaultValue)
      } else {
        // If no arguments are provided, set an empty object
        argumentsPort.setConfig({
          ...argumentsPort.getConfig(),
          ui: {
            ...argumentsPort.getConfig().ui,
            hidden: true,
          },
        })
        argumentsPort.setValue({})
      }
    } else {
      // If no arguments are provided, set an empty object
      argumentsPort.setConfig({
        ...argumentsPort.getConfig(),
        ui: {
          ...argumentsPort.getConfig().ui,
          hidden: true,
        },
      })
      argumentsPort.setValue({})
    }

    return resourceReadNode
  }, [server])

  const node = useMemo(() => {
    const resourceReadNode = prepareResourceNode(resource)
    if (!resourceReadNode) {
      throw new Error('Failed to create MCPPromptTemplateNode')
    }

    const portsConfig = new Map<string, IPortConfig>()

    // use mcpToolNode.ports to fill portsConfig
    resourceReadNode.ports.forEach((port) => {
      if (!port.isSystem() && !port.getConfig().parentId) {
        portsConfig.set(port.key, port.getConfig())
      }
    })

    const nodeMetadataWithPorts: NodeMetadataWithPorts = {
      ...resourceReadNode.metadata,
      portsConfig,
    }

    return nodeMetadataWithPorts
  }, [resource, prepareResourceNode])

  const categoryMetadata = useCategoryMetadata('mcp')

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `mcp-resource-${resource.name}`,
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
