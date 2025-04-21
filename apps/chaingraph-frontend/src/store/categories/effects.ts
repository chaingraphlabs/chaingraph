/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { $trpcClient } from '@/store/trpc/store'
import { attach } from 'effector'

export const fetchCategorizedNodesFx = attach({
  source: $trpcClient,
  effect: async (client) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.nodeRegistry.getCategorizedNodes.query()
  },
})
