/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Flow } from '@badaitech/chaingraph-types'
import type { JSONValue } from '../../../../chaingraph-types/src/utils/json'
import type { DBType } from '../../context'
import { asc, desc, eq, sql } from 'drizzle-orm'

import { flowsTable } from './schema'

interface SerializableFlow {
  id: string
  ownerId: string
  parentId: string
  version: number
  serialize: () => JSONValue
}

export async function serializableFlow(flow: Flow): Promise<SerializableFlow> {
  return {
    id: flow.id || '',
    ownerId: flow.metadata.ownerID || '',
    parentId: flow.metadata.parentId || '',
    version: flow.metadata.version || 1,
    serialize: () => ({
      ...flow.serialize(),
      createdAt: flow.metadata.createdAt.toISOString(),
      updatedAt: flow.metadata.updatedAt.toISOString(),
    }),
  }
}

export async function saveFlow(db: DBType, flow: SerializableFlow): Promise<number> {
  const startTime = Date.now()
  const data = flow.serialize()

  // Insert or update the flow
  await db.insert(flowsTable).values({
    id: flow.id,
    ownerId: flow.ownerId,
    parentId: flow.parentId || null,
    version: flow.version || 1,
    data,
  }).onConflictDoUpdate({
    target: flowsTable.id,
    set: {
      data,
      version: sql`${flowsTable.version} + 1`,
    },
  })

  // Query the database to get the current version
  const result = await db.select({
    version: flowsTable.version,
  })
    .from(flowsTable)
    .where(eq(flowsTable.id, flow.id))

  const duration = Date.now() - startTime
  console.debug(`[DB] Updated flow ${flow.id} to version ${result[0]?.version} for ${duration}ms`)

  return result[0]?.version || flow.version
}

export async function deleteFlow(db: DBType, id: string) {
  return db.delete(flowsTable).where(eq(flowsTable.id, id))
}

export type ListOrderBy =
  'createdAtDesc' |
  'createdAtAsc' |
  'updatedAtDesc' |
  'updatedAtAsc'

export async function listFlows<T>(
  db: DBType,
  ownerId: string,
  orderBy: ListOrderBy,
  limit: number,
  deserialize: (data: JSONValue) => T,
) {
  const orderByMap = {
    createdAtDesc: desc(flowsTable.createdAt),
    createdAtAsc: asc(flowsTable.createdAt),
    updatedAtDesc: desc(flowsTable.updatedAt),
    updatedAtAsc: asc(flowsTable.updatedAt),
  }

  const result = await db
    .select()
    .from(flowsTable)
    .where(
      eq(flowsTable.ownerId, ownerId),
    )
    .orderBy(orderByMap[orderBy])
    .limit(limit)

  return result
    .filter(row => row.data)
    .map(row => deserialize(row.data))
}

export async function loadFlow<T>(db: DBType, id: string, deserialize: (data: JSONValue) => T): Promise<T | null> {
  const result = await db.select().from(flowsTable).where(eq(flowsTable.id, id))
  if (!result || result.length === 0 || !result[0]?.data) {
    return null
  }

  return deserialize(result[0].data)
}
