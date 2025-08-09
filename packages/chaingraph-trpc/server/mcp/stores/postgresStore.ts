/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { DBType } from '../../context'
import type { IMCPStore, MCPServer, MCPServerInput } from './types'
import { and, desc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { mcpServersTable } from '../../stores/postgres/schema'

export class PostgresMCPStore implements IMCPStore {
  constructor(private db: DBType) {}

  async createServer(userId: string, server: MCPServerInput): Promise<MCPServer> {
    const id = nanoid()
    const now = new Date()

    const [newServer] = await this.db
      .insert(mcpServersTable)
      .values({
        id,
        userId,
        title: server.title,
        url: server.url,
        authHeaders: server.authHeaders,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return newServer
  }

  async getServer(id: string, userId: string): Promise<MCPServer | null> {
    const result = await this.db
      .select()
      .from(mcpServersTable)
      .where(and(eq(mcpServersTable.id, id), eq(mcpServersTable.userId, userId)))
      .limit(1)

    return result[0] || null
  }

  async listServers(userId: string): Promise<MCPServer[]> {
    return await this.db
      .select()
      .from(mcpServersTable)
      .where(eq(mcpServersTable.userId, userId))
      .orderBy(desc(mcpServersTable.updatedAt))
  }

  async updateServer(id: string, userId: string, updates: Partial<MCPServerInput>): Promise<MCPServer> {
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (updates.title !== undefined) {
      updateData.title = updates.title
    }
    if (updates.url !== undefined) {
      updateData.url = updates.url
    }
    if (updates.authHeaders !== undefined) {
      updateData.authHeaders = updates.authHeaders
    }

    const [updatedServer] = await this.db
      .update(mcpServersTable)
      .set(updateData)
      .where(and(eq(mcpServersTable.id, id), eq(mcpServersTable.userId, userId)))
      .returning()

    if (!updatedServer) {
      throw new Error('Server not found or access denied')
    }

    return updatedServer
  }

  async deleteServer(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(mcpServersTable)
      .where(and(eq(mcpServersTable.id, id), eq(mcpServersTable.userId, userId)))
      .returning({ id: mcpServersTable.id })

    return result.length > 0
  }

  async hasAccess(serverId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .select({ id: mcpServersTable.id })
      .from(mcpServersTable)
      .where(and(eq(mcpServersTable.id, serverId), eq(mcpServersTable.userId, userId)))
      .limit(1)

    return result.length > 0
  }
}
