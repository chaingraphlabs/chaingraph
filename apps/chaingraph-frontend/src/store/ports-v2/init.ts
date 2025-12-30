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

// Import wiring modules to register their sample() calls
import './echo-detection'
import './initialization'
import './cleanup'
import './dynamic-ports'
