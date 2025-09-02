/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEvent } from '@badaitech/chaingraph-types'
import type { DBType } from '../../../context'
import { and, eq, gte, sql } from 'drizzle-orm'
import SuperJSON from 'superjson'
import { executionEventsTable } from '../../../stores/postgres/schema'

interface EventBatch {
  executionId: string
  events: ExecutionEvent[]
  timeoutId?: NodeJS.Timeout
}

export class PostgresEventStore {
  private readonly batchSize: number
  private readonly batchTimeout: number
  private readonly eventBatches: Map<string, EventBatch> = new Map()

  constructor(
    private readonly db: DBType,
    batchSize = 50,
    batchTimeout = 100,
  ) {
    this.batchSize = batchSize
    this.batchTimeout = batchTimeout
  }

  /**
   * Add an event to the batch for storage
   */
  async addEvent(executionId: string, event: ExecutionEvent): Promise<void> {
    let batch = this.eventBatches.get(executionId)

    if (!batch) {
      batch = {
        executionId,
        events: [],
      }
      this.eventBatches.set(executionId, batch)
    }

    batch.events.push(event)

    // If batch is full, flush immediately
    if (batch.events.length >= this.batchSize) {
      await this.flushBatch(executionId)
    } else {
      // Otherwise, set a timeout to flush
      if (batch.timeoutId) {
        clearTimeout(batch.timeoutId)
      }

      batch.timeoutId = setTimeout(async () => {
        await this.flushBatch(executionId)
      }, this.batchTimeout)
    }
  }

  /**
   * Flush a batch of events to the database
   */
  private async flushBatch(executionId: string): Promise<void> {
    const batch = this.eventBatches.get(executionId)
    if (!batch || batch.events.length === 0) {
      return
    }

    // Clear the batch immediately to avoid double-flushing
    this.eventBatches.delete(executionId)
    if (batch.timeoutId) {
      clearTimeout(batch.timeoutId)
    }

    try {
      // Insert all events in a single transaction
      await this.db.transaction(async (tx) => {
        const values = batch.events.map(event => ({
          executionId,
          eventIndex: event.index,
          eventType: event.type,
          timestamp: event.timestamp,
          data: SuperJSON.serialize(event.data), // Use SuperJSON to handle cyclic structures
        }))

        await tx.insert(executionEventsTable)
          .values(values)
          .onConflictDoNothing() // Ignore duplicate events
      })
    } catch (error) {
      console.error(`Failed to flush event batch for execution ${executionId}:`, error)
      // Re-add events to batch for retry
      const newBatch = this.eventBatches.get(executionId) || { executionId, events: [] }
      newBatch.events.unshift(...batch.events)
      this.eventBatches.set(executionId, newBatch)
      throw error
    }
  }

  /**
   * Flush all pending batches
   */
  async flushAll(): Promise<void> {
    const executionIds = Array.from(this.eventBatches.keys())
    await Promise.all(executionIds.map(id => this.flushBatch(id)))
  }

  /**
   * Get events for an execution
   */
  async getEvents(
    executionId: string,
    fromIndex?: number,
    limit = 10000,
  ): Promise<ExecutionEvent[]> {
    const conditions = [eq(executionEventsTable.executionId, executionId)]

    if (fromIndex !== undefined) {
      conditions.push(gte(executionEventsTable.eventIndex, fromIndex))
    }

    const startLoadTime = Date.now()
    const results = await this.db
      .select()
      .from(executionEventsTable)
      .where(and(...conditions))
      .orderBy(executionEventsTable.eventIndex)
      .limit(limit)

    const endLoadTime = Date.now()
    const loadDuration = endLoadTime - startLoadTime
    console.warn(`Loading ${results.length} events for execution ${executionId} took ${loadDuration}ms`)

    return results.map(row => ({
      index: row.eventIndex,
      type: row.eventType,
      timestamp: row.timestamp,
      data: SuperJSON.deserialize(row.data as any),
    } as ExecutionEvent))
  }

  /**
   * Get events by type
   */
  async getEventsByType(
    executionId: string,
    eventType: string,
    limit = 100,
  ): Promise<ExecutionEvent[]> {
    const results = await this.db
      .select()
      .from(executionEventsTable)
      .where(
        and(
          eq(executionEventsTable.executionId, executionId),
          eq(executionEventsTable.eventType, eventType),
        ),
      )
      .orderBy(executionEventsTable.eventIndex)
      .limit(limit)

    return results.map(row => ({
      index: row.eventIndex,
      type: row.eventType,
      timestamp: row.timestamp,
      data: SuperJSON.deserialize(row.data as any),
    } as ExecutionEvent))
  }

  /**
   * Get the last event index for an execution
   */
  async getLastEventIndex(executionId: string): Promise<number | null> {
    const result = await this.db
      .select({ maxIndex: sql<number>`MAX(${executionEventsTable.eventIndex})` })
      .from(executionEventsTable)
      .where(eq(executionEventsTable.executionId, executionId))

    return result[0]?.maxIndex ?? null
  }

  /**
   * Delete all events for an execution
   */
  async deleteEvents(executionId: string): Promise<void> {
    await this.db
      .delete(executionEventsTable)
      .where(eq(executionEventsTable.executionId, executionId))
  }
}
