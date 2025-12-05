/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  IPort,
  IPortConfig,
  NodeExecutionResult,
  ObjectPort,
} from '@badaitech/chaingraph-types'
import type { CallToolResult, ContentBlock, Progress } from '@modelcontextprotocol/sdk/types.js'
import type {
  MCPAudioContent,
  MCPEmbeddedResourceContent,
  MCPImageContent,
  MCPResourceLinkContent,
} from './types'

import {
  deepCopy,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  MultiChannel,
  Node,
  ObjectSchemaCopyTo,
  Output,
  Passthrough,
  PortArray,
  PortObject,
  PortStream,
  PortString,
} from '@badaitech/chaingraph-types'
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { nanoid } from 'nanoid'
import { NODE_CATEGORIES } from '../../categories'
import { MCPConnectionNode } from './mcp-connection.node'

import { MCPConnectionData } from './types'
import {
  MCPProgressMessage,
} from './types'
import {
  MCPTextContent,
} from './types'
import { convertContentBlockToChaingraphContent } from './utils'

@Node({
  type: 'MCPToolCallNode',
  title: 'MCP Tool Call',
  description: 'Invokes tools provided by MCP servers. Discovers available tools dynamically from the connected server.',
  category: NODE_CATEGORIES.MCP,
  tags: ['mcp', 'tool', 'function', 'action', 'api'],
})
export class MCPToolCallNode extends BaseNode {
  @Passthrough()
  @PortObject({
    title: 'Connection',
    description: 'MCP connection object containing server URL and authentication details',
    schema: MCPConnectionData,
  })
  connection: MCPConnectionData = new MCPConnectionData()

  @Passthrough()
  @PortString({
    title: 'Tool',
    description: 'Select a tool from the connected MCP server',
    defaultValue: '',
    required: true,
  })
  toolName: string = ''

  @Passthrough()
  @PortObject({
    title: 'Template Variables',
    description: 'Runtime values for template variables in MCP server headers (e.g., {{api_token}})',
    schema: { properties: {} },
    isSchemaMutable: true,
    required: false,
    defaultValue: {},
    ui: {
      hidden: true, // Hidden by default, unhidden when template variables exist
      collapsed: true,
    },
  })
  templateVariables: Record<string, string> = {}

  @Passthrough()
  @PortObject({
    title: 'Arguments',
    description: 'Tool arguments object with fields matching the selected tool\'s input schema. Required for tool execution - all tool parameters must be provided as properties of this arguments object.',
    schema: { properties: {} },
    isSchemaMutable: true,
    required: true,
  })
  arguments: Record<string, any> = {}

  @Passthrough()
  @PortObject({
    title: 'Output Schema',
    description: 'Schema for the output of the tool call',
    schema: { properties: {} },
    isSchemaMutable: true,
    ui: {
      hidePropertyEditor: false,
      keyDeletable: true,
    },
  })
  @ObjectSchemaCopyTo((port: IPort): boolean => {
    return port.getConfig().key === 'structuredContent' && !port.getConfig().parentId
  })
  outputSchema: Record<string, any> = {}

  @Output()
  @PortArray({
    title: 'Content',
    description: 'Result content blocks',
    itemConfig: {
      type: 'object',
      schema: MCPTextContent, // Simplified for now. TODO: Use a union type for all content types
    },
    defaultValue: [],
  })
  content: Array<MCPTextContent | MCPImageContent | MCPAudioContent | MCPEmbeddedResourceContent | MCPResourceLinkContent> = []

  @Output()
  @PortObject({
    title: 'Structured Content',
    description: 'Structured result data (if output schema defined)',
    schema: { properties: {} },
    ui: {
      hidePropertyEditor: true,
      keyDeletable: false,
    },
  })
  structuredContent?: Record<string, any>

  @Output()
  @PortStream({
    title: 'Content Stream',
    description: 'Streaming content from tool execution',
    itemConfig: {
      type: 'object',
      schema: MCPTextContent, // Simplified for now. TODO: Use a union type for all content types
    },
  })
  contentStream: MultiChannel<ContentBlock> = new MultiChannel<ContentBlock>()

  @Output()
  @PortStream({
    title: 'Progress Stream',
    description: 'Streaming progress updates from tool execution',
    itemConfig: {
      type: 'object',
      schema: MCPProgressMessage,
    },
  })
  progressStream: MultiChannel<MCPProgressMessage> = new MultiChannel<MCPProgressMessage>()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      // Validate connection
      if (!this.connection) {
        throw new Error('MCP connection is required')
      }

      // Collect template variable values from the templateVariables port
      // The templateVariables port contains properties for each template variable
      // e.g., { api_token: "secret123", user_id: "user456" }
      const templateValues = this.templateVariables || {}

      const client = await MCPConnectionNode.createClient(
        this.connection,
        context,
        undefined, // onprogress
        templateValues,
      )

