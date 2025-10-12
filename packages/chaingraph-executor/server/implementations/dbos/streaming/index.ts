/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// Public API
export { StreamBridge, StreamBridgeBuilder } from './StreamBridge'

// Internal API (for advanced usage)
export { DBOSStreamSubscriber } from './DBOSStreamSubscriber'
export { PGListenerPool } from './PGListenerPool'
export { PGListener } from './PGListener'

// Types
export type {
  StreamIdentifier,
  StreamChannel,
  StreamNotificationPayload,
  PGListenerStats,
  PoolStats,
  SubscribeOptions,
  PublishOptions,
  PipeOptions,
  StreamPipe,
} from './types'

export {
  POOL_CONFIG,
  STREAM_BATCH_CONFIG,
} from './types'
