/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IFlowStore } from '../stores/flowStore/types'

export interface ApplicationMetrics {
  timestamp: number
  memory: {
    heapUsed: number
    heapTotal: number
    external: number
    arrayBuffers: number
  }
  flows: {
    total: number
    active: number
    events: {
      total: number
      rate: number // события/сек
    }
  }
  nodes: {
    total: number
    byStatus: Record<string, number>
  }
  edges: {
    total: number
    active: number
  }
  subscriptions: {
    total: number
    active: number
  }
  eventQueues: {
    total: number
    averageSize: number
    maxSize: number
  }
}

export class MetricsCollector {
  private lastEventCount: number = 0
  private lastTimestamp: number = Date.now()
  private eventRate: number = 0

  constructor(
    private readonly flowStore: IFlowStore,
    private readonly intervalMs: number = 5000,
  ) {}

  async collectMetrics(): Promise<ApplicationMetrics> {
    const flows = await this.flowStore.listFlows()
    const now = Date.now()

    const totalEvents = flows.reduce((sum, flow) => {
      return sum + (flow as any).eventQueue.getStats().currentPosition
    }, 0)

    this.eventRate = (totalEvents - this.lastEventCount)
      / ((now - this.lastTimestamp) / 1000)
    this.lastEventCount = totalEvents
    this.lastTimestamp = now

    const nodeMetrics = flows.reduce((acc, flow) => {
      flow.nodes.forEach((node) => {
        acc.total++
        acc.byStatus[node.status] = (acc.byStatus[node.status] || 0) + 1
      })
      return acc
    }, { total: 0, byStatus: {} as Record<string, number> })

    const queueMetrics = flows.reduce((acc, flow) => {
      const stats = (flow as any).eventQueue.getStats()
      acc.total++
      acc.totalSize += stats.bufferSize
      acc.maxSize = Math.max(acc.maxSize, stats.bufferSize)
      return acc
    }, { total: 0, totalSize: 0, maxSize: 0 })

    return {
      timestamp: now,
      memory: {
        // eslint-disable-next-line node/prefer-global/process
        ...process.memoryUsage(),
      },
      flows: {
        total: flows.length,
        active: flows.filter(f => f.nodes.size > 0).length,
        events: {
          total: totalEvents,
          rate: this.eventRate,
        },
      },
      nodes: nodeMetrics,
      edges: {
        total: flows.reduce((sum, f) => sum + f.edges.size, 0),
        active: flows.reduce((sum, f) =>
          sum + Array.from(f.edges.values())
            .filter(e => e.status === 'active')
            .length, 0),
      },
      subscriptions: {
        total: flows.reduce((sum, f) =>
          sum + (f as any).eventQueue.getStats().subscriberCount, 0),
        active: flows.reduce((sum, f) =>
          sum + (f as any).eventQueue.getStats().activeSubscriberCount, 0),
      },
      eventQueues: {
        total: queueMetrics.total,
        averageSize: queueMetrics.totalSize / queueMetrics.total,
        maxSize: queueMetrics.maxSize,
      },
    }
  }

  startMonitoring() {
    const formatBytes = (bytes: number) =>
      `${(bytes / 1024 / 1024).toFixed(2)} MB`

    setInterval(async () => {
      const metrics = await this.collectMetrics()

      console.log('\n=== Application Metrics ===')
      console.log(`Timestamp: ${new Date(metrics.timestamp).toISOString()}`)

      console.log('\nMemory:')
      console.log(`  Heap Used: ${formatBytes(metrics.memory.heapUsed)}`)
      console.log(`  Heap Total: ${formatBytes(metrics.memory.heapTotal)}`)
      console.log(`  External: ${formatBytes(metrics.memory.external)}`)

      console.log('\nFlows:')
      console.log(`  Total: ${metrics.flows.total}`)
      console.log(`  Active: ${metrics.flows.active}`)
      console.log(`  Events Total: ${metrics.flows.events.total}`)
      console.log(`  Events Rate: ${metrics.flows.events.rate.toFixed(2)}/s`)

      console.log('\nNodes:')
      console.log(`  Total: ${metrics.nodes.total}`)
      console.log('  By Status:')
      Object.entries(metrics.nodes.byStatus).forEach(([status, count]) => {
        console.log(`    ${status}: ${count}`)
      })

      console.log('\nEdges:')
      console.log(`  Total: ${metrics.edges.total}`)
      console.log(`  Active: ${metrics.edges.active}`)

      console.log('\nSubscriptions:')
      console.log(`  Total: ${metrics.subscriptions.total}`)
      console.log(`  Active: ${metrics.subscriptions.active}`)

      console.log('\nEvent Queues:')
      console.log(`  Total: ${metrics.eventQueues.total}`)
      console.log(`  Average Size: ${metrics.eventQueues.averageSize.toFixed(2)}`)
      console.log(`  Max Size: ${metrics.eventQueues.maxSize}`)

      console.log('\n=========================\n')
    }, this.intervalMs)
  }
}
