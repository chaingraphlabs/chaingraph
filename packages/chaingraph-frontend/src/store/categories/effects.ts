import { trpcClient } from '@/api/trpc/client'
import { createEffect } from 'effector'

export const fetchCategorizedNodesFx = createEffect(async () => {
  return await trpcClient.nodeRegistry.getCategorizedNodes.query()
})
