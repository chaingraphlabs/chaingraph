/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionExternalEvent,
  ExecutionOptions,
  IntegrationContext,
} from '@badaitech/chaingraph-types'
import type {
  ExecutionStatus,
} from '../../../types'
import { index, integer, jsonb, pgTableCreator, text, timestamp } from 'drizzle-orm/pg-core'

const pgTable = pgTableCreator(name => `chaingraph_${name}`)

export const executionsTable = pgTable('executions', {
  id: text('id').primaryKey(),
  flowId: text('flow_id').notNull(),
  ownerId: text('owner_id').notNull(), // ownerId is the owner of the flow
  rootExecutionId: text('root_execution_id'),
  parentExecutionId: text('parent_execution_id'),
  status: text('status', {
    enum: ['created', 'running', 'paused', 'completed', 'failed', 'stopped'],
  }).default('created').notNull().$type<ExecutionStatus>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  errorMessage: text('error_message'),
  errorNodeId: text('error_node_id'),
  executionDepth: integer('execution_depth').default(0).notNull(),
  options: jsonb('options').$type<ExecutionOptions>(),
  integration: jsonb('integration').$type<IntegrationContext>(),
  externalEvents: jsonb('external_events').$type<ExecutionExternalEvent[]>(),
}, table => [
  index('executions_flow_depth_created_idx').on(table.flowId, table.executionDepth, table.createdAt),
  index('executions_root_execution_id_idx').on(table.rootExecutionId),
  index('executions_parent_execution_id_idx').on(table.parentExecutionId),
  index('executions_flow_id_idx').on(table.flowId),
  index('executions_status_idx').on(table.status),
  index('executions_started_at_idx').on(table.startedAt),
])

export const executionClaimsTable = pgTable('execution_claims', {
  executionId: text('execution_id').primaryKey(),
  workerId: text('worker_id').notNull(),
  claimedAt: timestamp('claimed_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  heartbeatAt: timestamp('heartbeat_at').defaultNow().notNull(),
  status: text('status').notNull().$type<'active' | 'released' | 'expired'>(),
}, table => [
  index('execution_claims_worker_id_idx').on(table.workerId),
  index('execution_claims_expires_at_idx').on(table.expiresAt),
  index('execution_claims_status_idx').on(table.status),
  index('execution_claims_expires_at_status_idx').on(table.expiresAt, table.status),
])

export type ExecutionRow = typeof executionsTable.$inferSelect
export type ExecutionClaimRow = typeof executionClaimsTable.$inferSelect
