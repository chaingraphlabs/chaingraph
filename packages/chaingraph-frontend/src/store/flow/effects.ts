/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CreateFlowEvent, UpdateFlowEvent } from '@/store'
import { trpcClient } from '@/api/trpc/client.ts'
import { createEffect } from 'effector'

// Effect for loading flows list
export const loadFlowsListFx = createEffect(async () => {
  return trpcClient.flow.list.query()
})

// Effect for creating new flow
export const createFlowFx = createEffect(async (event: CreateFlowEvent) => {
  return trpcClient.flow.create.mutate(event.metadata)
})

// Effect for editing flow
export const editFlowFx = createEffect(async (event: UpdateFlowEvent) => {
  return trpcClient.flow.edit.mutate({
    flowId: event.id,
    ...event.metadata,
  })
})

// Effect for deleting flow
export const deleteFlowFx = createEffect(async (id: string) => {
  return trpcClient.flow.delete.mutate(id)
})
