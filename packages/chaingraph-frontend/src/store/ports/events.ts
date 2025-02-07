/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort } from '@badaitech/chaingraph-types/port/base'
import type { PortState } from './types'
import { createEvent } from 'effector'

// Port CRUD events
export const addPort = createEvent<IPort<any>>()
export const updatePort = createEvent<{ id: string, data: Partial<PortState> }>()
export const removePort = createEvent<string>()

// Value updates
export const updatePortValue = createEvent<{ id: string, value: any }>()

// Bulk operations
export const setPorts = createEvent<Record<string, PortState>>()
export const clearPorts = createEvent()

// Loading states
export const setPortsLoading = createEvent<boolean>()
export const setPortsError = createEvent<Error | null>()
