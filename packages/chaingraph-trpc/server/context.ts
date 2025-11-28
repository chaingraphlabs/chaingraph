/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeCatalog, NodeRegistry } from '@badaitech/chaingraph-types'
import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone'
import type { drizzle } from 'drizzle-orm/node-postgres'
import type { AuthSession, User } from './auth/types'
import type { IMCPStore } from './mcp/stores/types'
import type { IFlowStore } from './stores/flowStore/types'
import type { UserStore } from './stores/userStore'
import { AuthService } from './auth/service'

export interface Session {
  user?: User
  session?: AuthSession
  isAuthenticated: boolean
}

export type DBType = ReturnType<typeof drizzle>

export interface AppContext {
  session: Session
  db: DBType
  flowStore: IFlowStore
  nodeRegistry: NodeRegistry
  nodesCatalog: NodeCatalog
  mcpStore: IMCPStore
  userStore: UserStore
}

let db: DBType | null = null
let flowStore: IFlowStore | null = null
let nodeRegistry: NodeRegistry | null = null
let nodesCatalog: NodeCatalog | null = null
let mcpStore: IMCPStore | null = null
let userStore: UserStore | null = null
let authService: AuthService | null = null

/**
 * Initialize application context with stores
 * Should be called once when application starts
 */
export function initializeContext(
  _db: DBType,
  _flowStore: IFlowStore,
  _nodeRegistry: NodeRegistry,
  _nodesCatalog: NodeCatalog,
  _mcpStore: IMCPStore,
  _userStore: UserStore,
) {
  db = _db
  flowStore = _flowStore
  nodeRegistry = _nodeRegistry
  nodesCatalog = _nodesCatalog
  mcpStore = _mcpStore
  userStore = _userStore
  authService = new AuthService(_userStore)
}

/**
 * Creates context for tRPC procedures
 * Reuses initialized stores instead of creating new ones
 */
export async function createContext(opts: CreateHTTPContextOptions): Promise<AppContext> {
  if (
    !db
    || !flowStore
    || !nodeRegistry
    || !nodesCatalog
    || !mcpStore
    || !userStore
    || !authService
  ) {
    throw new Error('Context not initialized. Call initializeContext first.')
  }

  // Get token from request headers or websocket
  const token = getAuthToken(opts)

  // Validate session (auto-creates users in database on first login)
  const session = await authService.validateSession(token)
  const user = await authService.getUserFromSession(session)

  return {
    session: {
      user: user ?? undefined,
      session: session ?? undefined,
      isAuthenticated: !!user && !!session,
    },
    db,
    flowStore,
    nodeRegistry,
    nodesCatalog,
    mcpStore,
    userStore,
  }
}

// Extract token from HTTP headers or WebSocket
export function getAuthToken(opts: CreateHTTPContextOptions): string | undefined {
  // try to get from connection params
  if (opts.info.connectionParams?.sessionBadAI && opts.info.connectionParams?.sessionBadAI.length > 0) {
    return opts.info.connectionParams.sessionBadAI
  }

  // Try to get from Authorization header
  if (opts.req.headers.authorization) {
    const [scheme, token] = opts.req.headers.authorization.split(' ')
    if (scheme?.toLowerCase() === 'bearer' && token) {
      return token
    }
  }

  // Try to get from cookie
  const cookies = opts.req.headers.cookie
  if (cookies) {
    const match = cookies.match(/session=([^;]+)/)
    if (match && match[1]) {
      return match[1]
    }
  }

  return undefined
}

export type Context = Awaited<ReturnType<typeof createContext>>
