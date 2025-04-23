/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { index, integer, jsonb, pgTableCreator, text, timestamp } from 'drizzle-orm/pg-core'

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
