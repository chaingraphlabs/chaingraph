/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { RouterInputs } from '@badaitech/chaingraph-trpc/client'
import { attach } from 'effector'
import { $trpcClient } from '../trpc/store'

export const baseUpdatePortValueFx = attach({
  source: $trpcClient,
  effect: async (client, params) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.flow.updatePortValue.mutate(params)
  },
})

export const baseUpdatePortUIFx = attach({
  source: $trpcClient,
  effect: async (client, params) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.flow.updatePortUI.mutate(params)
  },
})

export type AddFieldObjectPortInput = RouterInputs['flow']['addFieldObjectPort']
export const addFieldObjectPortFx = attach({
  source: $trpcClient,
  effect: async (client, params: AddFieldObjectPortInput) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.flow.addFieldObjectPort.mutate(params)
  },
})

export type RemoveFieldObjectPortInput = RouterInputs['flow']['removeFieldObjectPort']
export const removeFiledObjectPortFx = attach({
  source: $trpcClient,
  effect: async (client, params: RemoveFieldObjectPortInput) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.flow.removeFieldObjectPort.mutate(params)
  },
})

// appendElementArrayPort
export type AppendElementArrayPortInput = RouterInputs['flow']['appendElementArrayPort']
export const appendElementArrayPortFx = attach({
  source: $trpcClient,
  effect: async (client, params: AppendElementArrayPortInput) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.flow.appendElementArrayPort.mutate(params)
  },
})

// removeElementArrayPort
export type RemoveElementArrayPortInput = RouterInputs['flow']['removeElementArrayPort']
export const removeElementArrayPortFx = attach({
  source: $trpcClient,
  effect: async (client, params: RemoveElementArrayPortInput) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.flow.removeElementArrayPort.mutate(params)
  },
})
