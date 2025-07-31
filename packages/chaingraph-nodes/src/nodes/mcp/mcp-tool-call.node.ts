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
  NodeEvent,
  NodeExecutionResult,
  PortDeleteEvent,
  PortUpdateEvent,
} from '@badaitech/chaingraph-types'
import type { CallToolResult, ContentBlock, Progress } from '@modelcontextprotocol/sdk/types.js'

import type {
  MCPAudioContent,
  MCPEmbeddedResourceContent,
  MCPImageContent,
  MCPResourceLinkContent,
} from './types'
import {
  Passthrough,
} from '@badaitech/chaingraph-types'
import {
  ObjectPort,
} from '@badaitech/chaingraph-types'
import { NodeEventType,
} from '@badaitech/chaingraph-types'
import {
  PortArray,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  MultiChannel,
  Node,
  Output,
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
    title: 'Arguments',
    description: 'Tool arguments (schema depends on selected tool)',
    schema: { properties: {} },
    isSchemaMutable: true,
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
  outputSchema: Record<string, any> = {}

  // @Output()
  // @PortObject({
  //   title: 'Result',
  //   description: 'Tool execution result',
  //   schema: MCPToolResult,
  // })
  // result?: MCPToolResult

  @Output()
  @PortArray({
    title: 'Content',
    description: 'Result content blocks',
    itemConfig: {
      type: 'object',
      schema: MCPTextContent, // Simplified for now
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
      schema: MCPTextContent, // Simplified for now
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

      const client = await MCPConnectionNode.createClient(
        this.connection,
        context,
      )

      // Validate tool selection
      if (!this.toolName) {
        throw new Error('Please select a tool')
      }

      const progressToken = nanoid(16)

      // TODO: Validate arguments against tool schema if available

      // Execute the tool
      const result = await client.callTool(
        {
          name: this.toolName,
          arguments: this.arguments,
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

  async onEvent(event: NodeEvent): Promise<void> {
    await super.onEvent(event)

    switch (event.type) {
      case NodeEventType.PortUpdate:
        return this.handlePortUpdate(event as PortUpdateEvent)
      case NodeEventType.PortDelete:
        return this.handlePortDelete(event as PortDeleteEvent)
    }
  }

  async handlePortUpdate(event: PortUpdateEvent): Promise<void> {
    const sourcePort = event.port
    if (!this.isOutputSchemaPort(sourcePort)) {
      return
    }

    const structuredContentPort = this.getStructuredContentPort()
    if (!structuredContentPort) {
      // No structured content port available, nothing to update
      return
    }

    this.copyObjectSchemaTo(this, sourcePort as ObjectPort, structuredContentPort, true)
  }

  async handlePortDelete(event: PortDeleteEvent): Promise<void> {
    const outputSchemaPort = this.getOutputSchemaPort()
    const structuredContentPort = this.getStructuredContentPort()

    if (!outputSchemaPort || !structuredContentPort) {
      // No output schema or structured content port available, nothing to update
      return
    }

    // Resync the output schema to the structured content port
    // This will remove the deleted property from the structured content port
    this.copyObjectSchemaTo(this, outputSchemaPort, structuredContentPort, true)
  }

  isOutputSchemaPort(port: IPort): boolean {
    if (!port) {
      return false
    }

    const portConfig = port.getConfig()
    if (!portConfig || !portConfig.key || !portConfig.type || portConfig.type !== 'object') {
      return false
    }

    return portConfig.key === 'outputSchema' && portConfig.direction === 'passthrough'
  }

  getOutputSchemaPort(): ObjectPort | undefined {
    const outputPort = this.getInputs().find(p => p.getConfig().key === 'outputSchema')
    if (outputPort && outputPort instanceof ObjectPort) {
      return outputPort as ObjectPort
    }
    return undefined
  }

  getStructuredContentPort(): ObjectPort | undefined {
    const outputPort = this.getOutputs().find(p => p.getConfig().key === 'structuredContent')
    if (outputPort && outputPort instanceof ObjectPort) {
      return outputPort as ObjectPort
    }
    return undefined
  }

  private extractErrorMessage(response: CallToolResult): string {
    if (response.content && Array.isArray(response.content)) {
      const textContent = response.content.find((c: any) => c.type === 'text')
      if (textContent?.text) {
        return textContent.text.toString()
      }
    }
    return 'Tool execution failed'
  }
}

export default MCPToolCallNode
