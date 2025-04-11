/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CreateFlowEvent, UpdateFlowEvent } from './events'
import { attach } from 'effector'
import { $trpcClient } from '../trpc/store'

// Effect for loading flows list
export const loadFlowsListFx = attach({
  source: $trpcClient,
  effect: async (client) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.flow.list.query()
  },
})

// Effect for creating new flow
export const createFlowFx = attach({
  source: $trpcClient,
  effect: async (client, event: CreateFlowEvent) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.flow.create.mutate(event.metadata)
  },
})

// Effect for editing flow
export const editFlowFx = attach({
  source: $trpcClient,
  effect: async (client, event: UpdateFlowEvent) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.flow.edit.mutate({
      flowId: event.id,
      ...event.metadata,
    })
  },
})

// Effect for deleting flow
export const deleteFlowFx = attach({
  source: $trpcClient,
  effect: async (client, id: string) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.flow.delete.mutate(id)
  },
})
