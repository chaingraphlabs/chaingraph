/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Context } from './context'
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
export const authedProcedure = publicProcedure.use(async (opts) => {
  const { ctx } = opts
  // `ctx.user` is nullable
  if (!ctx.session.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return opts.next({
    ctx,
  })
})

export const flowContextProcedure = publicProcedure.use(async (opts) => {
  const rawInput = await opts.getRawInput()
  const flowId: string | null = rawInput
    && typeof rawInput === 'object'
    && 'flowId' in rawInput
    && typeof rawInput.flowId === 'string'
    ? rawInput.flowId
    : null

  if (!flowId) {
    throw new Error('Parameter flowId is required for this procedure')
  }

  if (opts.type === 'mutation') {
    const result = await opts.next(opts)

    const { ctx: { flowStore } } = opts
    const flow = await flowStore.getFlow(flowId)
    if (!flow) {
      throw new Error('Flow not found')
    }

    // todo: with debouncing
    // await saveFlow(flow)
    return result
  }
  return opts.next(opts)
})

export const createCallerFactory = t.createCallerFactory
