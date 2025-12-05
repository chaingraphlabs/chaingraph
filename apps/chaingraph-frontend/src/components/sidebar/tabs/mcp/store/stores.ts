/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MCPServer as MCPServerTRPC } from '@badaitech/chaingraph-trpc/server'
import type {
  CreateMCPServerEvent,
  MCPServer,
  MCPServerNodes,
  MCPServerWithNodes,
  MCPState,
  ServerCapabilityState,
  UpdateMCPServerEvent,
} from './types'
import { attach, combine, sample } from 'effector'
import { debounce } from 'patronum'

import type { ExpandedState } from '../utils'
import { loadCachedMCPServers, loadExpandedState, saveExpandedState, saveMCPServers } from '../utils'

import { $trpcClient } from '@/store'
import { globalReset } from '@/store/common'
import { mcpDomain } from '@/store/domains'

import { MCPServerStatus } from './types'

// =============================================================================
// PRIMARY STORES (Single Source of Truth)
// =============================================================================

/**
 * Overall MCP tab state machine
 * Controls initialization, hydration, and sync status
 */
export const $mcpState = mcpDomain.createStore<MCPState>({
  status: 'idle',
  isSyncing: false,
  hydratedAt: null,
  lastSyncAt: null,
  syncError: null,
})

/**
 * Base server list (without capabilities)
 */
export const $mcpServers = mcpDomain.createStore<MCPServer[]>([])

/**
 * Per-server capability state (Record, not Map!)
 * Using Record ensures Effector detects changes via object spread
 */
export const $serverCapabilities = mcpDomain.createStore<Record<string, ServerCapabilityState>>({})

/**
 * Per-server node definitions
 */
export const $serverNodes = mcpDomain.createStore<Record<string, MCPServerNodes>>({})

/**
 * Per-server nodes loading state
 */
export const $serverNodesLoading = mcpDomain.createStore<Record<string, { isLoading: boolean, error: Error | null }>>({})

/**
 * Expanded server IDs (accordion state - Layer 1)
 */
export const $expandedServerIds = mcpDomain.createStore<string[]>([])

/**
 * Per-server expanded capability sections (accordion state - Layer 2)
 * Record<serverId, sectionIds[]> where sectionIds = 'tools' | 'resources' | 'prompts'
 */
export const $expandedCapabilitySections = mcpDomain.createStore<Record<string, string[]>>({})

// =============================================================================
// DERIVED STORES (Computed from State)
// =============================================================================

export const $isMCPReady = $mcpState.map(s => s.status === 'ready')
export const $isMCPSyncing = $mcpState.map(s => s.isSyncing)
export const $mcpSyncError = $mcpState.map(s => s.syncError)

/**
 * Combined store for UI - merges servers with their capabilities and nodes
 * Sorted by title for deterministic order
 */
export const $mcpServersWithCapabilities = combine(
  $mcpServers,
  $serverCapabilities,
  $serverNodes,
  $serverNodesLoading,
  (servers, caps, nodes, nodesLoading): MCPServerWithNodes[] => {
    // Sort servers by title for deterministic order
    const sortedServers = [...servers].sort((a, b) => a.title.localeCompare(b.title))

    return sortedServers.map((s) => {
      // Sort tools, resources, and prompts by name for deterministic order
      const tools = [...(caps[s.id]?.tools ?? [])].sort((a, b) => a.name.localeCompare(b.name))
      const resources = [...(caps[s.id]?.resources ?? [])].sort((a, b) => {
        const aName = a.name || ('uri' in a ? a.uri : a.uriTemplate) || ''
        const bName = b.name || ('uri' in b ? b.uri : b.uriTemplate) || ''
        return String(aName).localeCompare(String(bName))
      })
      const prompts = [...(caps[s.id]?.prompts ?? [])].sort((a, b) => a.name.localeCompare(b.name))

      return {
        ...s,
        tools,
        resources,
        prompts,
        status: caps[s.id]?.status === 'ready'
          ? MCPServerStatus.CONNECTED
          : caps[s.id]?.status === 'loading'
            ? MCPServerStatus.CONNECTING
            : caps[s.id]?.status === 'error'
              ? MCPServerStatus.ERROR
              : MCPServerStatus.DISCONNECTED,
        error: caps[s.id]?.error ?? undefined,
        nodes: nodes[s.id],
        nodesLoadingState: nodesLoading[s.id],
      }
    })
  },
)

/**
 * Derived: true when all servers have finished loading (ready or error)
 */
export const $allCapabilitiesReady = combine(
  $mcpServers,
  $serverCapabilities,
  (servers, caps) =>
    servers.length === 0 || servers.every(s =>
      caps[s.id]?.status === 'ready' || caps[s.id]?.status === 'error',
    ),
)

