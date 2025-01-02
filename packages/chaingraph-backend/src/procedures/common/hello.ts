import { publicProcedure } from '@chaingraph/backend/trpc'

export const hello = publicProcedure.query(() => {
  return 'Hello, World!'
})
