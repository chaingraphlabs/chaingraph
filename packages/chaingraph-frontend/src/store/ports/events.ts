import type { IPort } from '@chaingraph/types/port/base'
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
