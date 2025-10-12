/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventImpl } from '@badaitech/chaingraph-types'

/**
 * PostgreSQL notification payload for event stream
 */
export interface EventNotificationPayload {
  /** Event offset that triggered the notification */
  offset: number
}

/**
 * Active stream subscription state
 */
export interface StreamSubscription {
  /** PostgreSQL notification channel name */
  channel: string

  /** Execution ID being subscribed to */
  executionId: string

  /** Last event offset successfully sent to subscriber */
  lastSentOffset: number

  /** Buffer for batching events before yielding */
  eventBuffer: ExecutionEventImpl[]

  /** Cleanup function to unlisten from channel */
  cleanup: () => Promise<void>

  /** Flag to indicate if subscription is active */
  isActive: boolean
}
