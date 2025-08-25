/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MCPServer as MCPServerTRPC } from '@badaitech/chaingraph-trpc/server'
import type { Prompt, Resource, ResourceTemplate, Tool } from '@modelcontextprotocol/sdk/types.js'
import type {
  CreateMCPServerEvent,
  MCPCapabilityLoadingState,
  MCPServer,
  MCPServerNodes,
  MCPServerNodesLoadingState,
  MCPServerWithCapabilities,
  MCPServerWithNodes,
  UpdateMCPServerEvent,
} from './types'
import { $trpcClient } from '@/store'
import { globalReset } from '@/store/common'
import { mcpDomain } from '@/store/domains'
import { combine, sample } from 'effector'
import { MCPServerStatus } from './types'

// EVENTS

// MCP servers list events
export const loadMCPServers = mcpDomain.createEvent()
export const setMCPServers = mcpDomain.createEvent<MCPServer[]>()
export const setMCPServersLoading = mcpDomain.createEvent<boolean>()
export const setMCPServersError = mcpDomain.createEvent<Error | null>()

// MCP server CRUD events
export const createMCPServer = mcpDomain.createEvent<CreateMCPServerEvent>()
export const updateMCPServer = mcpDomain.createEvent<UpdateMCPServerEvent>()
export const deleteMCPServer = mcpDomain.createEvent<string>()

// MCP connection events
export const setMCPServerStatus = mcpDomain.createEvent<{ id: string, status: MCPServerStatus, error?: string }>()
export const setMCPServerCapabilities = mcpDomain.createEvent<{
  serverId: string
  tools?: Tool[]
  resources?: (Resource | ResourceTemplate)[]
  prompts?: Prompt[]
}>()
export const setMCPCapabilityLoading = mcpDomain.createEvent<{
  id: string
  loading: Partial<MCPCapabilityLoadingState>
}>()

// MCP nodes events
export const loadMCPServerNodes = mcpDomain.createEvent<string>() // server id
export const loadAllMCPServerNodes = mcpDomain.createEvent()
export const setMCPServerNodes = mcpDomain.createEvent<{
  serverId: string
  nodes: MCPServerNodes
}>()
export const setMCPServerNodesLoading = mcpDomain.createEvent<{
  serverId: string
  loading: MCPServerNodesLoadingState
}>()

// STORES (Forward declarations needed for effects)

// Store for all MCP servers list
export const $mcpServers = mcpDomain.createStore<MCPServer[]>([])

// EFFECTS

// Effect for loading MCP servers list
export const loadMCPServersFx = mcpDomain.createEffect(async (): Promise<MCPServer[]> => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.mcp.listServers.query()
})

// Effect for creating new MCP server
export const createMCPServerFx = mcpDomain.createEffect(async (event: CreateMCPServerEvent): Promise<MCPServerTRPC> => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }

  return client.mcp.createServer.mutate({
    title: event.title,
    url: event.url,
    authHeaders: event.authHeaders,
  })
})

// Effect for updating MCP server
export const updateMCPServerFx = mcpDomain.createEffect(async (event: UpdateMCPServerEvent): Promise<MCPServerTRPC> => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }

  return client.mcp.updateServer.mutate({
    id: event.id,
    url: event.url,
    authHeaders: event.authHeaders,
    title: event.title,
  })
})

// Effect for deleting MCP server
export const deleteMCPServerFx = mcpDomain.createEffect(async (id: string) => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.mcp.deleteServer.mutate({ id })
})

export const loadMCPCapabilitiesFx = mcpDomain.createEffect(async ({
  serverId,
}: {
  serverId: string
}) => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return await client.mcp.serverCapabilities.query({ serverId })
})

// Effect for loading server nodes
export const loadMCPServerNodesFx = mcpDomain.createEffect(async (serverId: string) => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }

  const result = await client.mcp.getAllNodesForServer.query({ serverId })
  return {
    serverId,
    nodes: {
      tools: result.tools,
      resources: result.resources,
      prompts: result.prompts,
    } as MCPServerNodes,
  }
})

// STORES - Event handlers

// Store for MCP server statuses
export const $mcpServerStatuses = mcpDomain.createStore<Map<string, MCPServerStatus>>(new Map())
  .on(setMCPServerStatus, (statuses, { id, status }) => {
    const newStatuses = new Map(statuses)
    newStatuses.set(id, status)
    return newStatuses
  })
  .reset(globalReset)

