/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { index, integer, jsonb, pgTableCreator, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'

const pgTable = pgTableCreator(name => `chaingraph_${name}`)

export const flowsTable = pgTable('flows', {
  id: text('id').primaryKey(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  ownerId: text('owner_id'),
  parentId: text('parent_id'),
  version: integer('version').default(1).notNull(),
}, table => [
  index('flows_owner_id_created_at_idx').on(table.ownerId, table.createdAt),
  index('flows_owner_id_updated_at_idx').on(table.ownerId, table.updatedAt),
  index('flows_parent_id_idx').on(table.parentId),
])

export const executionsTable = pgTable('executions', {
  id: text('id').primaryKey(),
  flowId: text('flow_id').notNull(),
  ownerId: text('owner_id'),
  parentExecutionId: text('parent_execution_id'),
  status: text('status').notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  errorMessage: text('error_message'),
  errorNodeId: text('error_node_id'),
  executionDepth: integer('execution_depth').default(0).notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  externalEvents: jsonb('external_events').$type<Record<string, any>>(),
}, table => [
  index('executions_owner_id_created_at_idx').on(table.ownerId, table.createdAt),
  index('executions_parent_execution_id_idx').on(table.parentExecutionId),
  index('executions_flow_id_idx').on(table.flowId),
  index('executions_status_idx').on(table.status),
  index('executions_started_at_idx').on(table.startedAt),
])

export const executionEventsTable = pgTable('execution_events', {
  executionId: text('execution_id').notNull(),
  eventIndex: integer('event_index').notNull(),
  eventType: text('event_type').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  data: jsonb('data').notNull(),
}, table => [
  primaryKey({ columns: [table.executionId, table.eventIndex] }),
  index('execution_events_execution_id_timestamp_idx').on(table.executionId, table.timestamp),
  index('execution_events_execution_id_event_type_idx').on(table.executionId, table.eventType),
  index('execution_events_execution_id_event_index_idx').on(table.executionId, table.eventIndex),
])

export const mcpServersTable = pgTable('mcp_servers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  authHeaders: jsonb('auth_headers').notNull().$type<Array<{ key: string, value: string }>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, table => [
  index('mcp_servers_user_id_idx').on(table.userId),
  index('mcp_servers_user_id_updated_at_idx').on(table.userId, table.updatedAt),
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
])

export type FlowRow = typeof flowsTable.$inferSelect
export type ExecutionRow = typeof executionsTable.$inferSelect
export type ExecutionClaimRow = typeof executionClaimsTable.$inferSelect
export type MCPServerRow = typeof mcpServersTable.$inferSelect
export type ExecutionEventRow = typeof executionsTable.$inferSelect
