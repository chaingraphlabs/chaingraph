import { publicProcedure } from '@chaingraph/backend/trpc'
import { z } from 'zod'

export const toUpperCase = publicProcedure
  .input(z.string())
  .query(({ input }) => {
    return input.toUpperCase()
  })

export const complexData = publicProcedure
  .query(() => {
    return {
      date: new Date(),
      map: new Map([['key', 'value']]),
      set: new Set([1, 2, 3]),
      bigint: BigInt(9007199254740991),
      nested: {
        array: [1, 2, 3],
        null: null,
      },
    }
  })