// Legacy compatibility exports
export const $mcpServersWithNodes = $mcpServersWithCapabilities

// =============================================================================
// PUBLIC EVENTS (UI triggers these)
// =============================================================================

/** Initialize MCP tab - triggers hydration → sync flow */
export const initializeMCPTab = mcpDomain.createEvent()

/** Update expanded server IDs (accordion state - Layer 1) */
export const setExpandedServers = mcpDomain.createEvent<string[]>()

/** Update expanded capability sections for a server (accordion state - Layer 2) */
export const setExpandedCapabilitySections = mcpDomain.createEvent<{
  serverId: string
  sections: string[]
}>()

/** Manual refresh - re-fetch all data */
export const refreshMCPServers = mcpDomain.createEvent()

/** CRUD events */
export const createMCPServer = mcpDomain.createEvent<CreateMCPServerEvent>()
export const updateMCPServer = mcpDomain.createEvent<UpdateMCPServerEvent>()
export const deleteMCPServer = mcpDomain.createEvent<string>()

// =============================================================================
// INTERNAL EVENTS
// =============================================================================

const updateMCPState = mcpDomain.createEvent<Partial<MCPState>>()

// =============================================================================
// EFFECTS (Async Operations)
// =============================================================================

/**
 * Hydrate from localStorage (instant UI)
 * Loads both server data and expanded state (both layers)
 */
const hydrateMCPFromCacheFx = mcpDomain.createEffect(() => {
  const servers = loadCachedMCPServers()
  const expandedState = loadExpandedState()
  return {
    servers,
    expandedServers: expandedState.servers,
    expandedCapabilities: expandedState.capabilities,
  }
})

/**
 * Load fresh server list from backend
 * Uses attach() to inject $trpcClient - NO .getState()!
 */
const loadMCPServersFx = attach({
  source: $trpcClient,
  effect: async (client, _: void) => {
    if (!client) throw new Error('TRPC client not ready')
    return client.mcp.listServers.query()
  },
})

/**
 * Load capabilities for a single server
 */
const loadServerCapabilitiesFx = attach({
  source: $trpcClient,
  effect: async (client, serverId: string) => {
    if (!client) throw new Error('TRPC client not ready')
    const { tools, resources, prompts } = await client.mcp.serverCapabilities.query({ serverId })
    return { serverId, tools, resources, prompts }
  },
})

/**
 * Load nodes for a single server
 */
const loadServerNodesFx = attach({
  source: $trpcClient,
  effect: async (client, serverId: string) => {
    if (!client) throw new Error('TRPC client not ready')
    const result = await client.mcp.getAllNodesForServer.query({ serverId })
    return { serverId, nodes: result }
  },
})

/**
 * CRUD: Create server
 */
export const createMCPServerFx = attach({
  source: $trpcClient,
  effect: async (client, event: CreateMCPServerEvent): Promise<MCPServerTRPC> => {
    if (!client) throw new Error('TRPC client not ready')
    return client.mcp.createServer.mutate({
      title: event.title,
      url: event.url,
      authHeaders: event.authHeaders,
    })
  },
})

/**
 * CRUD: Update server
 */
export const updateMCPServerFx = attach({
  source: $trpcClient,
  effect: async (client, event: UpdateMCPServerEvent): Promise<MCPServerTRPC> => {
    if (!client) throw new Error('TRPC client not ready')
    return client.mcp.updateServer.mutate({
      id: event.id,
      url: event.url,
      authHeaders: event.authHeaders,
      title: event.title,
    })
  },
})

/**
 * CRUD: Delete server
 */
export const deleteMCPServerFx = attach({
  source: $trpcClient,
  effect: async (client, id: string) => {
    if (!client) throw new Error('TRPC client not ready')
    await client.mcp.deleteServer.mutate({ id })
    return { id }
  },
})

/**
 * Save servers to localStorage (debounced)
 */
const saveServersFx = mcpDomain.createEffect((servers: MCPServerWithNodes[]) => {
  saveMCPServers(servers)
})

/**
 * Save expanded state (both layers) to localStorage
 */
const saveExpandedStateFx = mcpDomain.createEffect((state: ExpandedState) => {
  saveExpandedState(state)
})

// =============================================================================
// STATE TRANSITIONS (all via .on() handlers)
// =============================================================================

// --- Overall state ---
$mcpState
  .on(hydrateMCPFromCacheFx, s => ({ ...s, status: 'hydrating' as const }))
  .on(hydrateMCPFromCacheFx.done, s => ({
    ...s,
    status: 'ready' as const,
    isSyncing: true,
    hydratedAt: Date.now(),
  }))
  .on(hydrateMCPFromCacheFx.fail, s => ({
    ...s,
    status: 'ready' as const, // Continue with empty state
    isSyncing: true,
  }))
  .on(loadMCPServersFx.fail, (s, { error }) => ({
    ...s,
    isSyncing: false,
    syncError: error.message,
  }))
  .on(updateMCPState, (s, updates) => ({ ...s, ...updates }))
  .reset(globalReset)

