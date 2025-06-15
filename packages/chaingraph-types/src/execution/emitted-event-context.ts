/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Context for emitted events context for triggering event listener nodes.
 */
export interface EmittedEventContext {
  eventName: string
  payload?: Record<string, any>
  emittedBy?: string // Node ID that emitted the event
}
