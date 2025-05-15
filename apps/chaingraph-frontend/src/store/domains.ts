/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { createDomain } from 'effector'

/**
 * Domain definitions for the store
 * Each domain represents a major area of functionality
 */

// Flow domain for flow management
export const flowDomain = createDomain('flow')

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
