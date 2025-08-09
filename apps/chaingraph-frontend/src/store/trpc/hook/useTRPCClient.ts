/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { TRPCClient } from '@badaitech/chaingraph-trpc/client'
import { $trpcClient } from '@/store/trpc/store'
import { useUnit } from 'effector-react'

export function useTRPCClient(): TRPCClient {
  const trpcClient = useUnit($trpcClient)
  if (!trpcClient) {
    throw new Error('TRPC client is not initialized')
  }

  return trpcClient
}
