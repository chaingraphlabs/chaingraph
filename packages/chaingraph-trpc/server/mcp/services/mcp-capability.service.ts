/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Prompt, Resource, ResourceTemplate, Tool } from '@modelcontextprotocol/sdk/types.js'
import type { IMCPStore, MCPServer } from '../stores/types'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

export interface ServerCapabilities {
  serverId: string
  tools: Tool[]
  resources: (Resource | ResourceTemplate)[]
  prompts: Prompt[]
  timestamp: number
}

export class MCPCapabilityService {
  private cache = new Map<string, ServerCapabilities>()
  private activeClients = new Map<string, Client>()
  private readonly CACHE_DURATION = 30 * 1000 // 30 seconds

  constructor(private mcpStore: IMCPStore) {}

  async getTool(serverId: string, toolName: string, userId: string): Promise<Tool> {
    const capabilities = await this.getCapabilities(serverId, userId)
    const tool = capabilities.tools.find(t => t.name === toolName)
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found on server '${serverId}'`)
    }
    return tool
  }

  async getResource(serverId: string, resourceName: string, userId: string): Promise<Resource | ResourceTemplate> {
    const capabilities = await this.getCapabilities(serverId, userId)
    const resource = capabilities.resources.find(r => r.name === resourceName)
    if (!resource) {
      throw new Error(`Resource '${resourceName}' not found on server '${serverId}'`)
    }
    return resource
  }

  async getPrompt(serverId: string, promptName: string, userId: string): Promise<Prompt> {
    const capabilities = await this.getCapabilities(serverId, userId)
    const prompt = capabilities.prompts.find(p => p.name === promptName)
    if (!prompt) {
      throw new Error(`Prompt '${promptName}' not found on server '${serverId}'`)
    }
    return prompt
  }

  async getAllCapabilities(serverId: string, userId: string): Promise<ServerCapabilities> {
    return this.getCapabilities(serverId, userId)
  }

  private async getCapabilities(serverId: string, userId: string): Promise<ServerCapabilities> {
    // Check cache first
    const cached = this.cache.get(serverId)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached
    }

    // Get server details
    const server = await this.mcpStore.getServer(serverId, userId)
    if (!server) {
      throw new Error(`Server '${serverId}' not found or access denied`)
    }

    // Get or create client
    const client = await this.getOrCreateClient(server)

    // Fetch capabilities
    const [toolsResult, resourcesResult, resourceTemplatesResult, promptsResult] = await Promise.all([
      client.listTools().catch(() => ({ tools: [] })),
      client.listResources().catch(() => ({ resources: [] })),
      client.listResourceTemplates().catch(() => ({ resourceTemplates: [] })),
      client.listPrompts().catch(() => ({ prompts: [] })),
    ])

    const capabilities: ServerCapabilities = {
      serverId: server.id,
      tools: toolsResult.tools || [],
      resources: [...(resourcesResult.resources || []), ...(resourceTemplatesResult.resourceTemplates || [])],
      prompts: promptsResult.prompts || [],
      timestamp: Date.now(),
    }

    // Update cache
    this.cache.set(serverId, capabilities)

    return capabilities
  }

  private async getOrCreateClient(server: MCPServer): Promise<Client> {
    // Check if we already have an active client
    const existingClient = this.activeClients.get(server.id)
    if (existingClient) {
      return existingClient
    }

    // Create new client
    const client = await this.createMCPClient(server)
    this.activeClients.set(server.id, client)

    return client
  }

  private async createMCPClient(server: MCPServer): Promise<Client> {
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

    console.log(`Connecting to MCP server at ${url.toString()} with headers:`, headers)

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
      console.error('StreamableHTTP transport failed, trying SSE transport:', error)

      try {
        const sseTransport = new SSEClientTransport(url)
        await client.connect(sseTransport)
      } catch (sseError) {
        throw new Error(`Failed to connect to both StreamableHTTP and SSE transports: HTTP Error: ${error instanceof Error ? error.message : error}, SSE Error: ${sseError instanceof Error ? sseError.message : sseError}`)
      }
    }

    // Verify connection with ping
    const pong = await client.ping()
    if (!pong) {
      throw new Error('Failed to connect to MCP server, ping failed')
    }

    return client
  }

  async clearCache(serverId?: string): Promise<void> {
    if (serverId) {
      this.cache.delete(serverId)
    } else {
      this.cache.clear()
    }
  }

  async disconnectAll(): Promise<void> {
    for (const [serverId, client] of this.activeClients.entries()) {
      try {
        await client.close()
      } catch (error) {
        console.error(`Error closing client for server ${serverId}:`, error)
      }
    }
    this.activeClients.clear()
    this.cache.clear()
  }
}
