import { publicProcedure } from '../../trpc'

export const hello = publicProcedure.query(() => {
  return 'Hello, World!'
})
