/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Granular Port Hooks
 *
 * These hooks provide granular subscriptions to port data,
 * allowing components to subscribe only to the specific concerns they need.
 *
 * Benefits:
 * - Only re-render when specific data changes (value, UI, config, or connections)
 * - Deep equality comparison prevents unnecessary re-renders
 * - Migration-aware: Automatically routes to granular or legacy stores
 */

export { useChildPorts } from './useChildPorts'
export { useNodeDescendantPorts } from './useNodeDescendantPorts'
export { usePort } from './usePort'
export { usePortConfig } from './usePortConfig'
export { usePortConnections } from './usePortConnections'
export { usePortUI } from './usePortUI'
export { usePortType } from './usePortType'
export { usePortValue } from './usePortValue'
