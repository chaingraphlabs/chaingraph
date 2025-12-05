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

import type { ProgressCallback } from '@modelcontextprotocol/sdk/shared/protocol.js'
import type { Progress } from '@modelcontextprotocol/sdk/types.js'
import type { HeaderPair } from './types'
import {
  Passthrough,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Node,
  PortObject,
} from '@badaitech/chaingraph-types'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { NODE_CATEGORIES } from '../../categories'
import { MCPConnectionData } from './types'
import { hasTemplateVariables, resolveTemplateValue } from './utils'

@Node({
  type: 'MCPConnectionNode',
  title: 'MCP Connection',
  description: 'Establishes and manages connections to MCP servers using SSE transport',
  category: NODE_CATEGORIES.MCP,
  tags: ['mcp', 'connection', 'sse', 'protocol', 'api'],
})
export class MCPConnectionNode extends BaseNode {
  @Passthrough()
  @PortObject({
    title: 'Connection',
    description: 'MCP connection object containing server URL and authentication details',
    schema: MCPConnectionData,
    required: true,
    ui: {
      hideEditor: false,
      hideInternalProperties: false,
    },
  })
  connection: MCPConnectionData = new MCPConnectionData()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate inputs
    if (!this.connection.serverUrl) {
      throw new Error('Server URL is required')
    }

    const client = await MCPConnectionNode.createClient(
      this.connection,
      context,
      (progress: Progress) => {
        console.log('MCP Connection Progress:', progress)
      },
    )

    return {
      client,
    }
  }

  public static async createClient(
    connection: MCPConnectionData,
    context: ExecutionContext,
    onprogress?: ProgressCallback,
    templateValues?: Record<string, string>,
  ): Promise<Client> {
    // Try to parse URL
    let url: URL
    try {
      url = new URL(connection.serverUrl)
    } catch {
      throw new Error('Invalid server URL format')
    }

    // Build authentication headers WITH template resolution
    const headers = await MCPConnectionNode.buildAuthHeaders(
      connection.headers,
      context,
      templateValues,
    )

    let client: Client | undefined
    try {
      client = new Client({
        name: 'streamable-http-client',
        version: '1.0.0',
      })
      const transport = new StreamableHTTPClientTransport(
        url,
        {
          requestInit: {
            headers: {
              ...headers,
            },
          },
        },
      )
      await client.connect(transport, {
        signal: context.abortSignal,
        // 30 seconds connection timeout
        timeout: 30000,
        resetTimeoutOnProgress: true,
        maxTotalTimeout: 900000, // 15 minutes
        onprogress,
      })
    } catch (error) {
      // If that fails with a 4xx error, try the older SSE transport
      client = new Client({
        name: 'sse-client',
        version: '1.0.0',
      })
      const sseTransport = new SSEClientTransport(url)
      await client.connect(sseTransport)
    }

    // const pong = await client.ping()
    // if (!pong) {
    //   throw new Error('Failed to connect to MCP server, ping failed')
    // }

    return client
  }

  private static async buildAuthHeaders(
    headers: HeaderPair[],
    context: ExecutionContext,
    templateValues?: Record<string, string>,
  ): Promise<Record<string, string>> {
    const headersResult: Record<string, string> = {}

    const promises = headers.map(async (header) => {
      if (header.key && header.value) {
        // Resolve template variables if present
        let resolvedValue = header.value
        if (templateValues && hasTemplateVariables(header.value)) {
          resolvedValue = resolveTemplateValue(
            header.value,
            templateValues,
          )
        }

        // const { value: headerValue } = await resolvedValue!.decrypt(context)
        // TODO: implement secret storing
        return { key: header.key, value: resolvedValue }
      }
    })

    const resolvedHeaders = await Promise.all(promises)
    resolvedHeaders.forEach((header) => {
      if (header && header.key && header.value) {
        headersResult[header.key] = header.value
      }
    })

    return headersResult
  }
}
