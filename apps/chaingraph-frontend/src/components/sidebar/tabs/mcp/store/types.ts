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

export interface MCPCapabilityLoadingState {
  tools: boolean
  resources: boolean
  prompts: boolean
}

export interface MCPServer {
  id: string
  title: string
  url: string
  authHeaders: Array<{ key: string, value: string }>
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
  authHeaders: Array<{ key: string, value: string }>
}

export interface UpdateMCPServerEvent {
  id: string
  title: string
  url: string
  authHeaders: Array<{ key: string, value: string }>
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
