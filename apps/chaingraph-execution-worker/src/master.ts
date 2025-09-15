/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import cluster from 'node:cluster'
import http from 'node:http'
import process from 'node:process'
import { config } from './config'
import { createLogger } from './logger'

const logger = createLogger('master')

interface WorkerInfo {
  id: number
  pid: number
  restarts: number
  startTime: number
}

const workers = new Map<number, WorkerInfo>()
let isShuttingDown = false

export function startMaster(): void {
  // Spawn initial workers
  for (let i = 0; i < config.workers.count; i++) {
    spawnWorker()
  }

  // Handle worker exit
  cluster.on('exit', (worker, code, signal) => {
    const workerId = worker.id
    const workerInfo = workers.get(workerId)

    if (isShuttingDown) {
      logger.info({ workerId, pid: worker.process.pid }, 'Worker stopped')
      workers.delete(workerId)
      return
    }

    logger.error({
      workerId,
      pid: worker.process.pid,
      code,
      signal,
    }, 'Worker died unexpectedly')

    if (workerInfo && workerInfo.restarts < config.workers.maxRestarts) {
      logger.info({
        workerId,
        attempt: workerInfo.restarts + 1,
        maxRestarts: config.workers.maxRestarts,
      }, 'Restarting worker')
      setTimeout(() => {
        if (!isShuttingDown) {
          spawnWorker(workerInfo.restarts + 1)
        }
      }, config.workers.restartDelay)
    } else {
      logger.error({
        workerId,
        maxRestarts: config.workers.maxRestarts,
      }, 'Worker exceeded max restarts, not restarting')
    }

    workers.delete(workerId)
  })

  // Handle shutdown signals
  process.on('SIGTERM', gracefulShutdown)
  process.on('SIGINT', gracefulShutdown)

  // Simple health endpoint
  startHealthServer()
}

function spawnWorker(restarts = 0): void {
  const worker = cluster.fork({
    ...process.env,
    WORKER_ID: `worker-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  })

  const workerInfo: WorkerInfo = {
    id: worker.id,
    pid: worker.process.pid!,
    restarts,
    startTime: Date.now(),
  }

  workers.set(worker.id, workerInfo)
  logger.info({ workerId: worker.id, pid: worker.process.pid }, 'Spawned worker')
}

async function gracefulShutdown(): Promise<void> {
  if (isShuttingDown)
    return

  isShuttingDown = true
  logger.info('📦 Gracefully shutting down workers...')

  // Send shutdown signal to all workers
  for (const worker of Object.values(cluster.workers || {})) {
    if (worker) {
      worker.send({ type: 'shutdown' })
    }
  }

  // Wait for workers to exit gracefully
  let attempts = 0
  const maxAttempts = 30 // 30 seconds

  while (workers.size > 0 && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    attempts++
  }

  if (workers.size > 0) {
    logger.warn({ remainingWorkers: workers.size }, 'Force killing workers that didn\'t stop gracefully')
    for (const worker of Object.values(cluster.workers || {})) {
      if (worker) {
        worker.kill()
      }
    }
  }

  logger.info('✅ All workers stopped')
  process.exit(0)
}

function startHealthServer(): void {
  const server = http.createServer((req: any, res: any) => {
    if (req.url === '/health') {
      const health = {
        status: 'healthy',
        master_pid: process.pid,
        workers_count: workers.size,
        workers: Array.from(workers.values()).map(w => ({
          id: w.id,
          pid: w.pid,
          restarts: w.restarts,
          uptime: Date.now() - w.startTime,
        })),
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(health, null, 2))
    } else {
      res.writeHead(404)
      res.end('Not found')
    }
  })

  server.listen(config.monitoring.healthPort, () => {
    logger.info({ port: config.monitoring.healthPort }, '📊 Health endpoint started')
  })
}
