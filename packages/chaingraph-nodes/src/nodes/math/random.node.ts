/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types';
import {
  BaseNode,
  Input,
  Node,
  NodeExecutionStatus,
  Output,
  Number,
} from '@badaitech/chaingraph-types';
import { NODE_CATEGORIES } from '../../categories';

@Node({
  title: 'Random Number',
  description: 'Generate a random integer within a given range',
  category: NODE_CATEGORIES.MATH,
  tags: ['math', 'random', 'number'],
})
class RandomNode extends BaseNode {
  @Input()
  @Number({
    title: 'Range From',
    description: 'Minimum value for the random number',
  })
  rangeFrom: number = 0;

  @Input()
  @Number({
    title: 'Range To',
    description: 'Maximum value for the random number',
  })
  rangeTo: number = 100;

  @Output()
  @Number({
    title: 'Result Number',
    description: 'Generated random integer',
  })
  result: number = 0;

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const min = isFinite(this.rangeFrom) ? this.rangeFrom : 0;
    const max = isFinite(this.rangeTo) ? this.rangeTo : 100;
    
    if (min > max) {
      throw new Error('Invalid range: Range From must be less than or equal to Range To.');
    }

    const randomValue = Math.floor(Math.random() * (max - min + 1)) + min;
    this.result = randomValue;

    console.log(`Generated random number: ${this.result}`);

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['result', this.result]]),
    };
  }
}

export default RandomNode;