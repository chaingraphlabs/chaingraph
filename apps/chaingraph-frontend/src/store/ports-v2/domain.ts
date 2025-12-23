/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { createDomain } from 'effector'

/**
 * PortsV2 Domain
 *
 * This domain manages the granular port stores that replace nested port storage in $nodes.
 * Benefits:
 * - Granular subscriptions (components subscribe only to specific port concerns)
 * - Efficient echo detection (compare small objects, not entire ports)
 * - Hot path isolation (value updates don't cascade to UI/config systems)
 * - ~95% reduction in render cycles for typing operations
 *
 * @see /docs/architecture/granular-port-stores-design.md
 */
export const portsV2Domain = createDomain('portsV2')

// import { debug } from 'patronum'
// debug(
// portsV2Domain,
// )
