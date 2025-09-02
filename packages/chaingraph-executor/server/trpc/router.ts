/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { createContext } from './context'
import process from 'node:process'
import { initTRPC, TRPCError } from '@trpc/server'
import SuperJSON from 'superjson'
import { z } from 'zod'
import { config } from '../utils/config'
import { createLogger } from '../utils/logger'

const logger = createLogger('trpc-router')

// Initialize tRPC
const t = initTRPC.context<typeof createContext>().create({
  transformer: SuperJSON,
  errorFormatter(opts) {
    const { shape, error } = opts
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof z.ZodError
            ? error.cause.flatten()
            : null,
      },
    }
  },
})

const router = t.router
const procedure = t.procedure

// Integration context schemas
const integrationContextSchema = z.object({
  // Add integration contexts as needed
}).passthrough()

// Execution options schema
const executionOptionsSchema = z.object({
  execution: z.object({
    maxConcurrency: z.number().optional(),
    nodeTimeoutMs: z.number().optional(),
    flowTimeoutMs: z.number().optional(),
  }).optional(),
  debug: z.boolean().optional(),
  breakpoints: z.array(z.string()).optional(),
})

export const executionRouter = router({
  // Create execution instance
  create: procedure
    .input(z.object({
      flowId: z.string(),
      options: executionOptionsSchema.optional(),
      integration: integrationContextSchema.optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { executionService } = ctx

      // Load flow from store
      const { loadFlow } = await import('../stores/flow-store')
      const flow = await loadFlow(input.flowId)

      if (!flow) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Flow with id ${input.flowId} not found`,
        })
      }

      const instance = await executionService.createExecution({
        flow,
        options: input.options,
        integrations: input.integration,
      })

      if (input.options?.breakpoints) {
        for (const nodeId of input.options.breakpoints) {
          await executionService.addBreakpoint(instance.id, nodeId)
        }
      }

      return {
        executionId: instance.id,
      }
    }),

  // Start execution
  start: procedure
    .input(z.object({
      executionId: z.string(),
      events: z.array(z.object({
        type: z.string(),
        data: z.record(z.any()).optional(),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { executionService } = ctx

      const instance = await executionService.getInstance(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      await executionService.startExecution(input.executionId, input.events)
      return { success: true }
    }),

  // Stop execution
  stop: procedure
    .input(z.object({
      executionId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { executionService } = ctx

      const instance = await executionService.getInstance(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      await executionService.stopExecution(input.executionId, input.reason)
      return { success: true }
    }),

  // Pause execution
  pause: procedure
    .input(z.object({
      executionId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { executionService } = ctx

      const instance = await executionService.getInstance(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      await executionService.pauseExecution(input.executionId, input.reason)
      return { success: true }
    }),

  // Resume execution
  resume: procedure
    .input(z.object({
      executionId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { executionService } = ctx

      const instance = await executionService.getInstance(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      await executionService.resumeExecution(input.executionId)
      return { success: true }
    }),

  // Get execution state
  getState: procedure
    .input(z.object({
      executionId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const { executionService } = ctx

      const instance = await executionService.getInstance(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      const state = await executionService.getExecutionState(input.executionId)
      const childExecutions = await executionService.getChildExecutions(input.executionId)

      return {
        ...state,
        parentExecutionId: instance.parentExecutionId,
        childExecutionIds: childExecutions,
      }
    }),

  // Get child executions
  getChildExecutions: procedure
    .input(z.object({
      executionId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const { executionService } = ctx

      const childIds = await executionService.getChildExecutions(input.executionId)
      const childStates = await Promise.all(
        childIds.map(async (childId) => {
          const state = await executionService.getExecutionState(childId)
          const instance = await executionService.getInstance(childId)
          return {
            ...state,
            eventData: instance?.context.eventData,
          }
        }),
      )
      return childStates
    }),

  // Get execution tree
  getExecutionTree: procedure
    .input(z.object({
      flowId: z.string(),
      status: z.enum(['all', 'created', 'running', 'completed', 'failed', 'stopped', 'paused']).optional(),
      limit: z.number().min(1).max(500).default(50),
    }))
    .query(async ({ input, ctx }) => {
      const { executionStore } = ctx

      // Get all executions from the store
      const allExecutions = await executionStore.list()

      // Filter executions
      let filteredExecutions = allExecutions

      // Filter by flow ID if provided
      if (input.flowId) {
        filteredExecutions = filteredExecutions.filter(exec => exec.flow.id === input.flowId)
      }

      // Filter by status if provided
      if (input.status && input.status !== 'all') {
        filteredExecutions = filteredExecutions.filter(exec =>
          exec.status.toLowerCase() === input.status,
        )
      }

      // Sort by execution depth first, then by creation time
      filteredExecutions.sort((a, b) => {
        const depthDiff = (a.executionDepth || 0) - (b.executionDepth || 0)
        if (depthDiff !== 0)
          return depthDiff
        return b.createdAt.getTime() - a.createdAt.getTime()
      })

      // Limit results
      filteredExecutions = filteredExecutions.slice(0, input.limit)

      // Build execution tree data
      const childrenMap = new Map<string, number>()
      allExecutions.forEach((exec) => {
        if (exec.parentExecutionId) {
          const count = childrenMap.get(exec.parentExecutionId) || 0
          childrenMap.set(exec.parentExecutionId, count + 1)
        }
      })

      const result = await Promise.all(
        filteredExecutions.map(async (exec) => {
          const childCount = childrenMap.get(exec.id) || 0

          return {
            id: exec.id,
            flowId: exec.flow.id || '',
            flowName: exec.flow.metadata?.name || 'Unnamed Flow',
            status: exec.status,
            parentExecutionId: exec.parentExecutionId,
            executionDepth: exec.executionDepth || 0,
            createdAt: exec.createdAt,
            startedAt: exec.startedAt,
            completedAt: exec.completedAt,
            error: exec.error,
            triggeredByEvent: exec.context.eventData
              ? {
                  eventName: exec.context.eventData.eventName,
                  payload: exec.context.eventData.payload,
                }
              : exec.externalEvents && exec.externalEvents.length > 0
                ? {
                    eventName: exec.externalEvents.map(e => e.type).join(', '),
                    payload: {
                      count: exec.externalEvents.length,
                      source: 'external',
                      events: exec.externalEvents,
                    },
                  }
                : undefined,
            childCount,
          }
        }),
      )

      return result
    }),

  // Subscribe to execution events
  subscribeToEvents: procedure
    .input(z.object({
      executionId: z.string(),
      fromIndex: z.number().optional().default(0),
    }))
    .subscription(async function* ({ input, ctx }) {
      const { executionService, eventBus } = ctx

      const instance = await executionService.getInstance(input.executionId)
      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Execution with id ${input.executionId} not found`,
        })
      }

      logger.info({
        executionId: input.executionId,
        fromIndex: input.fromIndex,
      }, 'Starting event subscription')

      // Subscribe to events from the event bus
      const iterator = eventBus.subscribeToEvents(input.executionId, input.fromIndex)

      try {
        for await (const events of iterator) {
          yield events
        }
      } catch (error) {
        logger.error({
          error,
          executionId: input.executionId,
        }, 'Error in event subscription')
        throw error
      } finally {
        logger.info({
          executionId: input.executionId,
        }, 'Event subscription ended')
      }
    }),

  // Health check procedures
  health: router({
    // Basic health check
    check: procedure
      .query(async ({ ctx }) => {
        const { executionStore, eventBus } = ctx

        const checks = {
          server: true,
          database: false,
          kafka: false,
          mode: config.mode,
          workerId: config.worker.id,
          timestamp: Date.now(),
        }

        // Check database connectivity
        try {
          await executionStore.list() // Simple query to check DB
          checks.database = true
        } catch (error) {
          logger.error({ error }, 'Database health check failed')
        }

        // Check Kafka connectivity if in distributed mode
        if (config.mode === 'distributed') {
          try {
            const { getKafkaClient } = await import('../kafka/client')
            const kafka = getKafkaClient()
            const admin = kafka.admin()
            await admin.connect()
            await admin.listTopics()
            await admin.disconnect()
            checks.kafka = true
          } catch (error) {
            logger.error({ error }, 'Kafka health check failed')
          }
        } else {
          checks.kafka = true // Not applicable in local mode
        }

        const isHealthy = checks.server && checks.database && checks.kafka

        return {
          status: isHealthy ? 'healthy' : 'unhealthy',
          checks,
        }
      }),

    // Detailed worker status
    workerStatus: procedure
      .query(async ({ ctx }) => {
        const { executionStore } = ctx

        // Get all active claims for this worker
        const allExecutions = await executionStore.list()
        const activeClaims: Array<{
          executionId: string
          claimedAt: Date
          expiresAt: Date
          heartbeatAt: Date
        }> = []

        for (const exec of allExecutions) {
          const claim = await executionStore.getClaimForExecution(exec.id)
          if (claim && claim.workerId === config.worker.id && claim.status === 'active') {
            activeClaims.push({
              executionId: exec.id,
              claimedAt: claim.claimedAt,
              expiresAt: claim.expiresAt,
              heartbeatAt: claim.heartbeatAt,
            })
          }
        }

        return {
          workerId: config.worker.id,
          mode: config.mode,
          activeExecutions: activeClaims.length,
          claims: activeClaims,
          config: {
            concurrency: config.worker.concurrency,
            claimTimeoutMs: config.worker.claimTimeoutMs,
            heartbeatIntervalMs: config.worker.heartbeatIntervalMs,
          },
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        }
      }),

    // System metrics
    metrics: procedure
      .query(async ({ ctx }) => {
        const { executionStore } = ctx

        const allExecutions = await executionStore.list()
        const metrics = {
          total: allExecutions.length,
          byStatus: {
            created: 0,
            running: 0,
            paused: 0,
            completed: 0,
            failed: 0,
            stopped: 0,
          },
          avgDuration: 0,
          successRate: 0,
        }

        let totalDuration = 0
        let completedCount = 0

        for (const exec of allExecutions) {
          // Count by status
          const status = exec.status.toLowerCase()
          if (status in metrics.byStatus) {
            metrics.byStatus[status as keyof typeof metrics.byStatus]++
          }

          // Calculate duration for completed executions
          if (exec.completedAt && exec.startedAt) {
            const duration = exec.completedAt.getTime() - exec.startedAt.getTime()
            totalDuration += duration
            completedCount++
          }
        }

        // Calculate averages
        if (completedCount > 0) {
          metrics.avgDuration = totalDuration / completedCount
        }

        const totalFinished = metrics.byStatus.completed + metrics.byStatus.failed + metrics.byStatus.stopped
        if (totalFinished > 0) {
          metrics.successRate = metrics.byStatus.completed / totalFinished
        }

        return metrics
      }),
  }),

  // Debug procedures
  debug: router({
    // Add breakpoint
    addBreakpoint: procedure
      .input(z.object({
        executionId: z.string(),
        nodeId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { executionService } = ctx
        await executionService.addBreakpoint(input.executionId, input.nodeId)
        return { success: true }
      }),

    // Remove breakpoint
    removeBreakpoint: procedure
      .input(z.object({
        executionId: z.string(),
        nodeId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { executionService } = ctx
        await executionService.removeBreakpoint(input.executionId, input.nodeId)
        return { success: true }
      }),

    // Step execution
    step: procedure
      .input(z.object({
        executionId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { executionService } = ctx
        await executionService.stepExecution(input.executionId)
        return { success: true }
      }),

    // Get breakpoints
    getBreakpoints: procedure
      .input(z.object({
        executionId: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        const { executionService } = ctx
        return await executionService.getBreakpoints(input.executionId)
      }),
  }),
})

export type ExecutionRouter = typeof executionRouter
