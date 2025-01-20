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
      [port.config.id!]: {
        id: port.config.id!,
        nodeId: port.config.nodeId!,
        config: port.config,
        value: port.getValue(),
        parentPortId: port.config.parentPortId,
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