// --- Servers ---
$mcpServers
  .on(hydrateMCPFromCacheFx.doneData, (_, { servers }) =>
    servers.map(s => ({
      id: s.id,
      title: s.title,
      url: s.url,
      authHeaders: s.authHeaders,
    })),
  )
  .on(loadMCPServersFx.doneData, (_, servers) => servers)
  .on(createMCPServerFx.doneData, (servers, newServer) => [...servers, newServer])
  .on(updateMCPServerFx.doneData, (servers, updated) =>
    servers.map(s => s.id === updated.id ? updated : s),
  )
  .on(deleteMCPServerFx.doneData, (servers, { id }) =>
    servers.filter(s => s.id !== id),
  )
  .reset(globalReset)

// --- Capabilities (Record, not Map!) ---
$serverCapabilities
  .on(hydrateMCPFromCacheFx.doneData, (_, { servers }) => {
    const caps: Record<string, ServerCapabilityState> = {}
    servers.forEach((s) => {
      if (s.tools?.length || s.resources?.length || s.prompts?.length) {
        caps[s.id] = {
          status: 'ready',
          tools: s.tools ?? [],
          resources: s.resources ?? [],
          prompts: s.prompts ?? [],
          loadedAt: Date.now(),
          error: null,
        }
      }
    })
    return caps
  })
  .on(loadServerCapabilitiesFx, (caps, serverId) => ({
    ...caps,
    [serverId]: {
      ...caps[serverId],
      status: 'loading' as const,
      tools: caps[serverId]?.tools ?? [],
      resources: caps[serverId]?.resources ?? [],
      prompts: caps[serverId]?.prompts ?? [],
      loadedAt: caps[serverId]?.loadedAt ?? null,
      error: null,
    },
  }))
  .on(loadServerCapabilitiesFx.doneData, (caps, { serverId, tools, resources, prompts }) => ({
    ...caps,
    [serverId]: {
      status: 'ready' as const,
      tools: tools ?? [],
      resources: resources ?? [],
      prompts: prompts ?? [],
      loadedAt: Date.now(),
      error: null,
    },
  }))
  .on(loadServerCapabilitiesFx.fail, (caps, { params: serverId, error }) => ({
    ...caps,
    [serverId]: {
      ...caps[serverId],
      status: 'error' as const,
      tools: caps[serverId]?.tools ?? [],
      resources: caps[serverId]?.resources ?? [],
      prompts: caps[serverId]?.prompts ?? [],
      loadedAt: Date.now(),
      error: error.message,
    },
  }))
  .on(deleteMCPServerFx.doneData, (caps, { id }) => {
    const { [id]: _, ...rest } = caps
    return rest
  })
  .reset(globalReset)

// --- Nodes ---
$serverNodes
  .on(loadServerNodesFx.doneData, (nodes, { serverId, nodes: serverNodes }) => ({
    ...nodes,
    [serverId]: serverNodes,
  }))
  .on(deleteMCPServerFx.doneData, (nodes, { id }) => {
    const { [id]: _, ...rest } = nodes
    return rest
  })
  .reset(globalReset)

// --- Nodes Loading State ---
$serverNodesLoading
  .on(loadServerNodesFx, (state, serverId) => ({
    ...state,
    [serverId]: { isLoading: true, error: null },
  }))
  .on(loadServerNodesFx.doneData, (state, { serverId }) => ({
    ...state,
    [serverId]: { isLoading: false, error: null },
  }))
  .on(loadServerNodesFx.fail, (state, { params: serverId, error }) => ({
    ...state,
    [serverId]: { isLoading: false, error },
  }))
  .on(deleteMCPServerFx.doneData, (state, { id }) => {
    const { [id]: _, ...rest } = state
    return rest
  })
  .reset(globalReset)

// --- Expanded IDs (Layer 1) ---
$expandedServerIds
  .on(hydrateMCPFromCacheFx.doneData, (_, { expandedServers }) => expandedServers)
  .on(setExpandedServers, (_, ids) => ids)
  .reset(globalReset)

// --- Expanded Capability Sections (Layer 2) ---
$expandedCapabilitySections
  .on(hydrateMCPFromCacheFx.doneData, (_, { expandedCapabilities }) => expandedCapabilities ?? {})
  .on(setExpandedCapabilitySections, (state, { serverId, sections }) => ({
    ...state,
    [serverId]: sections,
  }))
  .on(deleteMCPServerFx.doneData, (state, { id }) => {
    const { [id]: _, ...rest } = state
    return rest
  })
  .reset(globalReset)

