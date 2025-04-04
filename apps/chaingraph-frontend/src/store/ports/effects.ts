/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { RouterInputs } from '@badaitech/chaingraph-trpc/client'
import { trpcClient } from '@badaitech/chaingraph-trpc/client'
import { createEffect } from 'effector'

export type UpdatePortValueInput = Parameters<typeof trpcClient.flow.updatePortValue.mutate>[0]
export type UpdatePortUIInput = Parameters<typeof trpcClient.flow.updatePortUI.mutate>[0]
export const baseUpdatePortValueFx = createEffect(async (params: UpdatePortValueInput) => {
  return trpcClient.flow.updatePortValue.mutate(params)
})

export const baseUpdatePortUIFx = createEffect(async (params: UpdatePortUIInput) => {
  return trpcClient.flow.updatePortUI.mutate(params)
})

export type AddFieldObjectPortInput = RouterInputs['flow']['addFieldObjectPort']
export const addFieldObjectPortFx = createEffect(async (params: AddFieldObjectPortInput) => {
  console.log(params)
  return trpcClient.flow.addFieldObjectPort.mutate(params)
})

export type RemoveFieldObjectPortInput = RouterInputs['flow']['removeFieldObjectPort']
export const removeFiledObjectPortFx = createEffect(async (params: RemoveFieldObjectPortInput) => {
  return trpcClient.flow.removeFieldObjectPort.mutate(params)
})

// appendElementArrayPort
export type AppendElementArrayPortInput = RouterInputs['flow']['appendElementArrayPort']
export const appendElementArrayPortFx = createEffect(async (params: AppendElementArrayPortInput) => {
  return trpcClient.flow.appendElementArrayPort.mutate(params)
})

// removeElementArrayPort
export type RemoveElementArrayPortInput = RouterInputs['flow']['removeElementArrayPort']
export const removeElementArrayPortFx = createEffect(async (params: RemoveElementArrayPortInput) => {
  return trpcClient.flow.removeElementArrayPort.mutate(params)
})
