/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { index, integer, jsonb, pgTableCreator, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

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

export const usersTable = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email'),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
}, table => [
  index('users_email_idx').on(table.email),
])

export const externalAccountsTable = pgTable('external_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  externalId: text('external_id').notNull(),
  externalEmail: text('external_email'),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at').defaultNow().notNull(),
}, table => [
  index('external_accounts_user_id_idx').on(table.userId),
  uniqueIndex('external_accounts_provider_external_id_idx').on(table.provider, table.externalId),
])

export type FlowRow = typeof flowsTable.$inferSelect
export type MCPServerRow = typeof mcpServersTable.$inferSelect
export type UserRow = typeof usersTable.$inferSelect
export type ExternalAccountRow = typeof externalAccountsTable.$inferSelect
