/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import type { GetPromptResult, Progress } from '@modelcontextprotocol/sdk/types.js'
import type {
  MCPResourceLinkContent,
} from './types'
import type {
  MCPImageContent,
} from './types'

import type {
  MCPTextContent,
} from './types'
import {
  MultiChannel,
  PortStream,
} from '@badaitech/chaingraph-types'
import {
  Passthrough,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Node,
  Output,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'
import { nanoid } from 'nanoid'
import { NODE_CATEGORIES } from '../../categories'
import { MCPConnectionNode } from './mcp-connection.node'

import {
  MCPPromptMessage,
} from './types'

import {
  MCPPromptResult,
} from './types'
import {
  MCPProgressMessage,
} from './types'
import { MCPConnectionData } from './types'
import { convertContentBlockToChaingraphContent } from './utils'

// Content block type for stream
type ContentBlock = MCPTextContent | MCPImageContent | MCPResourceLinkContent

@Node({
  type: 'MCPPromptGetNode',
  title: 'MCP Prompt Get',
  description: 'Fetches a prompt from an MCP server and returns its content',
  category: NODE_CATEGORIES.MCP,
  tags: ['mcp', 'prompt'],
})
export class MCPPromptGetNode extends BaseNode {
  @Passthrough()
  @PortObject({
    title: 'Connection',
    description: 'MCP connection object containing server URL and authentication details',
    schema: MCPConnectionData,
    // required: true,
    // isSchemaMutable: false,
  })
  connection: MCPConnectionData = new MCPConnectionData()

  @Passthrough()
  @PortString({
    title: 'Prompt Name',
    description: 'Name of the prompt to execute',
    defaultValue: '',
    required: true,
  })
  promptName: string = ''

  @Passthrough()
  @PortObject({
    title: 'Arguments',
    description: 'Prompt arguments (schema depends on selected prompt)',
    schema: { properties: {} },
    isSchemaMutable: true,
    required: true,
  })
  arguments: Record<string, string> = {}

  // promptResult:
  @Output()
  @PortObject({
    title: 'Prompt Result',
    description: 'Result of the prompt execution',
    schema: MCPPromptResult,
  })
  promptResult: MCPPromptResult = new MCPPromptResult()

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

      // Validate prompt selection
      if (!this.promptName) {
        throw new Error('Please select a prompt')
      }

      const progressToken = nanoid(16)

      // TODO: Validate arguments against prompt schema if available

      // Execute the prompt
      const result = await client.getPrompt(
        {
          name: this.promptName,
          arguments: this.arguments,
          _meta: {
            progressToken,
          },
        },
        {
          onprogress: (progress: Progress) => {
            const progressMessage: MCPProgressMessage = {
              total: progress.total,
              progress: progress.progress,
              message: progress.message,
            }

            console.log(`[MCPromptGet] Progress: ${JSON.stringify(progressMessage)}`)

            this.progressStream.send(progressMessage)
          },
          signal: context.abortSignal,
          timeout: 30000, // 30 seconds connection timeout
          resetTimeoutOnProgress: true,
          maxTotalTimeout: 900000, // 15 minutes
        },
      ) as GetPromptResult

      // Process the result

      const nodeResult = new MCPPromptResult()
      nodeResult.description = result.description || ''
      nodeResult.messages = result.messages.map((message) => {
        const mcpMessage = new MCPPromptMessage()

        mcpMessage.role = message.role
        mcpMessage.content = convertContentBlockToChaingraphContent(message.content)

        return mcpMessage
      })

      this.promptResult = nodeResult
    } finally {
      // Ensure we close the progress stream after execution
      this.progressStream.close()
    }

    return {}
  }
}
