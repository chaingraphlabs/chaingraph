/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IMCPStore, MCPServer, MCPServerInput } from './types'
import { nanoid } from 'nanoid'

export class InMemoryMCPStore implements IMCPStore {
  private servers: Map<string, MCPServer> = new Map()

  async createServer(userId: string, server: MCPServerInput): Promise<MCPServer> {
    const id = nanoid()
    const now = new Date()

    const newServer: MCPServer = {
      id,
      userId,
      title: server.title,
      url: server.url,
      authHeaders: server.authHeaders,
      createdAt: now,
      updatedAt: now,
    }

    this.servers.set(id, newServer)
    return newServer
  }

  async getServer(id: string, userId: string): Promise<MCPServer | null> {
    const server = this.servers.get(id)
    if (!server || server.userId !== userId) {
      return null
    }
    return server
  }

  async listServers(userId: string): Promise<MCPServer[]> {
    return Array.from(this.servers.values())
      .filter(server => server.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  async updateServer(id: string, userId: string, updates: Partial<MCPServerInput>): Promise<MCPServer> {
    const server = await this.getServer(id, userId)
    if (!server) {
      throw new Error('Server not found or access denied')
    }

    const updatedServer: MCPServer = {
      ...server,
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.url !== undefined && { url: updates.url }),
      ...(updates.authHeaders !== undefined && { authHeaders: updates.authHeaders }),
      updatedAt: new Date(),
    }

    this.servers.set(id, updatedServer)
    return updatedServer
  }

  async deleteServer(id: string, userId: string): Promise<boolean> {
    const server = await this.getServer(id, userId)
    if (!server) {
      return false
    }
    return this.servers.delete(id)
  }

  async hasAccess(serverId: string, userId: string): Promise<boolean> {
    const server = this.servers.get(serverId)
    return server?.userId === userId
  }
}
