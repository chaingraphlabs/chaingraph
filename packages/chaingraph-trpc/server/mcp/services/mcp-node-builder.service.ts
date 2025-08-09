/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MCPPromptGetNode, MCPResourceReadNode, MCPToolCallNode } from '@badaitech/chaingraph-nodes'
import type { INode, IPort, IPortConfig, NodeRegistry, ObjectPort, StringPort } from '@badaitech/chaingraph-types'
import type { Prompt, Resource, ResourceTemplate, Tool } from '@modelcontextprotocol/sdk/types.js'
import type { MCPServer } from '../stores/types'
import { MCPConnectionData } from '@badaitech/chaingraph-nodes'
import { jsonSchemaToPortConfig } from '@badaitech/chaingraph-types'
import { parse } from 'uri-template'

export class MCPNodeBuilderService {
  constructor(private nodeRegistry: NodeRegistry) {}

  buildToolNode(server: MCPServer, tool: Tool): INode {
    const mcpToolNode = this.nodeRegistry.createNode('MCPToolCallNode', 'temp') as MCPToolCallNode
    if (!mcpToolNode) {
      throw new Error('Failed to create MCPToolCallNode')
    }

    mcpToolNode.initialize()

    // Set metadata
    if (tool.title || tool.name) {
      mcpToolNode.metadata.title = tool.title || tool.annotations?.title || tool.name
    }
    if (tool.description) {
      mcpToolNode.metadata.description = tool.description
    }

    // Configure connection port
    const connectionPort = mcpToolNode.findPort(
      port => port.getConfig().key === 'connection' && !port.getConfig().parentId,
    ) as ObjectPort
    if (!connectionPort) {
      throw new Error('Connection port not found in MCPToolCallNode')
    }

    const connectionData = new MCPConnectionData()
    connectionData.serverUrl = server.url

    // TODO: do we really need to support secrets here?
    // connectionData.headers = server.authHeaders || []

    this.configureConnectionPort(connectionPort, server, connectionData)

    // Set tool name
    const toolNamePort = mcpToolNode.findPort(
      port => port.getConfig().key === 'toolName' && !port.getConfig().parentId,
    ) as StringPort
    if (!toolNamePort) {
      throw new Error('Tool name port not found in MCPToolCallNode')
    }

    toolNamePort.setConfig({
      ...toolNamePort.getConfig(),
      defaultValue: tool.name,
      ui: {
        ...toolNamePort.getConfig().ui,
        hidden: true,
      },
    })
    toolNamePort.setValue(tool.name)

    // Configure arguments port
    const argumentsPort = mcpToolNode.findPort(
      port => port.getConfig().key === 'arguments' && !port.getConfig().parentId,
    ) as ObjectPort
    if (!argumentsPort) {
      throw new Error('Arguments port not found in MCPToolCallNode')
    }

    if (tool.inputSchema && tool.inputSchema.properties) {
      const properties: IPortConfig[] = []
      for (const [key, value] of Object.entries(tool.inputSchema.properties)) {
        const portConfig = jsonSchemaToPortConfig(
          key,
          value,
          tool.inputSchema.required,
          properties.length,
        )
        if (!portConfig.description || portConfig.description === '') {
          portConfig.description = `Argument for ${tool.name}`
        }
        properties.push(portConfig)
      }

      if (properties.length > 0) {
        mcpToolNode.addObjectProperties(argumentsPort as IPort, properties)

        argumentsPort.setConfig({
          ...argumentsPort.getConfig(),
          isSchemaMutable: false,
          required: true,
          ui: {
            ...argumentsPort.getConfig().ui,
            collapsed: true,
            hidden: properties.length === 0,
          },
        })
      } else {
        argumentsPort.setConfig({
          ...argumentsPort.getConfig(),
          ui: {
            ...argumentsPort.getConfig().ui,
            hidden: true,
          },
        })
      }
    } else {
      argumentsPort.setConfig({
        ...argumentsPort.getConfig(),
        ui: {
          ...argumentsPort.getConfig().ui,
          hidden: true,
        },
      })
    }

    // Configure output schema port
    const outputSchemaPort = mcpToolNode.findPort(
      port => port.getConfig().key === 'outputSchema' && !port.getConfig().parentId,
    ) as ObjectPort
    const structuredContentPort = mcpToolNode.findPort(
      port => port.getConfig().key === 'structuredContent' && !port.getConfig().parentId,
    )

    if (!outputSchemaPort || !structuredContentPort) {
      throw new Error('Output schema port not found in MCPToolCallNode')
    }

    if (tool.outputSchema && tool.outputSchema.properties) {
      const properties: IPortConfig[] = []
      for (const [key, value] of Object.entries(tool.outputSchema.properties)) {
        const portConfig = jsonSchemaToPortConfig(
          key,
          value,
          tool.outputSchema.required,
          properties.length,
        )
        if (!portConfig.description || portConfig.description === '') {
          portConfig.description = `Output for ${tool.name}`
        }
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
        isSchemaMutable: false,
        ui: {
          ...outputSchemaPort.getConfig().ui,
          collapsed: true,
          hidden: true,
        },
      })
    } else {
      outputSchemaPort.setConfig({
        ...outputSchemaPort.getConfig(),
        ui: {
          ...outputSchemaPort.getConfig().ui,
          hidden: true,
        },
      })
      structuredContentPort.setConfig({
        ...structuredContentPort.getConfig(),
        ui: {
          ...structuredContentPort.getConfig().ui,
          hidden: true,
        },
      })
    }

