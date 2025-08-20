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
import type { Progress, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js'

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
import { parse } from 'uri-template'
import { NODE_CATEGORIES } from '../../categories'
import { MCPConnectionNode } from './mcp-connection.node'
import {
  MCPReadResourceResult,
} from './types'
import {
  TextResourceContent,
} from './types'
import {
  BlobResourceContent,
} from './types'
import {
  MCPProgressMessage,
} from './types'
import { MCPConnectionData } from './types'

@Node({
  type: 'MCPResourceReadNode',
  title: 'MCP Resource Read',
  description: 'Retrieves a resource from the MCP server using a specified URI',
  category: NODE_CATEGORIES.MCP,
  tags: ['mcp', 'prompt'],
})
export class MCPResourceReadNode extends BaseNode {
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
    title: 'URI',
    description: 'URI of the resource to read from the MCP server',
    defaultValue: '',
    required: true,
  })
  uri: string = ''

  @Passthrough()
  @PortObject({
    title: 'Arguments',
    description: 'Optional arguments for the resource read operation. Passed as key-value pairs.',
    schema: { properties: {} },
    isSchemaMutable: true,
    required: true,
  })
  arguments: Record<string, string> = {}

  // promptResult:
  @Output()
  @PortObject({
    title: 'Resource Result',
    description: 'Result of the resource read operation',
    schema: MCPReadResourceResult,
  })
  resourceResult: MCPReadResourceResult = new MCPReadResourceResult()

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
      if (!this.uri) {
        throw new Error('Please provide a valid URI to read the resource')
      }

      const progressToken = nanoid(16)

      // TODO: Validate arguments against prompt schema if available

      let uri = this.uri

      if (Object.keys(this.arguments).length > 0) {
        const parsedTemplate = parse(uri)
        uri = parsedTemplate.expand(this.arguments)
      }

      // Execute the prompt
      const result = await client.readResource(
        {
          uri,
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

            this.progressStream.send(progressMessage)
          },
          signal: context.abortSignal,
          timeout: 30000, // 30 seconds connection timeout
          resetTimeoutOnProgress: true,
          maxTotalTimeout: 900000, // 15 minutes
        },
      ) as ReadResourceResult

      // Process the result

      const resourceResult = new MCPReadResourceResult()

      resourceResult.contents = result.contents.map((content) => {
        let contentResult: TextResourceContent | BlobResourceContent

        if ('blob' in content && content.blob) {
          contentResult = new BlobResourceContent()
          contentResult.blob = content.blob.toString() || ''
        } else if ('text' in content && content.text) {
          contentResult = new TextResourceContent()
          contentResult.text = content.text.toString() || ''
        } else {
          contentResult = new TextResourceContent()
          contentResult.text = JSON.stringify(content) || ''
        }

        contentResult.uri = content.uri || ''
        contentResult.mimeType = content.mimeType || ''
        contentResult._meta = content._meta || undefined

        return contentResult
      })
      resourceResult._meta = result._meta || undefined

      this.resourceResult = resourceResult
    } finally {
      // Ensure we close the progress stream after execution
      this.progressStream.close()
    }

    return {}
  }
}
