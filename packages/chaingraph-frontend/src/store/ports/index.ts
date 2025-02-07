/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortsStore } from './types'
import { createStore } from 'effector'
import {
  addPort,
  clearPorts,
  removePort,
  setPorts,
  setPortsError,
  setPortsLoading,
  updatePort,
  updatePortValue,
} from './events'

const initialState: PortsStore = {
  ports: {},
  isLoading: false,
  error: null,
}

export const $ports = createStore<PortsStore>(initialState)
  // Handle port CRUD operations
  .on(addPort, (state, port) => ({
    ...state,
    ports: {
      ...state.ports,
      [port.id!]: {
        id: port.id!,
        nodeId: port.getConfig().nodeId!,
        config: port.getConfig(),
        value: port.getValue(),
        parentPortId: port.getConfig().parentPortId,
      },
    },
  }))
  .on(updatePort, (state, { id, data }) => ({
    ...state,
    ports: {
      ...state.ports,
      [id]: {
        ...state.ports[id],
        ...data,
      },
    },
  }))
  .on(removePort, (state, id) => {
    const { [id]: _, ...remainingPorts } = state.ports
    return {
      ...state,
      ports: remainingPorts,
    }
  })
  // Handle value updates
  .on(updatePortValue, (state, { id, value }) => ({
    ...state,
    ports: {
      ...state.ports,
      [id]: {
        ...state.ports[id],
        value,
      },
    },
  }))
  // Handle bulk operations
  .on(setPorts, (state, ports) => ({
    ...state,
    ports,
  }))
  .on(clearPorts, state => ({
    ...state,
    ports: {},
  }))
  // Handle loading states
  .on(setPortsLoading, (state, isLoading) => ({
    ...state,
    isLoading,
  }))
  .on(setPortsError, (state, error) => ({
    ...state,
    error,
  }))
