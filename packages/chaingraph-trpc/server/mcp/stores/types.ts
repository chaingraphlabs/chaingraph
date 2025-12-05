/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

export interface MCPServerAuthHeader {
  key: string
  value: string
  isTemplate?: boolean // NEW: if true, value contains {{variables}}
  templateRequired?: boolean // NEW: if true, template variable ports are required
}

export interface MCPServerInput {
  title: string
  url: string
  authHeaders: MCPServerAuthHeader[]
}

export interface MCPServer {
  id: string
  userId: string
  title: string
  url: string
  authHeaders: MCPServerAuthHeader[]
  createdAt: Date
  updatedAt: Date
}

export interface IMCPStore {
  createServer: (userId: string, server: MCPServerInput) => Promise<MCPServer>
  getServer: (id: string, userId: string) => Promise<MCPServer | null>
  listServers: (userId: string) => Promise<MCPServer[]>
  updateServer: (id: string, userId: string, updates: Partial<MCPServerInput>) => Promise<MCPServer>
  deleteServer: (id: string, userId: string) => Promise<boolean>
  hasAccess: (serverId: string, userId: string) => Promise<boolean>
}
