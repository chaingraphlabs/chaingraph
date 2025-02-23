/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { JSONValue } from '@badaitech/chaingraph-types/utils/json'
import { eq } from 'drizzle-orm'
import { db } from './connection'
import { flowsTable } from './schema'

interface SerializableFlow {
  id: string
  serialize: () => JSONValue
}

export async function saveFlow(flow: SerializableFlow) {
  const data = flow.serialize()

  return db.insert(flowsTable).values({
    id: flow.id,
    data,
  }).onConflictDoUpdate({ target: flowsTable.id, set: { data } })
}

export async function loadFlow<T>(id: string, deserialize: (data: JSONValue) => T): Promise<T | null> {
  const result = await db.select().from(flowsTable).where(eq(flowsTable.id, id))
  if (!result) {
    return null
  }

  return deserialize(result[0].data)
}