    return mcpToolNode
  }

  buildResourceNode(server: MCPServer, resource: Resource | ResourceTemplate): INode {
    const resourceReadNode = this.nodeRegistry.createNode('MCPResourceReadNode', 'temp') as MCPResourceReadNode
    if (!resourceReadNode) {
      throw new Error('Failed to create MCPResourceReadNode')
    }

    resourceReadNode.initialize()

    const resourceUri = (resource.uri || resource.uriTemplate || 'undefined').toString()

    // Set metadata
    if (resource.title || resource.name) {
      resourceReadNode.metadata.title = resource.title || resource.name
    }
    if (resource.description) {
      resourceReadNode.metadata.description = `${resource.description}\n\n**URI:** ${resourceUri}\n**Mime:** ${resource.mimeType}`
    } else {
      resourceReadNode.metadata.description = `**URI:** ${resourceUri}\n**Mime:** ${resource.mimeType}`
    }

    // Configure connection port
    const connectionPort = resourceReadNode.findPort(
      port => port.getConfig().key === 'connection' && !port.getConfig().parentId,
    ) as ObjectPort
    if (!connectionPort) {
      throw new Error('Connection port not found in MCPResourceReadNode')
    }

    const connectionData = new MCPConnectionData()
    connectionData.serverUrl = server.url
    // connectionData.headers = server.authHeaders || []

    this.configureConnectionPort(connectionPort, server, connectionData)

    // Configure URI port
    const uriPort = resourceReadNode.findPort(
      port => port.getConfig().key === 'uri' && !port.getConfig().parentId,
    ) as StringPort
    if (!uriPort) {
      throw new Error('URI port not found in MCPResourceReadNode')
    }

    uriPort.setConfig({
      ...uriPort.getConfig(),
      defaultValue: resourceUri,
      ui: {
        ...uriPort.getConfig().ui,
        disabled: true,
      },
    })
    uriPort.setValue(resourceUri)

    // Configure arguments port for resource templates
    const argumentsPort = resourceReadNode.findPort(
      port => port.getConfig().key === 'arguments' && !port.getConfig().parentId,
    ) as ObjectPort
    if (!argumentsPort) {
      throw new Error('Arguments port not found in MCPResourceReadNode')
    }

    if ('uriTemplate' in resource && resource.uriTemplate) {
      const resourceArguments = this.getResourceArguments(resource as ResourceTemplate)
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
  }

  buildPromptNode(server: MCPServer, prompt: Prompt): INode {
    const promptGetNode = this.nodeRegistry.createNode('MCPPromptGetNode', 'temp') as MCPPromptGetNode
    if (!promptGetNode) {
      throw new Error('Failed to create MCPPromptGetNode')
    }

    promptGetNode.initialize()

    // Set metadata
    if (prompt.title || prompt.name) {
      promptGetNode.metadata.title = prompt.title || prompt.name
    }
    if (prompt.description) {
      promptGetNode.metadata.description = prompt.description
    }

    // Configure connection port
    const connectionPort = promptGetNode.findPort(
      port => port.getConfig().key === 'connection' && !port.getConfig().parentId,
    ) as ObjectPort
    if (!connectionPort) {
      throw new Error('Connection port not found in MCPPromptGetNode')
    }

    const connectionData = new MCPConnectionData()
    connectionData.serverUrl = server.url
    // connectionData.headers = server.authHeaders || []

    this.configureConnectionPort(connectionPort, server, connectionData)

    // Set prompt name
    const promptNamePort = promptGetNode.findPort(
      port => port.getConfig().key === 'promptName' && !port.getConfig().parentId,
    ) as StringPort
    if (!promptNamePort) {
      throw new Error('Prompt name port not found in MCPPromptGetNode')
    }

    promptNamePort.setConfig({
      ...promptNamePort.getConfig(),
      defaultValue: prompt.name,
      ui: {
        ...promptNamePort.getConfig().ui,
        hidden: true,
      },
    })
    promptNamePort.setValue(prompt.name)

    // Configure arguments

    const argumentsPort = promptGetNode.findPort(
      port => port.getConfig().key === 'arguments' && !port.getConfig().parentId,
    ) as ObjectPort
    if (!argumentsPort) {
      throw new Error('Arguments port not found in MCPPromptGetNode')
    }

    if (prompt.arguments && prompt.arguments.length > 0) {
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
    } else {
      argumentsPort.setConfig({
        ...argumentsPort.getConfig(),
        ui: {
          ...argumentsPort.getConfig().ui,
          hidden: true,
        },
      })
      argumentsPort.setValue({})
    }

    return promptGetNode
  }

  private configureConnectionPort(connectionPort: ObjectPort, server: MCPServer, connectionData: MCPConnectionData): void {
    connectionPort.setConfig({
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
      defaultValue: connectionData,
      ui: {
        ...connectionPort.getConfig().ui,
        hidden: true,
      },
    })
    connectionPort.setValue(connectionData)
  }

  private getResourceArguments(resource: ResourceTemplate): Record<string, IPortConfig> {
    const variables: Record<string, IPortConfig> = {}

    const parsedTemplate = parse(resource.uriTemplate)
    parsedTemplate.ast.parts.forEach((part) => {
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
}
