/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { PortBoolean } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  MultiChannel,
  Node,
  Output,
  PortNumber,
  PortStream,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'WaitForStream',
  title: 'Wait For Stream',
  description: 'Waits for a stream to emit its first element within a timeout. Returns true if triggered, false if timeout expires. If no stream connected, acts as a simple delay.',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['stream', 'wait', 'timeout', 'trigger', 'delay', 'timer', 'durable'],
})
class WaitForStreamNode extends BaseNode {
  @Input()
  @PortStream({
    title: 'Trigger Stream',
    description: 'Optional stream to wait for. If not connected, node waits for duration then returns false.',
    itemConfig: { type: 'any' },
  })
  triggerStream: MultiChannel<any> = new MultiChannel<any>()

  @Input()
  @PortNumber({
    title: 'Timeout (ms)',
    description: 'Maximum time to wait for stream trigger in milliseconds. No limit for durable workflows.',
    defaultValue: 5000,
    min: 0,
  })
  timeout: number = 5000

  @Output()
  @PortBoolean({
    title: 'Triggered',
    description: 'True if stream emitted within timeout, false if timeout expired',
    defaultValue: false,
  })
  triggered: boolean = false

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const iterator = this.triggerStream[Symbol.asyncIterator]()

    // Create timeout promise
    const timeoutPromise = new Promise<{ type: 'timeout' }>((resolve) => {
      setTimeout(() => resolve({ type: 'timeout' }), this.timeout)
    })

    // Create stream promise (waits for first element)
    const streamPromise = iterator.next().then(result => ({
      type: 'stream' as const,
      result,
    }))

    // Create abort promise (for cancellation support)
    const abortPromise = new Promise<never>((_, reject) => {
      if (context.abortSignal.aborted) {
        reject(new Error('Execution aborted before starting'))
      }

      context.abortSignal.addEventListener('abort', () => {
        reject(new Error('Execution aborted'))
      }, { once: true })
    })

    // Race between stream, timeout, and abort
    const winner = await Promise.race([streamPromise, timeoutPromise, abortPromise])

    if (winner.type === 'stream' && !winner.result.done) {
      // Stream triggered within timeout
      this.triggered = true
    } else {
      // Timeout expired or stream completed without value
      this.triggered = false
    }

    // Check for stream errors
    const streamError = this.triggerStream.getError()
    if (streamError) {
      throw streamError
    }

    return {}
  }
}

export default WaitForStreamNode
