/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  UpdatePortValueInput,
} from '@badaitech/chaingraph-backend/procedures/flow/update-port-value.ts'
import { trpcClient } from '@badaitech/chaingraph-frontend/api/trpc/client'
import { createEffect } from 'effector'

export const baseUpdatePortValueFx = createEffect(async (params: UpdatePortValueInput) => {
  return trpcClient.flow.updatePortValue.mutate(params)
})
