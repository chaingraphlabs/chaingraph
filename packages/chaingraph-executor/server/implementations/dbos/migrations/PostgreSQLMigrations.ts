/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Pool } from 'pg'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('pg-migrations')

/**
 * Migration definition
 */
interface Migration {
  /** Unique migration identifier */
  id: string

  /** Human-readable description */
  description: string

  /** Check if migration is already applied */
  check: (pool: Pool) => Promise<boolean>

  /** Apply the migration */
  apply: (pool: Pool) => Promise<void>

  /** Optional rollback for testing/cleanup */
  rollback?: (pool: Pool) => Promise<void>
}

/**
 * PostgreSQL migration manager for event notification system
 *
 * Manages runtime migrations for PostgreSQL functions and triggers
 * that enable real-time event streaming via LISTEN/NOTIFY.
 *
 * Migrations are applied to DBOS system tables, not Drizzle-managed schema.
 */
export class PostgreSQLMigrationManager {
  private readonly pool: Pool
  private readonly migrations: Migration[]

  constructor(pool: Pool) {
    this.pool = pool
    this.migrations = this.defineMigrations()
  }

  /**
   * Run all pending migrations on application start
   *
   * @returns True if all migrations succeeded, false if any failed
   */
  async migrate(): Promise<boolean> {
    logger.info('Starting PostgreSQL runtime migrations')

    let appliedCount = 0
    let skippedCount = 0
    const failedMigrations: string[] = []

    for (const migration of this.migrations) {
      try {
        // Check if already applied
        const isApplied = await migration.check(this.pool)

        if (isApplied) {
          logger.debug({
            id: migration.id,
          }, 'Migration already applied')
          skippedCount++
          continue
        }

        // Apply migration
        logger.info({
          id: migration.id,
          description: migration.description,
        }, 'Applying migration')

        await migration.apply(this.pool)

        // Verify
        const verified = await migration.check(this.pool)
        if (!verified) {
          throw new Error('Migration verification failed')
        }

        logger.info({
          id: migration.id,
        }, 'Migration applied successfully')

        appliedCount++
      } catch (error) {
        failedMigrations.push(migration.id)
        logger.error({
          id: migration.id,
          error: error instanceof Error ? error.message : String(error),
        }, 'Migration failed')
      }
    }

    const success = failedMigrations.length === 0

    logger.info({
      total: this.migrations.length,
      applied: appliedCount,
      skipped: skippedCount,
      failed: failedMigrations.length,
      success,
    }, 'PostgreSQL migrations complete')

    return success
  }

  /**
   * Rollback all migrations (for testing/cleanup)
   */
  async rollback(): Promise<void> {
    logger.warn('Rolling back PostgreSQL migrations')

    for (const migration of [...this.migrations].reverse()) {
      if (!migration.rollback) {
        continue
      }

      try {
        await migration.rollback(this.pool)
        logger.info({
          id: migration.id,
        }, 'Migration rolled back')
      } catch (error) {
        logger.error({
          id: migration.id,
          error: error instanceof Error ? error.message : String(error),
        }, 'Rollback failed')
      }
    }
  }

  /**
   * Define all migrations
   */
  private defineMigrations(): Migration[] {
    return [
      // Migration 1: Stream notification function
      {
        id: 'dbos-stream-notification-function-v1',
        description: 'Create notify_dbos_stream() function for real-time streaming',

        check: async (pool) => {
          const result = await pool.query(`
            SELECT EXISTS (
              SELECT 1
              FROM pg_proc p
              JOIN pg_namespace n ON p.pronamespace = n.oid
              WHERE n.nspname = 'dbos'
                AND p.proname = 'notify_dbos_stream'
            ) AS exists
          `)
          return result.rows[0]?.exists === true
        },

        apply: async (pool) => {
          await pool.query(`
            CREATE OR REPLACE FUNCTION dbos.notify_dbos_stream()
            RETURNS TRIGGER AS $$
            BEGIN
              -- Generic DBOS stream notification
              -- Channel: dbos_stream_{workflow_uuid}_{key}
              -- Payload: {"offset": N}
              -- This enables selective subscription per (workflowId, streamKey)
              PERFORM pg_notify(
                'dbos_stream_' || NEW.workflow_uuid::text || '_' || NEW.key,
                json_build_object('offset', NEW."offset")::text
              );
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
          `)

          logger.info('Created notify_dbos_stream() function')
        },

        rollback: async (pool) => {
          await pool.query(`
            DROP FUNCTION IF EXISTS dbos.notify_dbos_stream() CASCADE;
          `)
        },
      },

      // Migration 2: Stream notification trigger
      {
        id: 'dbos-stream-notification-trigger-v1',
        description: 'Create trigger on dbos.streams for real-time notifications',

        check: async (pool) => {
          const result = await pool.query(`
            SELECT EXISTS (
              SELECT 1
              FROM pg_trigger
              WHERE tgname = 'dbos_stream_notify'
            ) AS exists
          `)
          return result.rows[0]?.exists === true
        },

        apply: async (pool) => {
          // Drop old trigger if exists (migration from old pattern)
          await pool.query(`
            DROP TRIGGER IF EXISTS chaingraph_event_notify
            ON dbos.streams;
          `)

          // Drop new trigger if exists (idempotency)
          await pool.query(`
            DROP TRIGGER IF EXISTS dbos_stream_notify
            ON dbos.streams;
          `)

          // Create trigger
          await pool.query(`
            CREATE TRIGGER dbos_stream_notify
              AFTER INSERT ON dbos.streams
              FOR EACH ROW
              EXECUTE FUNCTION dbos.notify_dbos_stream();
          `)

          logger.info('Created dbos_stream_notify trigger')
        },

        rollback: async (pool) => {
          await pool.query(`
            DROP TRIGGER IF EXISTS dbos_stream_notify
            ON dbos.streams;
          `)
        },
      },
    ]
  }
}
