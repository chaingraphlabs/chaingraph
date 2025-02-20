/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPortConfig } from '@badaitech/chaingraph-types'
import type { PortState } from './types'
import { createEvent } from 'effector'

// Port CRUD events
export const updatePort = createEvent<{
  id: string
  data: Partial<PortState>
  nodeVersion: number
}>()

export const updatePortUI = createEvent<{
  id: string
  ui: any
}>()

// Value updates
export const requestUpdatePortValue = createEvent<{ id: string, value: any }>()

// UI updates
export const requestUpdatePortUI = createEvent<{ id: string, ui: any }>()

// Object port updates
export const addFieldObjectPort = createEvent<{ id: string, config: IPortConfig, key: string }>()
export const removeFieldObjectPort = createEvent<{ id: string, key: string }>()
