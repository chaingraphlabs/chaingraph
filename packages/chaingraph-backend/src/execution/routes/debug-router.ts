/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { publicProcedure, router } from '../../trpc'

export const debugRouter = router({
  // Add breakpoint
  addBreakpoint: publicProcedure
    .input(z.object({
      executionId: z.string(),
      nodeId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const instance = await ctx.executionService.getInstance(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      await ctx.executionService.addBreakpoint(input.executionId, input.nodeId)
      return { success: true }
    }),

  // Remove breakpoint
  removeBreakpoint: publicProcedure
    .input(z.object({
      executionId: z.string(),
      nodeId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const instance = await ctx.executionService.getInstance(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      await ctx.executionService.removeBreakpoint(input.executionId, input.nodeId)
      return { success: true }
    }),

  // Step execution
  step: publicProcedure
    .input(z.object({
      executionId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const instance = await ctx.executionService.getInstance(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      await ctx.executionService.stepExecution(input.executionId)
      return { success: true }
    }),

  // Get breakpoints
  getBreakpoints: publicProcedure
    .input(z.object({
      executionId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const instance = await ctx.executionService.getInstance(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      return ctx.executionService.getBreakpoints(input.executionId)
    }),
})
