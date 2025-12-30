/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Initialization module for ports-v2
 *
 * Importing this file registers all the wiring between events and stores.
 * This ensures that:
 * - Echo detection filters incoming events
 * - Initial flow loads populate granular stores
 * - Node removals clean up port data
 * - Dynamic port creation/removal is tracked
 *
 * This file should be imported once in the main store initialization.
 */

// CRITICAL: Import modules first to force them to load (executes sample() calls)
// Re-exports alone are not enough - with sideEffects:false, bundler will tree-shake them
import './cleanup'
import './dynamic-ports'
import './echo-detection'
import './initialization'

// Then re-export markers to prevent tree-shaking of this module
export { CLEANUP_WIRING } from './cleanup'
export { DYNAMIC_PORTS_WIRING } from './dynamic-ports'
export { ECHO_DETECTION_WIRING } from './echo-detection'
export { INITIALIZATION_WIRING } from './initialization'

/**
 * Combined marker - true only if all wiring modules are loaded
 */
export const PORTS_V2_WIRING_INITIALIZED = true

// DEBUG: Log when this module is loaded
console.log('[ports-v2/init] Wiring modules loaded')
