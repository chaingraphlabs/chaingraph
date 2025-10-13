/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, Output, PortNumber } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'SleepNode',
  title: 'Sleep',
  description: 'Pauses execution for a specified duration in milliseconds. Outputs the actual time slept.',
  category: NODE_CATEGORIES.FLOW,
  tags: ['flow', 'control', 'sleep', 'delay', 'wait', 'pause', 'timer', 'timing'],
})
class SleepNode extends BaseNode {
  @Input()
  @PortNumber({
    title: 'Duration (ms)',
    description: 'Time to sleep in milliseconds',
    defaultValue: 1000,
    min: 0,
  })
  duration: number = 1000

  @Output()
  @PortNumber({
    title: 'Actual Duration (ms)',
    description: 'The actual time slept in milliseconds',
    defaultValue: 0,
  })
  actualDuration: number = 0

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Record start time
    const startTime = performance.now()

    // Create a promise that resolves after the specified duration
    // TODO: use a DBOS timer when available
    const sleepPromise = new Promise<void>((resolve) => {
      setTimeout(resolve, this.duration)
    })

    // Create a promise that rejects if the execution is aborted
    const abortPromise = new Promise<void>((_, reject) => {
      if (context.abortSignal.aborted) {
        reject(new Error('Sleep aborted before starting'))
      }

      context.abortSignal.addEventListener('abort', () => {
        reject(new Error('Sleep aborted'))
      }, { once: true })
    })

    try {
      // Race between sleep and abort
      await Promise.race([sleepPromise, abortPromise])
    } catch (error: any) {
      // If aborted, calculate how long we actually slept before abortion
      const endTime = performance.now()
      this.actualDuration = Math.round(endTime - startTime)
      throw error
    }

    // Calculate actual sleep duration
    const endTime = performance.now()
    this.actualDuration = Math.round(endTime - startTime)

    return {}
  }
}

export default SleepNode