      // Validate tool selection
      if (!this.toolName) {
        throw new Error('Please select a tool')
      }

      const progressToken = nanoid(16)

      // Build clean arguments object with optional empty fields removed
      const cleanArguments = this.buildArguments()

      // Execute the tool
      const result = await client.callTool(
        {
          name: this.toolName,
          arguments: cleanArguments,
          _meta: {
            progressToken,
          },
        },
        CallToolResultSchema,
        {
          onprogress: (progress: Progress) => {
            const progressMessage: MCPProgressMessage = {
              total: progress.total,
              progress: progress.progress,
              message: progress.message,
            }

            console.log(`[MCPToolCallNode] Progress: ${JSON.stringify(progressMessage)}`)

            this.progressStream.send(progressMessage)
          },
          signal: context.abortSignal,
          timeout: 30000, // 30 seconds connection timeout
          resetTimeoutOnProgress: true,
          maxTotalTimeout: 900000, // 15 minutes
        },
      ) as CallToolResult

      // Process the result
      if (result.isError) {
        throw new Error(this.extractErrorMessage(result))
      }

      // Convert response to our result format
      this.content = result.content.map((content) => {
        return convertContentBlockToChaingraphContent(content as ContentBlock)
      })

      this.structuredContent = result.structuredContent

      // TODO: Handle real streaming content
      for (const contentBlock of result.content) {
        const block = contentBlock as ContentBlock
        this.contentStream.send(block)
      }
    } finally {
      // Ensure we close the content stream after execution
      this.contentStream.close()
      this.progressStream.close()
    }

    return {}
  }

  private buildArguments(): Record<string, any> {
    const argumentsPort = this.findPort(
      port => port.getConfig().key === 'arguments' && !port.getConfig().parentId,
    )

    if (!argumentsPort) {
      return {}
    }

    const argumentsPortObject = argumentsPort as ObjectPort
    const cleanedArgs = deepCopy(this.arguments)

    // Clean the arguments object recursively based on schema
    this.cleanArgumentsRecursively(cleanedArgs, argumentsPortObject.getConfig().schema.properties)

    return cleanedArgs
  }

  /**
   * Recursively clean arguments object by removing empty optional fields
   * @param args - The arguments object to clean
   * @param schemaProperties - The schema properties defining the structure
   * @param visited - Set to track visited objects and prevent infinite recursion
   */
  private cleanArgumentsRecursively(
    args: Record<string, any>,
    schemaProperties: Record<string, IPortConfig>,
    visited: WeakSet<object> = new WeakSet(),
  ): void {
    // Prevent infinite recursion for circular references
    if (visited.has(args)) {
      return
    }
    visited.add(args)

    // Iterate over schema properties
    for (const [propertyKey, propertyConfig] of Object.entries(schemaProperties)) {
      const key = propertyConfig.key || propertyKey
      const isArgumentExists = Object.prototype.hasOwnProperty.call(args, key)
      const isPropertyRequired = propertyConfig.required === true
      const argumentValue = args[key]

      // Check if the value is empty
      const isArgumentEmpty = this.isValueEmpty(argumentValue)

      // Remove empty optional fields
      if (isArgumentExists && !isPropertyRequired && isArgumentEmpty) {
        delete args[key]
        continue
      }

      // If value exists and is not empty, recursively clean nested structures
      if (argumentValue !== undefined && argumentValue !== null && !isArgumentEmpty) {
        // Handle nested objects
        if (propertyConfig.type === 'object' && propertyConfig.schema?.properties) {
          if (typeof argumentValue === 'object' && !Array.isArray(argumentValue)) {
            this.cleanArgumentsRecursively(argumentValue, propertyConfig.schema.properties, visited)
          }
        } else if (propertyConfig.type === 'array' && Array.isArray(argumentValue)) {
          // Handle arrays containing objects
          const itemConfig = propertyConfig.itemConfig
          if (itemConfig?.type === 'object' && itemConfig.schema?.properties) {
            // Clean each object in the array
            for (const item of argumentValue) {
              if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                this.cleanArgumentsRecursively(item, itemConfig.schema.properties, visited)
              }
            }
          }
        }
      }
    }
  }

  /**
   * Check if a value is considered empty
   * @param value - The value to check
   * @returns true if the value is empty, false otherwise
   */
  private isValueEmpty(value: any): boolean {
    return value === undefined
      || value === null
      || value === ''
      || value === 0
      || (Array.isArray(value) && value.length === 0)
      || (typeof value === 'object' && Object.keys(value).length === 0)
  }

  private extractErrorMessage(response: CallToolResult): string {
    if (response.content && Array.isArray(response.content)) {
      const textContent = response.content.find((c: any) => c.type === 'text')
      if (textContent && 'text' in textContent) {
        return textContent.text.toString()
      }
    }
    return 'Tool execution failed'
  }
}

export default MCPToolCallNode
