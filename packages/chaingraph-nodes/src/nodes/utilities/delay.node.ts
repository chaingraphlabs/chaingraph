/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import {
  ExecutionEventImpl,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  ExecutionEventEnum,
  Input,
  Node,
  Output,
  PortNumber,
  StringEnum,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

// Time unit options
const TIME_UNITS = {
  MILLISECONDS: 'milliseconds',
  SECONDS: 'seconds',
  MINUTES: 'minutes',
} as const

@Node({
  type: 'DelayNode',
  title: 'Delay',
  description: 'Pauses flow execution for a specified duration. Useful for rate limiting, timed sequences, or adding delays between operations.',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['delay', 'sleep', 'wait', 'timeout', 'pause', 'timer'],
})
class DelayNode extends BaseNode {
  @Input()
  @PortNumber({
    title: 'Duration',
    description: 'How long to delay execution. Must be a positive number.',
    defaultValue: 1,
    ui: {
      min: 0,
      step: 1,
    },
    required: true,
  })
  duration: number = 1

  @Input()
  @StringEnum(Object.values(TIME_UNITS), {
    title: 'Time Unit',
    description: 'The unit of time for the duration: milliseconds (ms), seconds (s), or minutes (min)',
    defaultValue: TIME_UNITS.SECONDS,
    options: Object.values(TIME_UNITS).map(unit => ({
      id: unit,
      title: unit,
      type: 'string',
      defaultValue: unit,
    })),
    required: true,
  })
  timeUnit: string = TIME_UNITS.SECONDS

  @Output()
  @PortNumber({
    title: 'Delay (ms)',
    description: 'The actual delay time that was applied, in milliseconds',
    integer: true,
  })
  delayMs: number = 0

  /**
   * Convert the duration to milliseconds based on the selected time unit
   */
  private convertToMilliseconds(duration: number, unit: string): number {
    switch (unit) {
      case TIME_UNITS.MILLISECONDS:
        return duration
      case TIME_UNITS.SECONDS:
        return duration * 1000
      case TIME_UNITS.MINUTES:
        return duration * 60 * 1000
      default:
        // Default to seconds if unknown unit
        return duration * 1000
    }
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate duration
    if (this.duration < 0) {
      throw new Error('Duration must be a positive number')
    }

    // Convert to milliseconds
    const delayInMs = Math.floor(this.convertToMilliseconds(this.duration, this.timeUnit))
    this.delayMs = delayInMs

    // Send start event
    await context.sendEvent(
      new ExecutionEventImpl(
        0,
        ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
        new Date(),
        {
          nodeId: this.id || 'unknown',
          log: `Starting delay: ${this.duration} ${this.timeUnit} (${delayInMs}ms)`,
        },
      ),
    )

    // Perform the actual delay
    await new Promise(resolve => setTimeout(resolve, delayInMs))

    // Send completion event
    await context.sendEvent(
      new ExecutionEventImpl(
        0,
        ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
        new Date(),
        {
          nodeId: this.id || 'unknown',
          log: `Delay completed: ${delayInMs}ms elapsed`,
        },
      ),
    )

    return {}
  }
}

export default DelayNode