// Store for MCP server errors
export const $mcpServerErrors = mcpDomain.createStore<Map<string, string>>(new Map())
  .on(setMCPServerStatus, (errors, { id, error }) => {
    const newErrors = new Map(errors)
    if (error) {
      newErrors.set(id, error)
    } else {
      newErrors.delete(id)
    }
    return newErrors
  })
  .reset(globalReset)

// Store for MCP capabilities loading states
export const $mcpCapabilityLoadingStates = mcpDomain.createStore<Map<string, MCPCapabilityLoadingState>>(new Map())
  .on(setMCPCapabilityLoading, (states, { id, loading }) => {
    const newStates = new Map(states)
    const currentState = states.get(id) || { tools: false, resources: false, prompts: false }
    newStates.set(id, { ...currentState, ...loading })
    return newStates
  })
  .reset(globalReset)

// Store for MCP server capabilities
export const $mcpServerCapabilities = mcpDomain.createStore<Map<string, {
  tools?: Tool[]
  resources?: (Resource | ResourceTemplate)[]
  prompts?: Prompt[]
}>>(new Map())
  .on(setMCPServerCapabilities, (capabilities, { serverId, tools, resources, prompts }) => {
    const newCapabilities = new Map(capabilities)
    const current = capabilities.get(serverId) || {}
    newCapabilities.set(serverId, {
      ...current,
      ...(tools !== undefined && { tools }),
      ...(resources !== undefined && { resources }),
      ...(prompts !== undefined && { prompts }),
    })
    return newCapabilities
  })
  .reset(globalReset)

// Store for MCP server nodes
export const $mcpServerNodes = mcpDomain.createStore<Map<string, MCPServerNodes>>(new Map())
  .on(setMCPServerNodes, (nodes, { serverId, nodes: serverNodes }) => {
    const newNodes = new Map(nodes)
    newNodes.set(serverId, serverNodes)
    return newNodes
  })
  .on(loadMCPServerNodesFx.doneData, (nodes, { serverId, nodes: serverNodes }) => {
    const newNodes = new Map(nodes)
    newNodes.set(serverId, serverNodes)
    return newNodes
  })
  .reset(globalReset)

// Store for MCP server nodes loading states
export const $mcpServerNodesLoadingStates = mcpDomain.createStore<Map<string, MCPServerNodesLoadingState>>(new Map())
  .on(setMCPServerNodesLoading, (states, { serverId, loading }) => {
    const newStates = new Map(states)
    newStates.set(serverId, loading)
    return newStates
  })
  .on(loadMCPServerNodesFx.pending, (states, isPending) => {
    // When effect starts, we need to get the serverId from the params
    return states
  })
  .on(loadMCPServerNodesFx, (states, serverId) => {
    const newStates = new Map(states)
    newStates.set(serverId, { isLoading: true, error: null })
    return newStates
  })
  .on(loadMCPServerNodesFx.done, (states, { params: serverId }) => {
    const newStates = new Map(states)
    newStates.set(serverId, { isLoading: false, error: null })
    return newStates
  })
  .on(loadMCPServerNodesFx.fail, (states, { params: serverId, error }) => {
    const newStates = new Map(states)
    newStates.set(serverId, { isLoading: false, error })
    return newStates
  })
  .reset(globalReset)

// Add event handlers to $mcpServers
$mcpServers
  .on(setMCPServers, (_, servers) => servers)
  .on(createMCPServerFx.doneData, (servers, newServer) => [...servers, newServer])
  .on(updateMCPServerFx.doneData, (servers, updatedServer) =>
    servers.map(server =>
      server.id === updatedServer.id ? updatedServer : server,
    ))
  .on(deleteMCPServerFx.done, (servers, { params: id }) =>
    servers.filter(server => server.id !== id))
  .reset(globalReset)

