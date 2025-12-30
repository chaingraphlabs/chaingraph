/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { createDomain } from 'effector'
import { globalReset } from './common'

/**
 * Domain definitions for the store
 * Each domain represents a major area of functionality
 */

// Flow domain for flow management
export const flowDomain = createDomain('flow')

// ============================================================================
// Flow Initialization Mode (for perf optimization)
// ============================================================================
// Placed here to avoid circular dependencies between flow/stores.ts and ports-v2
// When true, expensive derived computations (like $nodePortLists) should be skipped.
// These computations will run once at flowInitEnded instead of during each event.

export const flowInitStarted = flowDomain.createEvent()
export const flowInitEnded = flowDomain.createEvent()

/**
 * Flow initialization mode flag
 * When true, expensive derived stores should skip computation.
 */
export const $flowInitMode = flowDomain.createStore<boolean>(false)
  .on(flowInitStarted, () => true)
  .on(flowInitEnded, () => false)
  .reset(globalReset)

// Nodes domain for node management
export const nodesDomain = createDomain('nodes')

// Edges domain for edge management
export const edgesDomain = createDomain('edges')

// Execution domain for execution management
export const executionDomain = createDomain('execution')

// Categories domain for node categories management
export const categoriesDomain = createDomain('categories')

// Ports domain for port management
export const portsDomain = createDomain('ports')

// TRPC domain for remote procedure call management
export const trpcDomain = createDomain('trpc')

// ArchAI domain for ArchAI integration management
export const archaiDomain = createDomain('archai')

// Focused editors domain for tracking focused port editors
export const focusedEditorsDomain = createDomain('focused-editors')

// Drag and drop domain for drag and drop state management
export const dragDropDomain = createDomain('drag-drop')

// MCP domain for MCP server management
export const mcpDomain = createDomain('mcp')

// Initialization domain for app initialization state management
export const initializationDomain = createDomain('initialization')

// Wallet domain for wallet integration and state management
export const walletDomain = createDomain('wallet')

// Hotkeys domain for keyboard shortcuts state management
export { hotkeysDomain } from './hotkeys/stores'

// PortsV2 domain for granular port state management
// Import from './ports-v2' (not './ports-v2/domain') to ensure init wiring is loaded
export { portsV2Domain } from './ports-v2'

// XYFlow domain for optimized XYFlow node rendering
// Provides single combined store with all render data per node
// See store/xyflow/domain.ts for detailed documentation
export { xyflowDomain } from './xyflow/domain'

// debug(
//     flowDomain,
//     nodesDomain,
//     edgesDomain,
//     executionDomain,
//     categoriesDomain,
//     portsDomain,
//     trpcDomain,
//     archaiDomain,
//     focusedEditorsDomain,
//     dragDropDomain,
//     mcpDomain,
//     initializationDomain,
//     walletDomain,
// )
