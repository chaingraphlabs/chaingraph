/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { UserStore } from '@badaitech/chaingraph-trpc/server'
import { PgUserStore } from '@badaitech/chaingraph-trpc/server'
import { getDatabaseMain } from '../utils/db'

let userStore: PgUserStore | null = null

export async function getUserStore(): Promise<UserStore> {
  if (!userStore) {
    const db = await getDatabaseMain()
    userStore = new PgUserStore(db)
  }
  return userStore
}
