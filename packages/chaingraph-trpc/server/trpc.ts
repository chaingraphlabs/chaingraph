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
import { authConfig } from './auth/config'

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

  // If auth is globally disabled or in dev mode, allow the request
  if (!authConfig.enabled || authConfig.devMode) {
    // console.debug('authedProcedure: Auth is disabled or in dev mode, skipping auth check')
    return opts.next()
  }

  // Check if user is authenticated
  if (!ctx.session.isAuthenticated) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return opts.next({
    ctx: {
      ...ctx,
      user: ctx.session.user,
    },
  })
})

export const adminProcedure = authedProcedure.use(async (opts) => {
  const { ctx } = opts

  // Skip check in dev mode
  if (authConfig.devMode) {
    return opts.next()
  }

  // Check if user is an admin
  if (ctx.session.user?.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    })
  }

  return opts.next()
})

export const flowContextProcedure = authedProcedure.use(async (opts) => {
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

  // Check if user has access to the flow
  const { ctx } = opts

  if (!ctx.session.user?.id) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'User not authenticated',
    })
  }

  if (ctx.session.user.role === 'admin' || ctx.session.user.id === 'service') {
    // Admins have access to all flows
    return opts.next(opts)
  }

  if (ctx.session.user.role === 'agent') {
    // TODO: needs to check if the agent is allowed to access the flow somehow
    return opts.next(opts)
  }

  if (!await ctx.flowStore.hasAccess(flowId, ctx.session.user.id)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'User does not have access to this flow or flow not found',
    })
  }

  // if (opts.type === 'mutation') {
  //   const result = await opts.next(opts)
  //
  //   const { ctx: { flowStore } } = opts
  //   const flow = await flowStore.getFlow(flowId)
  //   if (!flow) {
  //     throw new Error('Flow not found')
  //   }
  //
  //   // todo: with debouncing
  //   // await saveFlow(flow)
  //   return result
  // }
  return opts.next(opts)
})

export const executionContextProcedure = authedProcedure.use(async (opts) => {
  const rawInput = await opts.getRawInput()
  const executionId: string | null = rawInput
    && typeof rawInput === 'object'
    && 'executionId' in rawInput
    && typeof rawInput.executionId === 'string'
    ? rawInput.executionId
    : null

  if (!executionId) {
    throw new Error('Parameter executionId is required for this procedure')
  }

  // Check if user has access to the flow
  const { ctx } = opts

  if (!ctx.session.user?.id) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'User not authenticated',
    })
  }

  if (ctx.session.user.role === 'admin') {
    // Admins have access to all flows
    return opts.next(opts)
  }

  // TODO: make sure that we read from the cache when persistent storage is implemented
  const execution = await ctx.executionService.getInstance(executionId)
  if (!execution) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Execution not found',
    })
  }

  if (!await ctx.flowStore.hasAccess(execution.flow.id, ctx.session.user.id)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'User does not have access to this flow',
    })
  }

  return opts.next(opts)
})

export const createCallerFactory = t.createCallerFactory
