/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  NodeExecutionStatus,
  Output,
  Number as PortNumber,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  title: 'Random Number',
  description: 'Generate a random number within a given range with an optional step.',
  category: NODE_CATEGORIES.MATH,
  tags: ['math', 'random', 'number'],
})
class RandomNode extends BaseNode {
  @Input()
  @PortNumber({
    title: 'Range From',
    description: 'Minimum value for the random number',
  })
  rangeFrom: number = 0

  @Input()
  @PortNumber({
    title: 'Range To',
    description: 'Maximum value for the random number',
  })
  rangeTo: number = 100

  @Input()
  @PortNumber({
    title: 'Step',
    description: 'Step size; 1 ensures integers, values <1 allow floats',
  })
  step: number = 1

  @Output()
  @PortNumber({
    title: 'Result Number',
    description: 'Generated random number',
  })
  result: number = 0

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const min = Number.isFinite(this.rangeFrom) ? this.rangeFrom : 0
    const max = Number.isFinite(this.rangeTo) ? this.rangeTo : 100
    const step = Number.isFinite(this.step) && this.step > 0 ? this.step : 1

    if (min > max) {
      throw new Error('Invalid range: Range From must be less than or equal to Range To.')
    }

    const range = max - min
    const stepsCount = Math.floor(range / step)
    const randomStep = Math.random() * (stepsCount + 1)
    const randomValue = min + randomStep * step
    this.result = step === 1 ? Math.floor(randomValue) : randomValue

    console.log(`Generated random number: ${this.result}`)

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['result', this.result]]),
    }
  }
}

export default RandomNode
