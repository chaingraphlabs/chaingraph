/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { TRPCClient as TRPCExecutionClient } from '@badaitech/chaingraph-executor/client'
import type { TRPCClient } from '@badaitech/chaingraph-trpc/client'
import { $trpcExecutionClient } from '@/store/trpc/execution-client'
import { $trpcClient } from '@/store/trpc/store'
import { useUnit } from 'effector-react'

export function useTRPCClient(): TRPCClient {
  const trpcClient = useUnit($trpcClient)
  if (!trpcClient) {
    throw new Error('TRPC client is not initialized')
  }

  return trpcClient
}

export function useTRPCExecutionClient(): TRPCExecutionClient {
  const trpcClient = useUnit($trpcExecutionClient)
  if (!trpcClient) {
    throw new Error('TRPC client is not initialized')
  }

  return trpcClient
}
