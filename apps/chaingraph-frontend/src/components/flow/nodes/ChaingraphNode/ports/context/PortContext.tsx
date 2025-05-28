/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeData } from '@/store/edges/types'
import type { IPortConfig } from '@badaitech/chaingraph-types'
import { createContext } from 'react'

// Parameter interfaces for callbacks
export interface UpdatePortValueParams {
  nodeId: string
  portId: string
  value: any
}

export interface UpdatePortUIParams {
  nodeId: string
  portId: string
  ui: Record<string, any>
}

export interface AddFieldObjectPortParams {
  nodeId: string
  portId: string
  config: IPortConfig
  key: string
  defaultValue?: any
}

export interface RemoveFieldObjectPortParams {
  nodeId: string
  portId: string
  key: string
}

export interface AddElementArrayPortParams {
  nodeId: string
  portId: string
  value: any
  itemConfig: IPortConfig
}

export interface RemoveElementArrayPortParams {
  nodeId: string
  portId: string
  index: number
}

export interface PortContextValue {
  // UI callbacks
  updatePortValue: (params: UpdatePortValueParams) => void
  updatePortUI: (params: UpdatePortUIParams) => void
  // Object port callbacks
  addFieldObjectPort: (params: AddFieldObjectPortParams) => void
  removeFieldObjectPort: (params: RemoveFieldObjectPortParams) => void
  // Array port callbacks
  appendElementArrayPort: (params: AddElementArrayPortParams) => void
  removeElementArrayPort: (params: RemoveElementArrayPortParams) => void
  // Edge utilities
  getEdgesForPort: (portId: string) => EdgeData[]
}

// Create a default context value with no-op functions
const defaultContext: PortContextValue = {
  updatePortValue: () => { },
  updatePortUI: () => { },
  addFieldObjectPort: () => { },
  removeFieldObjectPort: () => { },
  appendElementArrayPort: () => { },
  removeElementArrayPort: () => { },
  getEdgesForPort: () => [],
}

// Create the React context
export const PortContext = createContext<PortContextValue>(defaultContext)
