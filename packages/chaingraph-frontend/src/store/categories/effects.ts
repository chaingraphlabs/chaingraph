import { trpcClient } from '@/api/trpc/client'
import { createEffect } from 'effector'

export const fetchCategorizedNodesFx = createEffect(async () => {
  return trpcClient.nodeRegistry.getCategorizedNodes.query()
})
