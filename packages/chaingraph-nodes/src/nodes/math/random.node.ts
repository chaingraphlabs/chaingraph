/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, Output, Number as PortNumber } from '@badaitech/chaingraph-types'
import { Decimal } from 'decimal.js'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'RandomNode',
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
  // Convert inputs to Decimal objects for precise calculations
    const min = Number.isFinite(this.rangeFrom) ? new Decimal(this.rangeFrom) : new Decimal(0)
    const max = Number.isFinite(this.rangeTo) ? new Decimal(this.rangeTo) : new Decimal(100)
    const step = Number.isFinite(this.step) && this.step > 0 ? new Decimal(this.step) : new Decimal(1)

    // Validate range
    if (min.greaterThan(max)) {
      throw new Error('Invalid range: Range From must be less than or equal to Range To.')
    }

    // Calculate the number of possible steps in the range
    const range = max.minus(min)
    const stepsCount = range.dividedBy(step).floor()

    // Generate random integer step count (0 to stepsCount, inclusive)
    const randomStepCount = Decimal.floor(new Decimal(Math.random()).times(stepsCount.plus(1)))

    // Calculate the exact value by adding the precise number of steps to min
    const randomValue = min.plus(randomStepCount.times(step))

    // Convert back to number for output
    this.result = randomValue.toNumber()

    return {}
  }
}

export default RandomNode
