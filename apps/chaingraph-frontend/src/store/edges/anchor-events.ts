/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/*
 * Anchor Events - Leaf module for cross-store communication
 *
 * This file exists to break circular dependencies between:
 * - nodes/stores.ts (fires groupNodeDeleted)
 * - edges/anchors.ts (handles groupNodeDeleted)
 * - nodes/derived-stores.ts (used by anchors.ts, imports from stores.ts)
 *
 * By isolating events in a dependency-free module, we break the cycle.
 */

import { edgesDomain } from '@/store/domains'

/**
 * Event: Group node was deleted, anchors need to convert to absolute coordinates
 * Fired by: nodes/stores.ts when a group node is removed
 * Handled by: edges/anchors.ts to update affected anchor parents
 */
export const groupNodeDeleted = edgesDomain.createEvent<string>()
