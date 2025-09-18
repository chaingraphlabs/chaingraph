/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IExecutionStore } from './interfaces/IExecutionStore'
import { getDatabaseExecutions } from '../utils/db'
import { createLogger } from '../utils/logger'
import { PostgresExecutionStore } from './postgres/postgres-execution-store'

const logger = createLogger('execution-store')

let executionStore: IExecutionStore | null = null

export async function getExecutionStore(): Promise<IExecutionStore> {
  if (!executionStore) {
    const db = await getDatabaseExecutions()
    executionStore = new PostgresExecutionStore(db)
  }
  return executionStore
}
