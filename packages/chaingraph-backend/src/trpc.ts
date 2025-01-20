import type { Context } from '@chaingraph/backend/context'
import { initTRPC, TRPCError } from '@trpc/server'
import SuperJSON from 'superjson'
import { ZodError } from 'zod'

const t = initTRPC
  .context<Context>()
  // .meta<Meta>()
  .create({
    transformer: SuperJSON,

    errorFormatter(opts) {
      const { shape, error } = opts
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
              ? error.cause.flatten()
              : null,
        },
      }
    },

    isDev: true, // TODO: set it up properly
    sse: {
      maxDurationMs: 5 * 60 * 1_000, // 5 minutes
      ping: {
        enabled: true,
        intervalMs: 3_000,
      },
      client: {
        reconnectAfterInactivityMs: 5_000,
      },
    },
  })

export const router = t.router

export const publicProcedure = t.procedure

export const authedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts
  // `ctx.user` is nullable
  if (!ctx.session.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return opts.next({
    ctx,
  })
})

export const createCallerFactory = t.createCallerFactory