// =============================================================================
// SAMPLE CHAINS (Declarative Flow Control)
// =============================================================================

// === INITIALIZATION ===

// 1. Start hydration when tab opens (guard: only if idle)
sample({
  source: $mcpState,
  clock: initializeMCPTab,
  filter: state => state.status === 'idle',
  target: hydrateMCPFromCacheFx,
})

// 2. Start sync after hydration completes (success or fail)
sample({
  clock: [hydrateMCPFromCacheFx.done, hydrateMCPFromCacheFx.fail],
  target: loadMCPServersFx,
})

// === SYNC FLOW ===

// 3. Load capabilities and nodes for all servers after fresh list loads
// Using a simple effect to trigger both capabilities and nodes loading for each server
const loadAllServerDataFx = mcpDomain.createEffect(async (servers: MCPServer[]) => {
  // Trigger capability and node loading for each server in parallel
  servers.forEach((s) => {
    loadServerCapabilitiesFx(s.id)
    loadServerNodesFx(s.id)
  })
})

sample({
  clock: loadMCPServersFx.doneData,
  target: loadAllServerDataFx,
})

// 4. Mark sync complete when all capabilities loaded
sample({
  source: $mcpState,
  clock: $allCapabilitiesReady,
  filter: (state, allReady) => allReady && state.isSyncing,
  fn: () => ({ isSyncing: false, lastSyncAt: Date.now(), syncError: null }),
  target: updateMCPState,
})

// === CRUD TRIGGERS ===

// 5. Connect CRUD events to effects
sample({
  clock: createMCPServer,
  target: createMCPServerFx,
})

sample({
  clock: updateMCPServer,
  target: updateMCPServerFx,
})

sample({
  clock: deleteMCPServer,
  target: deleteMCPServerFx,
})

// 6. Load caps/nodes when server created or updated
sample({
  clock: [createMCPServerFx.doneData, updateMCPServerFx.doneData],
  fn: server => server.id,
  target: [loadServerCapabilitiesFx, loadServerNodesFx],
})

// === PERSISTENCE ===

// 7. Save servers to localStorage when sync completes (debounced 300ms)
const triggerSaveServers = mcpDomain.createEvent<MCPServerWithNodes[]>()

const debouncedSaveServersTrigger = debounce({
  source: triggerSaveServers,
  timeout: 300,
})

sample({
  clock: debouncedSaveServersTrigger,
  target: saveServersFx,
})

// Trigger server save when all capabilities are ready
sample({
  source: $mcpServersWithCapabilities,
  clock: $allCapabilitiesReady,
  filter: (_source, allReady) => allReady,
  target: triggerSaveServers,
})

// 8. Save expanded state (both layers) on any accordion change (debounced 100ms)
const triggerSaveExpandedState = mcpDomain.createEvent<ExpandedState>()

const debouncedSaveExpandedTrigger = debounce({
  source: triggerSaveExpandedState,
  timeout: 100,
})

sample({
  clock: debouncedSaveExpandedTrigger,
  target: saveExpandedStateFx,
})

// Trigger expanded state save on either layer change
sample({
  source: combine({
    servers: $expandedServerIds,
    capabilities: $expandedCapabilitySections,
  }),
  clock: [setExpandedServers, setExpandedCapabilitySections],
  target: triggerSaveExpandedState,
})

// === MANUAL REFRESH ===

// 9. Refresh trigger - set syncing and reload
sample({
  clock: refreshMCPServers,
  fn: () => ({ isSyncing: true, syncError: null }),
  target: updateMCPState,
})

sample({
  clock: refreshMCPServers,
  target: loadMCPServersFx,
})

// =============================================================================
// LEGACY COMPATIBILITY EXPORTS
// =============================================================================

// These exports maintain backwards compatibility with existing code
export const loadMCPServers = refreshMCPServers
export const hydrateMCPServersFromCache = initializeMCPTab

// Error stores for CRUD operations
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

// Loading state stores for CRUD operations
export const $isCreatingMCPServer = mcpDomain.createStore<boolean>(false)
  .on(createMCPServerFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

export const $isUpdatingMCPServer = mcpDomain.createStore<boolean>(false)
  .on(updateMCPServerFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

export const $isDeletingMCPServer = mcpDomain.createStore<boolean>(false)
  .on(deleteMCPServerFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

// Legacy loading state (for backwards compat)
export const $isMCPServersLoading = $isMCPSyncing
export const $mcpServersError = $mcpSyncError.map(e => e ? new Error(e) : null)
