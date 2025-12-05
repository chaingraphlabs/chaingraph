/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MCPServerWithCapabilities, MCPServerWithNodes } from '../store/types'

const STORAGE_KEY_SERVERS = 'chaingraph:mcp-servers'
const STORAGE_KEY_EXPANDED = 'chaingraph:mcp-expanded-state'
const STORAGE_KEY_EXPANDED_LEGACY = 'chaingraph:mcp-expanded-servers'

export interface CachedMCPData {
  servers: MCPServerWithCapabilities[]
  timestamp: number
}

/**
 * Combined expanded state for both accordion layers
 * Layer 1: servers - which server accordions are expanded
 * Layer 2: capabilities - which Tools/Resources/Prompts sections are expanded per server
 */
export interface ExpandedState {
  servers: string[]
  capabilities: Record<string, string[]>
}

/**
 * Prepare servers for serialization by excluding non-serializable properties (nodes)
 * Nodes have circular references and should be re-fetched from the backend
 */
function serializeForCache(servers: MCPServerWithNodes[]): MCPServerWithCapabilities[] {
  return servers.map(({ nodes, nodesLoadingState, ...rest }) => rest)
}

/**
 * Save MCP servers to localStorage
 * Note: nodes are excluded from cache as they contain circular references
 * and will be re-fetched from the backend on load
 */
export function saveMCPServers(servers: MCPServerWithNodes[]): void {
  try {
    const data: CachedMCPData = {
      servers: serializeForCache(servers),
      timestamp: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY_SERVERS, JSON.stringify(data))
  } catch (error) {
    console.error('[MCP] Failed to save servers to localStorage:', error)
  }
}

/**
 * Load cached MCP servers from localStorage
 */
export function loadCachedMCPServers(): MCPServerWithCapabilities[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SERVERS)
    if (stored) {
      const data = JSON.parse(stored) as CachedMCPData
      return data.servers
    }
  } catch (error) {
    console.error('[MCP] Failed to load cached servers:', error)
  }
  return []
}

/**
 * Save expanded state (both server and capability section layers)
 */
export function saveExpandedState(state: ExpandedState): void {
  try {
    localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify(state))
  } catch (error) {
    console.error('[MCP] Failed to save expanded state:', error)
  }
}

/**
 * Load expanded state with migration support for legacy format
 * Legacy format: string[] (just server IDs)
 * New format: { servers: string[], capabilities: Record<string, string[]> }
 */
export function loadExpandedState(): ExpandedState {
  try {
    // Try new format first
    const stored = localStorage.getItem(STORAGE_KEY_EXPANDED)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Check if it's the new format (has servers and capabilities properties)
      if (parsed && typeof parsed === 'object' && 'servers' in parsed) {
        return parsed as ExpandedState
      }
    }

    // Try legacy format (just server IDs array)
    const legacyStored = localStorage.getItem(STORAGE_KEY_EXPANDED_LEGACY)
    if (legacyStored) {
      const legacyData = JSON.parse(legacyStored)
      if (Array.isArray(legacyData)) {
        // Migrate: treat old data as just server IDs, no capability sections
        const migrated: ExpandedState = {
          servers: legacyData,
          capabilities: {},
        }
        // Save in new format and clean up legacy key
        saveExpandedState(migrated)
        localStorage.removeItem(STORAGE_KEY_EXPANDED_LEGACY)
        return migrated
      }
    }
  } catch (error) {
    console.error('[MCP] Failed to load expanded state:', error)
  }
  return { servers: [], capabilities: {} }
}

/**
 * @deprecated Use saveExpandedState instead
 * Kept for backwards compatibility during migration
 */
export function saveExpandedServers(serverIds: string[]): void {
  const current = loadExpandedState()
  saveExpandedState({ ...current, servers: serverIds })
}

/**
 * @deprecated Use loadExpandedState instead
 * Kept for backwards compatibility during migration
 */
export function loadExpandedServers(): string[] {
  return loadExpandedState().servers
}

/**
 * Clear all MCP localStorage data
 */
export function clearMCPCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SERVERS)
    localStorage.removeItem(STORAGE_KEY_EXPANDED)
    localStorage.removeItem(STORAGE_KEY_EXPANDED_LEGACY)
  } catch (error) {
    console.error('[MCP] Failed to clear cache:', error)
  }
}
