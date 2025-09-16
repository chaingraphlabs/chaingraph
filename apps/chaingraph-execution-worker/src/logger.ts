/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { createLogger as createExecutorLogger } from '@badaitech/chaingraph-executor/server'

// Re-export the executor's logger with our config
export function createLogger(module: string) {
  return createExecutorLogger(module)
}

// Create a default logger for the app
export const logger = createLogger('execution-worker')
