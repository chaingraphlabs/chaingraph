/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// Internal API (for advanced usage)
export { DBOSStreamSubscriber } from './DBOSStreamSubscriber'

export { PGListener } from './PGListener'
export { PGListenerPool } from './PGListenerPool'
// Public API
export { StreamBridge, StreamBridgeBuilder } from './StreamBridge'

// Types
export type {
  PGListenerStats,
  PipeOptions,
  PoolStats,
  PublishOptions,
  StreamChannel,
  StreamIdentifier,
  StreamNotificationPayload,
  StreamPipe,
  SubscribeOptions,
} from './types'

export {
  POOL_CONFIG,
  STREAM_BATCH_CONFIG,
} from './types'
