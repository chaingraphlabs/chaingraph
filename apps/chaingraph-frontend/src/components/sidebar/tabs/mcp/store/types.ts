/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import type { Prompt, Resource, ResourceTemplate, Tool } from '@modelcontextprotocol/sdk/types.js'

export enum MCPServerStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

// Overall MCP loading state machine
export type MCPLoadStatus
  = | 'idle' // Initial - no data, nothing happening
    | 'hydrating' // Loading from localStorage (instant)
    | 'ready' // Has data (cached or fresh)
    | 'error' // Something failed critically

export interface MCPState {
  status: MCPLoadStatus
  isSyncing: boolean // Background fetch in progress
  hydratedAt: number | null // When hydrated from cache
  lastSyncAt: number | null // When last fresh fetch completed
  syncError: string | null // Last sync error (non-fatal)
}

// Per-server capability state (Record value type)
export interface ServerCapabilityState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  tools: Tool[]
  resources: (Resource | ResourceTemplate)[]
  prompts: Prompt[]
  loadedAt: number | null
  error: string | null
}

export interface MCPCapabilityLoadingState {
  tools: boolean
  resources: boolean
  prompts: boolean
}

export interface MCPServer {
  id: string
  title: string
  url: string
  authHeaders: Array<{ key: string, value: string, isTemplate?: boolean, templateRequired?: boolean }>
}

export interface MCPServerWithCapabilities extends MCPServer {
  tools?: Tool[]
  resources?: (Resource | ResourceTemplate)[]
  prompts?: Prompt[]
  status?: MCPServerStatus
  error?: string
  loadingState?: MCPCapabilityLoadingState
}

export interface CreateMCPServerEvent {
  title: string
  url: string
  authHeaders: Array<{ key: string, value: string, isTemplate?: boolean, templateRequired?: boolean }>
}

export interface UpdateMCPServerEvent {
  id: string
  title: string
  url: string
  authHeaders: Array<{ key: string, value: string, isTemplate?: boolean, templateRequired?: boolean }>
}

export interface MCPServerNodes {
  tools: INode[]
  resources: INode[]
  prompts: INode[]
}

export interface MCPServerNodesLoadingState {
  isLoading: boolean
  error?: Error | null
}

export interface MCPServerWithNodes extends MCPServerWithCapabilities {
  nodes?: MCPServerNodes
  nodesLoadingState?: MCPServerNodesLoadingState
}
