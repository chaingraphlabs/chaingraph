/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Prompt, Resource, ResourceTemplate, Tool } from '@modelcontextprotocol/sdk/types.js'
import type { MCPServer } from './types'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

/**
 * Creates an MCP client connection for the given server
 */
export async function createMCPClient(server: MCPServer): Promise<Client> {
  // Parse and validate URL
  let url: URL
  try {
    url = new URL(server.url)
  } catch {
    throw new Error('Invalid server URL format')
  }

  // Build authentication headers
  const headers = server.authHeaders.reduce((acc, header) => {
    if (header.key && header.value) {
      acc[header.key] = header.value
    }
    return acc
  }, {} as Record<string, string>)

  const client = new Client({
    name: 'chaingraph-mcp-client',
    title: 'Chaingraph MCP Client',
    version: '1.0.0',
  })

  // Try StreamableHTTP transport first (newer, more reliable)
  try {
    const transport = new StreamableHTTPClientTransport(url, {
      requestInit: {
        headers,
      },
      reconnectionOptions: {
        maxReconnectionDelay: 60000, // 1 minute
        initialReconnectionDelay: 1000, // 1 second
        reconnectionDelayGrowFactor: 2, // Exponential backoff
        maxRetries: 5, // Maximum retries before giving up
      },
    })

    await client.connect(transport, {
      // 30 seconds connection timeout
      timeout: 30000,
      resetTimeoutOnProgress: true,
      maxTotalTimeout: 900000, // 15 minutes
    })
  } catch (error) {
    // If that fails, try the older SSE transport
    console.warn('StreamableHTTP transport failed, trying SSE transport:', error)

    try {
      const sseTransport = new SSEClientTransport(url)
      await client.connect(sseTransport)
    } catch (sseError) {
      console.error('Failed to connect using SSE transport:', sseError)
      throw new Error('Failed to connect to MCP server using both StreamableHTTP and SSE transports')
    }
  }

  // Verify connection with ping
  const pong = await client.ping()
  if (!pong) {
    throw new Error('Failed to connect to MCP server, ping failed')
  }

  return client
}

/**
 * Fetches available tools from the MCP server
 */
export async function fetchMCPTools(client: Client): Promise<Tool[]> {
  try {
    const result = await client.listTools()
    return result.tools
  } catch (error) {
    console.error('Failed to fetch MCP tools:', error)
    return []
  }
}

/**
 * Fetches available resources from the MCP server
 */
export async function fetchMCPResources(client: Client): Promise<(Resource | ResourceTemplate)[]> {
  try {
    const [result, resultTemplates] = await Promise.all([
      client.listResources(),
      client.listResourceTemplates(),
    ])

    console.log(resultTemplates)

    // Combine resources and templates into a single array
    return [...(result.resources || []), ...(resultTemplates.resourceTemplates || [])]
  } catch (error) {
    console.error('Failed to fetch MCP resources:', error)
    return []
  }
}

/**
 * Fetches available prompts from the MCP server
 */
export async function fetchMCPPrompts(client: Client): Promise<Prompt[]> {
  try {
    const result = await client.listPrompts()

    // for (const prompt of result.prompts) {
    //   const argumentsObject: Record<string, string> = {}
    //   prompt.arguments?.forEach((arg) => {
    //     // Ensure each argument has a default value if not provided
    //     argumentsObject[arg.name] = `{{ ${arg.name} }}`
    //   })
    //   const promptData = await client.getPrompt({
    //     name: prompt.name,
    //     arguments: argumentsObject,
    //   })
    //
    //   console.log(promptData)
    //   // promptData.messages
    // }
    return result.prompts
  } catch (error) {
    console.error('Failed to fetch MCP prompts:', error)
    return []
  }
}

/**
 * Disconnects and cleans up an MCP client
 */
export async function disconnectMCPClient(client: Client): Promise<void> {
  try {
    await client.close()
  } catch (error) {
    console.error('Error closing MCP client:', error)
  }
}