// Loading state
export const $isMCPServersLoading = mcpDomain.createStore<boolean>(false)
  .on(setMCPServersLoading, (_, isLoading) => isLoading)
  .on(loadMCPServersFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

// Error state
export const $mcpServersError = mcpDomain.createStore<Error | null>(null)
  .on(setMCPServersError, (_, error) => error)
  .on(loadMCPServersFx.failData, (_, error) => error)
  .reset(loadMCPServersFx.done)
  .reset(globalReset)

// Specific operation error stores
export const $createMCPServerError = mcpDomain.createStore<Error | null>(null)
  .on(createMCPServerFx.failData, (_, error) => error)
  .reset(createMCPServerFx.done)
  .reset(globalReset)

export const $updateMCPServerError = mcpDomain.createStore<Error | null>(null)
  .on(updateMCPServerFx.failData, (_, error) => error)
  .reset(updateMCPServerFx.done)
  .reset(globalReset)

export const $deleteMCPServerError = mcpDomain.createStore<Error | null>(null)
  .on(deleteMCPServerFx.failData, (_, error) => error)
  .reset(deleteMCPServerFx.done)
  .reset(globalReset)

// Specific operation loading states
export const $isCreatingMCPServer = mcpDomain.createStore<boolean>(false)
  .on(createMCPServerFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

export const $isUpdatingMCPServer = mcpDomain.createStore<boolean>(false)
  .on(updateMCPServerFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

export const $isDeletingMCPServer = mcpDomain.createStore<boolean>(false)
  .on(deleteMCPServerFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

// SAMPLES

// Load MCP servers
sample({
  clock: loadMCPServers,
  target: loadMCPServersFx,
})
sample({
  clock: loadMCPServersFx.doneData,
  target: [setMCPServers, loadAllMCPServerNodes],
})

// Create MCP server
sample({
  clock: createMCPServer,
  target: createMCPServerFx,
})

// Update MCP server
sample({
  clock: updateMCPServer,
  target: updateMCPServerFx,
})

// Delete MCP server
sample({
  clock: deleteMCPServer,
  target: deleteMCPServerFx,
})

// Set loading states when loading capabilities
sample({
  clock: loadMCPCapabilitiesFx,
  fn: ({ serverId }) => ({
    id: serverId,
    loading: { tools: true, resources: true, prompts: true },
  }),
  target: setMCPCapabilityLoading,
})

// Set capabilities when loaded
sample({
  clock: loadMCPCapabilitiesFx.doneData,
  fn: ({ serverId, tools, resources, prompts }) => ({
    serverId,
    tools,
    resources,
    prompts,
  }),
  target: setMCPServerCapabilities,
})

// Clear loading states when capabilities loaded
sample({
  clock: loadMCPCapabilitiesFx.done,
  fn: ({ params: { serverId } }) => ({
    id: serverId,
    loading: { tools: false, resources: false, prompts: false },
  }),
  target: setMCPCapabilityLoading,
})

// Load nodes when requested
sample({
  clock: loadMCPServerNodes,
  target: loadMCPServerNodesFx,
})

// Load all server nodes when requested
loadAllMCPServerNodes.watch(() => {
  const servers = $mcpServers.getState()
  servers.forEach(server => loadMCPServerNodes(server.id))
  servers.forEach(server => loadMCPCapabilitiesFx({ serverId: server.id }))
})

// Load nodes when servers are loaded
loadMCPServersFx.doneData.watch((servers) => {
  servers.forEach(server => loadMCPServerNodes(server.id))
})

// Reload nodes when server is created or updated
sample({
  clock: [createMCPServerFx.doneData, updateMCPServerFx.doneData],
  fn: server => server.id,
  target: loadMCPServerNodes,
})

// Combined store for UI
export const $mcpServersWithCapabilities = combine(
  $mcpServers,
  $mcpServerStatuses,
  $mcpServerErrors,
  $mcpServerCapabilities,
  $mcpCapabilityLoadingStates,
  (servers, statuses, errors, capabilities, loadingStates) => {
    return servers.map((server) => {
      const status = statuses.get(server.id) || MCPServerStatus.DISCONNECTED
      const error = errors.get(server.id)
      const caps = capabilities.get(server.id) || {}
      const loadingState = loadingStates.get(server.id)

      return {
        ...server,
        ...caps,
        status,
        error,
        loadingState,
      } as MCPServerWithCapabilities
    })
  },
)

// Combined store for UI with nodes
export const $mcpServersWithNodes = combine(
  $mcpServersWithCapabilities,
  $mcpServerNodes,
  $mcpServerNodesLoadingStates,
  (servers, nodes, loadingStates) => {
    return servers.map((server) => {
      const serverNodes = nodes.get(server.id)
      const nodesLoadingState = loadingStates.get(server.id)

      return {
        ...server,
        nodes: serverNodes,
        nodesLoadingState,
      } as MCPServerWithNodes
    })
  },
)
