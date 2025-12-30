/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Active flow ID store - extracted to avoid circular dependencies
 * between edges/anchors.ts and flow/stores.ts
 */

import { flowDomain } from '@/store/domains'
import { globalReset } from '../common'

// Events
export const setActiveFlowId = flowDomain.createEvent<string>()
export const clearActiveFlow = flowDomain.createEvent()

// Store - Currently active flow ID
export const $activeFlowId = flowDomain.createStore<string | null>(null)
  .on(setActiveFlowId, (_, id) => id)
  .reset(clearActiveFlow)
  .reset(globalReset)
