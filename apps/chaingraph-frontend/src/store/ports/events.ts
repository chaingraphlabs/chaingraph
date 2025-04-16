/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPortConfig } from '@badaitech/chaingraph-types'
import type { PortState } from './types'
import { portsDomain } from '../domains'

// Port CRUD events
export const updatePort = portsDomain.createEvent<{
  id: string
  data: Partial<PortState>
  nodeVersion: number
}>()

export const updatePortValue = portsDomain.createEvent<{
  nodeId: string
  portId: string
  value: any
}>()

export const updatePortUI = portsDomain.createEvent<{
  nodeId: string
  portId: string
  ui: any
}>()

// Value updates
export const requestUpdatePortValue = portsDomain.createEvent<{
  nodeId: string
  portId: string
  value: any
}>()

// UI updates
export const requestUpdatePortUI = portsDomain.createEvent<{
  nodeId: string
  portId: string
  ui: any
}>()

// Object port updates
export const addFieldObjectPort = portsDomain.createEvent<{
  nodeId: string
  portId: string
  config: IPortConfig
  key: string
}>()
export const removeFieldObjectPort = portsDomain.createEvent<{
  nodeId: string
  portId: string
  key: string
}>()

export const appendElementArrayPort = portsDomain.createEvent<{
  nodeId: string
  portId: string
  value: any
}>()

export const removeElementArrayPort = portsDomain.createEvent<{
  nodeId: string
  portId: string
  index: number
}>()
